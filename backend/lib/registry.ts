import type {
  FactionId,
  RegistryDistrict,
  RegistryPostType,
  RegistryReview,
} from '@/backend/types'

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

export const REGISTRY_POST_TYPE_META: Record<
  RegistryPostType,
  {
    label: string
    description: string
    minRank: number
    minWords: number
    approvalAp: number
    autoFeatured: boolean
    routeToAngo: boolean
  }
> = {
  field_note: {
    label: 'Field Note',
    description: 'A brief observation from the field',
    minRank: 1,
    minWords: 100,
    approvalAp: 25,
    autoFeatured: false,
    routeToAngo: false,
  },
  incident_report: {
    label: 'Incident Report',
    description: 'A formal account of an ability incident',
    minRank: 2,
    minWords: 200,
    approvalAp: 50,
    autoFeatured: false,
    routeToAngo: false,
  },
  classified_report: {
    label: 'Classified Report',
    description: 'A detailed classified filing',
    minRank: 3,
    minWords: 400,
    approvalAp: 100,
    autoFeatured: true,
    routeToAngo: false,
  },
  chronicle_submission: {
    label: 'Chronicle Submission',
    description: 'A submission for the city Chronicle',
    minRank: 5,
    minWords: 600,
    approvalAp: 150,
    autoFeatured: false,
    routeToAngo: true,
  },
}

export function getAvailableRegistryPostTypes(rank: number) {
  return (Object.entries(REGISTRY_POST_TYPE_META) as Array<
    [RegistryPostType, (typeof REGISTRY_POST_TYPE_META)[RegistryPostType]]
  >)
    .filter(([, meta]) => rank >= meta.minRank)
    .map(([type]) => type)
}

export function generateRegistryCaseNumber(
  faction: FactionId | null,
  seed: number,
  postType: RegistryPostType,
) {
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

  const suffix = postType === 'field_note' ? '-FN' : ''
  return `YKH-${initial}-${new Date().getUTCFullYear()}${suffix}-${String(seed).padStart(4, '0')}`
}

export async function reviewRegistryPostWithGemini(input: {
  title: string
  content: string
  authorFaction: string | null
  wordCount: number
  postType: RegistryPostType
  threadSummary?: string | null
}): Promise<RegistryReview | null> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

  if (!apiKey) {
    return null
  }

  const prompt = [
    'You are reviewing a Bungou Stray Dogs registry filing for a fan archive.',
    'Return JSON only with these keys:',
    'canon_consistent, canon_notes, character_accurate, character_notes, quality_score, recommendation, recommendation_reason.',
    'Quality score must be 0 to 1.',
    'Recommendation must be approve, review, or reject.',
    `Faction: ${input.authorFaction ?? 'unknown'}`,
    `Post type: ${input.postType}`,
    `Post type: ${input.postType}. Field notes require only basic canon consistency. Incident reports require full canon and character accuracy. Classified reports require full review plus consistency with author's previous posts.`,
    `Word count: ${input.wordCount}`,
    input.threadSummary ? `Existing thread context: ${input.threadSummary}` : 'Existing thread context: none',
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
