import { NextRequest, NextResponse } from 'next/server'
import { verifyBotSecret, getBotProfile, updateLastBotPostAt, isWithinJSTQuietHours, pickFallback } from '@/src/lib/bots/bot-utils'
import { fetchFactionContext } from '@/src/lib/bots/context-fetcher'
import { generateBotPost } from '@/src/lib/bots/npc-logic'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body?.botUsername) {
      return NextResponse.json({ error: 'Missing botUsername' }, { status: 400 })
    }

    if (isWithinJSTQuietHours()) {
      return NextResponse.json({ skipped: true, reason: 'quiet_hours' })
    }

    const profile = await getBotProfile(body.botUsername)
    if (!profile) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    if (profile.is_bot_paused) return NextResponse.json({ skipped: true, reason: 'paused' })

    const botConfig = ALL_BOT_CONFIGS[profile.username] ?? (profile.bot_config as any)
    const wins = profile.duel_wins ?? 0
    const losses = profile.duel_losses ?? 0

    const systemPrompt = (botConfig?.personality ?? '')
      .replace('{wins}', String(wins))
      .replace('{losses}', String(losses))

    let content: string | null = null

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const context = await fetchFactionContext(botConfig?.faction ?? profile.faction)
      content = await generateBotPost(systemPrompt, context, apiKey)
    }

    if (!content) {
      content = pickFallback(botConfig?.fallbackPosts ?? [], wins, losses)
    }

    // Insert into transmission_logs (faction feed), NOT registry
    const { error } = await supabaseAdmin
      .from('transmission_logs')
      .insert({
        author_id: profile.id,
        faction: botConfig?.faction ?? profile.faction,
        content,
        is_bot_post: true,
      })

    if (error) {
      console.error('[bot faction-post] insert failed', error)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    await updateLastBotPostAt(profile.id)

    return NextResponse.json({ success: true, content })
  } catch (err) {
    console.error('[bot faction-post] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}