import { NextRequest, NextResponse } from 'next/server'
import { verifyBotSecret, getBotProfile, updateLastBotPostAt } from '@/src/lib/bots/bot-utils'
import { generateBotPost } from '@/src/lib/bots/npc-logic'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import { RegistryModel } from '@/backend/models/registry.model'
import { fetchWithRetry } from '@/src/lib/bots/fetch-retry'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const results: Array<{ bot: string; posted: boolean }> = []

    for (const cfg of Object.values(ALL_BOT_CONFIGS) as any[]) {
      try {
        // eslint-disable-next-line no-console
        console.debug('daily-login:processing', cfg.username)
        const profile = await getBotProfile(cfg.username)
        if (!profile || profile.is_bot_paused) {
          // eslint-disable-next-line no-console
          console.debug('daily-login:skipping paused or missing profile', cfg.username)
          continue
        }

        const last = profile.last_bot_post_at ? new Date(profile.last_bot_post_at).getTime() : 0
        const intervalMs = (cfg.postIntervalHours ?? 24) * 3600 * 1000
        if (now - last < intervalMs) {
          results.push({ bot: profile.username, posted: false })
          continue
        }

        let content = await generateBotPost(cfg.personality ?? '', '', process.env.GEMINI_API_KEY ?? '')
        if (!content) {
          content = (cfg.fallbackPosts ?? [])[Math.floor(Math.random() * ((cfg.fallbackPosts ?? []).length || 1))] ?? '...'
        }

        const input = {
          title: `${profile.username} — dispatch`,
          content,
          district: 'other' as any,
          postType: 'field_note' as any,
          threadMode: 'new' as const,
        }

        try {
          let created = false
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              await RegistryModel.createSubmission(profile as any, input)
              created = true
              break
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('RegistryModel.createSubmission failed attempt', attempt + 1, profile.username, err)
              // small wait
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)))
            }
          }

          if (created) {
            await updateLastBotPostAt(profile.id)
            results.push({ bot: profile.username, posted: true })
          } else {
            results.push({ bot: profile.username, posted: false })
          }
        } catch (outer) {
          // eslint-disable-next-line no-console
          console.error('Daily-login unexpected error for', profile.username, outer)
          results.push({ bot: profile.username, posted: false })
        }
      } catch (outerErr) {
        // eslint-disable-next-line no-console
        console.error('daily-login:bot processing error', (cfg as any).username, outerErr)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('daily-login:error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

