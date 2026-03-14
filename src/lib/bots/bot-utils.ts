import { supabaseAdmin } from '@/backend/lib/supabase'

const JST_OFFSET = 9 * 60 // minutes

export function isWithinJSTQuietHours(): boolean {
  const now = new Date()
  const jstNow = new Date(now.getTime() + JST_OFFSET * 60 * 1000)
  const hour = jstNow.getHours()
  const quiet = hour >= 23 || hour < 7
  try {
    // debug info useful in server logs when investigating bot silence
    // eslint-disable-next-line no-console
    console.debug('bot-utils:isWithinJSTQuietHours', { utc: now.toISOString(), jst: jstNow.toISOString(), hour, quiet })
  } catch (e) {
    // ignore logging failures
  }

  return quiet
}

export async function getBotProfile(username: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, faction, character_name, character_match_id, duel_wins, duel_losses, is_bot_paused, last_bot_post_at, bot_config')
      .eq('username', username)
      .eq('is_bot', true)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('getBotProfile supabase error', username, error.message)
      return null
    }

    if (!data) {
      // eslint-disable-next-line no-console
      console.warn('getBotProfile no profile found', username)
      return null
    }

    // normalize bot_config if stored as JSON string
    try {
      if (data.bot_config && typeof data.bot_config === 'string') {
        // eslint-disable-next-line no-param-reassign
        data.bot_config = JSON.parse(data.bot_config)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('getBotProfile failed to parse bot_config', username)
    }

    return data
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getBotProfile unexpected error', username, err)
    return null
  }
}

export async function getBotProfiles(usernames: string[]) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, faction, character_name, character_match_id, duel_wins, duel_losses, is_bot_paused, last_bot_post_at, bot_config')
      .in('username', usernames)
      .eq('is_bot', true)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('getBotProfiles supabase error', error.message)
      return []
    }

    if (!data) return []

    return data.map((profile) => {
      try {
        if (profile.bot_config && typeof profile.bot_config === 'string') {
          // eslint-disable-next-line no-param-reassign
          profile.bot_config = JSON.parse(profile.bot_config)
        }
      } catch (e) {
        // ignore
      }
      return profile
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getBotProfiles unexpected error', err)
    return []
  }
}

export async function updateLastBotPostAt(userId: string) {
  await supabaseAdmin
    .from('profiles')
    .update({ last_bot_post_at: new Date().toISOString() })
    .eq('id', userId)
}

export function injectDuelRecord(text: string, wins: number, losses: number): string {
  return text
    .replace(/{wins}/g, String(wins))
    .replace(/{losses}/g, String(losses))
}

export function pickFallback(fallbacks: string[], wins: number, losses: number): string {
  const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)]
  return injectDuelRecord(pick, wins, losses)
}

export function verifyBotSecret(req: Request | any): boolean {
  const secret = req instanceof Request ? req.headers.get('x-bot-secret') : req.headers?.['x-bot-secret']
  return !!process.env.BOT_SECRET && secret === process.env.BOT_SECRET
}
