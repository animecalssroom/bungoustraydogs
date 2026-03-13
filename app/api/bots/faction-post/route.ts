import { NextRequest, NextResponse } from 'next/server'
import { verifyBotSecret, getBotProfile, updateLastBotPostAt, pickFallback } from '@/src/lib/bots/bot-utils'
import { fetchFactionContext } from '@/src/lib/bots/context-fetcher'
import { generateBotPost } from '@/src/lib/bots/npc-logic'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body to check for a force flag
  let body: any = {}
  try {
    body = await request.json()
  } catch (e) {
    body = {}
  }

  const results: Record<string, string> = {}
  const apiKey = process.env.GEMINI_API_KEY
  const force = body.force === true

  for (const botConfig of Object.values(ALL_BOT_CONFIGS)) {
    // Only bots that have a faction post to the feed
    if (!botConfig.faction) {
      results[botConfig.username] = 'skipped: no faction'
      continue
    }

    try {
      const profile = await getBotProfile(botConfig.username)
      if (!profile) { results[botConfig.username] = 'not found'; continue }
      if (profile.is_bot_paused) { results[botConfig.username] = 'paused'; continue }

      // --- IMPROVED INTERVAL CHECK ---
      if (profile.last_bot_post_at && !force) {
        const lastPostDate = new Date(profile.last_bot_post_at)
        const lastPostTime = lastPostDate.getTime()
        
        // Ensure we have a valid number before comparing
        if (!isNaN(lastPostTime)) {
          const intervalMs = (botConfig.postIntervalHours ?? 8) * 60 * 60 * 1000
          const timeElapsed = Date.now() - lastPostTime

          if (timeElapsed < intervalMs) {
            results[botConfig.username] = 'skipped: interval not reached'
            continue
          }
        }
      }

      const wins = profile.duel_wins ?? 0
      const losses = profile.duel_losses ?? 0
      const systemPrompt = (botConfig.personality ?? '')
        .replace('{wins}', String(wins))
        .replace('{losses}', String(losses))

      let content: string | null = null

      if (apiKey) {
        try {
          const context = await fetchFactionContext(botConfig.faction)
          content = await generateBotPost(systemPrompt, context, apiKey)
        } catch (geminiErr) {
          console.error(`[bot faction-post] Gemini failed for ${botConfig.username}:`, geminiErr)
        }
      }

      // Fallback logic
      if (!content) {
        content = pickFallback(botConfig.fallbackPosts ?? [], wins, losses)
      }

      if (!content) {
        results[botConfig.username] = 'skipped: no content'
        continue
      }

      // Insert message into Supabase
      const { error } = await supabaseAdmin
        .from('faction_messages')
        .insert({
          user_id: profile.id,
          faction_id: botConfig.faction,
          content,
          sender_character: profile.character_name ?? botConfig.username,
          sender_rank: 'Operative',
          is_bot_post: true,
        })

      if (error) {
        console.error(`[bot faction-post] insert failed for ${botConfig.username}:`, error)
        results[botConfig.username] = `insert error: ${error.message}`
        continue
      }

      // Update the timestamp in the DB
      await updateLastBotPostAt(profile.id)
      results[botConfig.username] = 'posted'

    } catch (err) {
      console.error(`[bot faction-post] error for ${botConfig.username}:`, err)
      results[botConfig.username] = `error: ${String(err)}`
    }
  }

  return NextResponse.json({ success: true, results })
}