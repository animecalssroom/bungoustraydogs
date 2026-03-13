import { NextRequest, NextResponse } from 'next/server'
import { verifyBotSecret, getBotProfile, updateLastBotPostAt } from '@/src/lib/bots/bot-utils'
import { fetchBotMentions, fetchFactionContext } from '@/src/lib/bots/context-fetcher'
import { generateBotReply } from '@/src/lib/bots/npc-logic'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import { fetchWithRetry } from '@/src/lib/bots/fetch-retry'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const summaries: Array<{ bot: string; replies: number }> = []

    for (const key of Object.keys(ALL_BOT_CONFIGS)) {
      const cfg = (ALL_BOT_CONFIGS as any)[key]
      const profile = await getBotProfile(cfg.username)
      if (!profile || profile.is_bot_paused) continue

      const since = profile.last_bot_post_at ?? new Date(now - 24 * 60 * 60 * 1000).toISOString()
      const mentions = await fetchBotMentions(profile.username, since)
      if (!mentions || !mentions.length) {
        summaries.push({ bot: profile.username, replies: 0 })
        continue
      }

      let replies = 0
      const factionContext = await fetchFactionContext(profile.faction ?? cfg.faction, 5)

      for (const mention of mentions) {
        // skip bot-to-bot mentions
        if (mention.is_bot) continue

        // reply with probability
        if (Math.random() > (cfg.replyChance ?? 0.5)) continue

        const reply = await generateBotReply(cfg.personality ?? '', mention.content, process.env.GEMINI_API_KEY ?? '')
        if (!reply) continue

        // insert into transmission_logs so it appears in faction chat
        try {
          await fetchWithRetry(
            `${process.env.SUPABASE_URL}/rest/v1/transmission_logs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
              },
              body: JSON.stringify({
                faction: profile.faction ?? cfg.faction,
                content: reply,
                author_id: profile.id,
              }),
            },
            3,
            300,
          )

          replies += 1
          await updateLastBotPostAt(profile.id)
        } catch (e) {
          console.error('Bot reply failed for', profile?.username, e)
        }
      }

      summaries.push({ bot: profile.username, replies })
    }

    return NextResponse.json({ success: true, summaries })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

