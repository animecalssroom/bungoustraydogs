import type { FactionId, RegistryDistrict, RegistryReview } from '@/backend/types'

export const REGISTRY_DISTRICTS: RegistryDistrict[] = [
  'kannai',
  'chinatown',
  'harbor',
  'motomachi',
  'honmoku',
  'waterfront',
  'other',
]

export const REGISTRY_DISTRICT_LABELS: Record<RegistryDistrict, string> = {
  kannai: 'Kannai',
  chinatown: 'Chinatown',
  harbor: 'Harbor',
  motomachi: 'Motomachi',
  honmoku: 'Honmoku',
  waterfront: 'Waterfront',
  other: 'Other',
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export function generateRegistryCaseNumber(faction: FactionId | null, seed: number) {
  const initial =
    faction === 'agency'
      ? 'A'
      : faction === 'mafia'
        ? 'M'
        : faction === 'guild'
          ? 'G'
          : faction === 'hunting_dogs'
            ? 'D'
            : faction === 'special_div'
              ? 'S'
              : 'X'

  return `YKH-${initial}-${new Date().getUTCFullYear()}-${String(seed).padStart(4, '0')}`
}

export async function reviewRegistryPostWithGemini(input: {
  title: string
  content: string
  authorFaction: string | null
  wordCount: number
}): Promise<RegistryReview | null> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

  if (!apiKey) {
    return null
  }

  const prompt = [
    'You are reviewing a Bungou Stray Dogs incident report for a fan archive.',
    'Return JSON only with these keys:',
    'canon_consistent, canon_notes, character_accurate, character_notes, quality_score, recommendation, recommendation_reason.',
    'Quality score must be 0 to 1.',
    'Recommendation must be approve, review, or reject.',
    `Faction: ${input.authorFaction ?? 'unknown'}`,
    `Word count: ${input.wordCount}`,
    `Title: ${input.title}`,
    'Content:',
    input.content,
  ].join('\n')

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const text =
      json.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim() ?? ''

    if (!text) {
      return null
    }

    const parsed = JSON.parse(text) as RegistryReview

    return {
      canon_consistent: Boolean(parsed.canon_consistent),
      canon_notes: parsed.canon_notes ?? '',
      character_accurate: Boolean(parsed.character_accurate),
      character_notes: parsed.character_notes ?? '',
      quality_score:
        typeof parsed.quality_score === 'number'
          ? Math.max(0, Math.min(1, parsed.quality_score))
          : 0.5,
      recommendation:
        parsed.recommendation === 'approve' ||
        parsed.recommendation === 'review' ||
        parsed.recommendation === 'reject'
          ? parsed.recommendation
          : 'review',
      recommendation_reason: parsed.recommendation_reason ?? 'Manual registry review required.',
    }
  } catch {
    return null
  }
}
