import { supabaseAdmin } from '@/backend/lib/supabase'

const JST_OFFSET = 9 * 60 // minutes

export function isWithinJSTQuietHours(): boolean {
  const now = new Date()
  const jstHour = (now.getUTCHours() + JST_OFFSET / 60) % 24
  return jstHour >= 23 || jstHour < 7
}

export async function getBotProfile(username: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, faction, character_name, character_match_id, duel_wins, duel_losses, is_bot_paused, last_bot_post_at, bot_config')
    .eq('username', username)
    .eq('is_bot', true)
    .maybeSingle()
  return data
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
