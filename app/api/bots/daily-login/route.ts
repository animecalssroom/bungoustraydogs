import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { verifyBotSecret, getBotProfiles } from '@/src/lib/bots/bot-utils'
import { ALL_BOT_CONFIGS } from '@/src/lib/bots/bot-config'
import type { BotConfig } from '@/src/lib/bots/bot-config'

// AP awarded for a daily login — must match the value in AP_VALUES
const DAILY_LOGIN_AP = 5

export async function POST(request: NextRequest) {
  if (!verifyBotSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ bot: string; status: 'logged_in' | 'already_done' | 'skipped' | 'error' }> = []

  // Batch fetch all bot profiles in one query
  const configs = Object.values(ALL_BOT_CONFIGS) as BotConfig[]
  const usernames = configs.map((c) => c.username)
  const profiles = await getBotProfiles(usernames)
  const profileMap = new Map(profiles.map((p: any) => [p.username, p]))

  // Today in JST — bots use JST same as the rest of the game
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const todayJST = jstNow.toISOString().slice(0, 10) // 'YYYY-MM-DD'

  for (const cfg of configs) {
    try {
      const profile = profileMap.get(cfg.username)

      if (!profile) {
        results.push({ bot: cfg.username, status: 'skipped' })
        continue
      }

      if (profile.is_bot_paused) {
        results.push({ bot: cfg.username, status: 'skipped' })
        continue
      }

      // Check if this bot already logged in today (JST)
      // A daily_login user_event within today's JST date window means already done
      const { count } = await supabaseAdmin
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('event_type', 'daily_login')
        .gte('created_at', `${todayJST}T00:00:00+09:00`)
        .lt('created_at', `${getNextDay(todayJST)}T00:00:00+09:00`)

      if (count && count > 0) {
        results.push({ bot: cfg.username, status: 'already_done' })
        continue
      }

      // Record the daily login event
      const { error: eventError } = await supabaseAdmin
        .from('user_events')
        .insert({
          user_id: profile.id,
          event_type: 'daily_login',
          ap_awarded: DAILY_LOGIN_AP,
          faction: profile.faction ?? cfg.faction ?? null,
          metadata: { is_bot: true },
        })

      if (eventError) {
        console.error(`[bot-daily-login] event insert failed for ${cfg.username}:`, eventError.message)
        results.push({ bot: cfg.username, status: 'error' })
        continue
      }

      // Award AP
      const { error: apError } = await supabaseAdmin
        .from('profiles')
        .update({
          ap_total: (profile.ap_total ?? 0) + DAILY_LOGIN_AP,
          updated_at: now.toISOString(),
        })
        .eq('id', profile.id)

      if (apError) {
        console.error(`[bot-daily-login] AP update failed for ${cfg.username}:`, apError.message)
        // Event was recorded — log the error but don't mark as full failure
      }

      results.push({ bot: cfg.username, status: 'logged_in' })
    } catch (err) {
      console.error(`[bot-daily-login] unexpected error for ${cfg.username}:`, err)
      results.push({ bot: cfg.username, status: 'error' })
    }
  }

  return NextResponse.json({ success: true, results })
}

function getNextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}