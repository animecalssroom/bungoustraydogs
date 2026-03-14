import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { verifyBotSecret, getBotProfile, getBotProfiles, updateLastBotPostAt } from '@/src/lib/bots/bot-utils'
import { fetchBotMentions, fetchFactionContext } from '@/src/lib/bots/context-fetcher'
import { generateBotReply } from '@/src/lib/bots/npc-logic'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import { fetchWithRetry } from '@/src/lib/bots/fetch-retry'
import type { BotConfig } from '@/src/lib/bots/bot-config'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summaries: Array<{ bot: string; replies: number; skipped?: string }> = []
  const configs = Object.values(ALL_BOT_CONFIGS) as BotConfig[]
  const usernames = configs.map((c) => c.username)
  const profiles = await getBotProfiles(usernames)
  const profileMap = new Map(profiles.map((p: any) => [p.username, p]))

  for (const cfg of configs) {
    try {
      const profile = profileMap.get(cfg.username)

      if (!profile) {
        summaries.push({ bot: cfg.username, replies: 0, skipped: 'profile not found' })
        continue
      }

      if (profile.is_bot_paused) {
        summaries.push({ bot: cfg.username, replies: 0, skipped: 'paused' })
        continue
      }

      // Only check mentions since last post (or last 24h if never posted)
      const since =
        profile.last_bot_post_at ??
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const mentions = await fetchBotMentions(profile.username, since)

      if (!mentions?.length) {
        summaries.push({ bot: cfg.username, replies: 0 })
        continue
      }

      // Fetch faction context once per bot — passed to Gemini for richer replies
      const factionContext = await fetchFactionContext(
        profile.faction ?? cfg.faction,
        5,
      )

      const apiKey = process.env.GEMINI_API_KEY ?? ''
      let replies = 0

      for (const mention of mentions) {
        // Never reply to other bots
        if (mention.is_bot) continue

        // Roll reply chance
        if (Math.random() > (cfg.replyChance ?? 0.5)) continue

        // Generate reply — pass factionContext so Gemini has world context
        // ── FIX: factionContext was fetched but never used before ──────────
        const reply = await generateBotReply(
          cfg.personality ?? '',
          mention.content,
          apiKey,
          factionContext,  // was missing before
        )

        if (!reply) continue

        try {
          // ── FIX: was posting to 'transmission_logs' — correct table is 'faction_messages' ──
          const { error } = await supabaseAdmin
            .from('faction_messages')
            .insert({
              faction_id: profile.faction ?? cfg.faction,
              user_id: profile.id,
              sender_character: profile.character_name ?? cfg.username,
              sender_rank: 'Operative',
              content: reply,
              is_bot_post: true,
              bot_replied_to: mention.id ?? null,
            })

          if (error) {
            console.error(`[check-replies] insert failed for ${cfg.username}:`, error.message)
            continue
          }

          replies += 1
          await updateLastBotPostAt(profile.id)

          // Cap at 2 replies per bot per check cycle to avoid spam
          if (replies >= 2) break
        } catch (insertErr) {
          console.error(`[check-replies] unexpected insert error for ${cfg.username}:`, insertErr)
        }
      }

      summaries.push({ bot: cfg.username, replies })
    } catch (botErr) {
      // Isolate failures — one bot error should never stop the loop
      console.error(`[check-replies] bot processing error for ${cfg.username}:`, botErr)
      summaries.push({ bot: cfg.username, replies: 0, skipped: 'error' })
    }
  }

  return NextResponse.json({ success: true, summaries })
}