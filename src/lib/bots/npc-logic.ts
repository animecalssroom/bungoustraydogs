import type { DuelMove } from '@/backend/types'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

// ── Duel strategy types ────────────────────────────────────────────────────
export type BotDuelStrategy =
  | 'PATIENT_DESTRUCTION'
  | 'COUNTER_WAIT'
  | 'GAMBIT_CHAOS'
  | 'CALCULATED_HEAL'
  | 'TRAP_THEN_WAIT'

/**
 * Choose a bot move based on strategy, round, HP, and moves already used.
 *
 * gambitsUsed and specialUsed are passed in from the caller so the bot
 * never tries a move it has already spent this duel.
 */
export function chooseBotMove(
  strategy: BotDuelStrategy,
  round: number,
  hp: number,
  gambitsUsed = 0,
  specialUsed = false,
): DuelMove {
  const canGambit = gambitsUsed < 2
  const canSpecial = !specialUsed
  const canRecover = round > 1 // caller tracks consecutive recover separately

  if (strategy === 'PATIENT_DESTRUCTION') {
    if (round === 1) return 'stance'
    if (round === 2) return 'strike'
    return 'strike'
  }

  if (strategy === 'COUNTER_WAIT') {
    return round <= 2 ? 'stance' : 'strike'
  }

  if (strategy === 'GAMBIT_CHAOS') {
    // Tachihara: open with gambit, use second gambit mid-duel, then strike
    // Never attempts gambit if both uses are spent — falls back to strike
    if (round === 1 && canGambit) return 'gambit'
    if (round === 3 && canGambit) return 'gambit'
    return 'strike'
  }

  if (strategy === 'CALCULATED_HEAL') {
    if (hp <= 30 && canRecover) return 'recover'
    return round % 2 === 0 ? 'stance' : 'strike'
  }

  if (strategy === 'TRAP_THEN_WAIT') {
    // Poe: use special early, then defend
    if (round === 1 && canSpecial) return 'special'
    return round <= 3 ? 'stance' : 'strike'
  }

  return round <= 2 ? 'strike' : 'stance'
}

// ── Gemini helpers ─────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    const text = (json?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ── Post generation ────────────────────────────────────────────────────────
export async function generateBotPost(
  systemPrompt: string,
  contextSummary: string,
  apiKey: string,
): Promise<string | null> {
  const prompt = `${systemPrompt}

Recent faction activity for context (do not directly quote or reference):
${contextSummary}

Write one short faction post as this character. Max 3 sentences. No hashtags. No emojis.`

  return callGemini(prompt, apiKey)
}

// ── Reply generation ───────────────────────────────────────────────────────
/**
 * factionContext is optional — passed from check-replies when available.
 * Gives Gemini awareness of recent faction activity so replies feel grounded.
 */
export async function generateBotReply(
  systemPrompt: string,
  mentionContent: string,
  apiKey: string,
  factionContext?: string,
): Promise<string | null> {
  const contextBlock = factionContext
    ? `\nRecent faction activity for context (do not directly quote):\n${factionContext}\n`
    : ''

  const prompt = `${systemPrompt}
${contextBlock}
Someone just wrote this in your faction channel:
"${mentionContent}"

They mentioned you (@). Write a short reply in character. 1-2 sentences maximum. No emojis.`

  return callGemini(prompt, apiKey)
}
