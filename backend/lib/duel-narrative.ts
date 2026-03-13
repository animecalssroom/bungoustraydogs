import { getDuelCharacterRule } from '@/lib/duels/characters'
import { buildFallbackRoundNarrative, formatMoveLabel } from '@/lib/duels/presentation'
import type { DuelMove } from '@/backend/types'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
const GEMINI_TIMEOUT_MS = 5000

export async function narrateDuelRound(input: {
  challengerName: string
  challengerSlug: string | null
  defenderName: string
  defenderSlug: string | null
  challengerMove: DuelMove
  defenderMove: DuelMove
  challengerDamage: number
  defenderDamage: number
  roundNumber: number
  duelOver: boolean
  winnerName?: string | null
  specialEvents?: Array<Record<string, unknown>>
}) {
  const fallback = buildFallbackRoundNarrative({
    challengerName: input.challengerName,
    defenderName: input.defenderName,
    moveA: input.challengerMove,
    moveB: input.defenderMove,
    damageA: input.challengerDamage,
    damageB: input.defenderDamage,
  })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { text: fallback, isFallback: true }
  }

  const challengerRule = getDuelCharacterRule(input.challengerSlug)
  const defenderRule = getDuelCharacterRule(input.defenderSlug)

  const prompt = [
    'You are the Yokohama ability registry combat recorder.',
    'Write exactly 2 sentences describing what happened in this round of combat.',
    'Do not mention HP numbers, damage values, or AP.',
    'Present tense. Literary, cold, precise. Bungo Stray Dogs tone.',
    'Return ONLY the 2 sentences.',
    '',
    `FIGHTER A: ${input.challengerName}`,
    challengerRule
      ? `FIGHTER A RULES: ${challengerRule.passive} Special: ${challengerRule.special}`
      : 'FIGHTER A RULES: Unregistered operative. No ability signature confirmed.',
    `FIGHTER B: ${input.defenderName}`,
    defenderRule
      ? `FIGHTER B RULES: ${defenderRule.passive} Special: ${defenderRule.special}`
      : 'FIGHTER B RULES: Unregistered operative. No ability signature confirmed.',
    `FIGHTER A used: ${formatMoveLabel(input.challengerMove)}`,
    `FIGHTER B used: ${formatMoveLabel(input.defenderMove)}`,
    `FIGHTER A damage dealt: ${input.challengerDamage}`,
    `FIGHTER B damage dealt: ${input.defenderDamage}`,
    `Special events this round: ${input.specialEvents?.length ? input.specialEvents.map((event) => String(event.description ?? event.type ?? 'recorded anomaly')).join(', ') : 'none'}`,
    input.roundNumber === 5 ? 'This is the final round.' : '',
    input.duelOver ? `The duel has ended. ${input.winnerName ?? 'The registry records a decisive victor.'}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      return { text: fallback, isFallback: true }
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const text =
      json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? ''

    if (!text) {
      return { text: fallback, isFallback: true }
    }

    return { text, isFallback: false }
  } catch {
    return { text: fallback, isFallback: true }
  } finally {
    clearTimeout(timeout)
  }
}
