import type { VisibleFactionId } from '@/backend/types'

export type QuizOptionId = 'a' | 'b' | 'c' | 'd'
export type QuizRawFaction = 'agency' | 'mafia' | 'guild' | 'dogs'
export type QuizSubmitAnswers = Record<string, QuizOptionId>
export type QuizStatus = 'clear' | 'tied' | 'unplaceable'
export type QuizScores = Record<QuizRawFaction, number>

export interface QuizSubmitResult {
  faction: QuizRawFaction | null
  status: QuizStatus
  scores: QuizScores
}

interface QuizDataQuestion {
  id: number
  question: string
  options: Array<{
    id: QuizOptionId
    text: string
    faction: QuizRawFaction
  }>
}

const REQUIRED_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const
const TIEBREAKER_KEYS = ['3', '5'] as const
const QUIZ_FALLBACK_ORDER: QuizRawFaction[] = ['agency', 'mafia', 'guild', 'dogs']

function hashAnswerSignature(answers: QuizSubmitAnswers) {
  return REQUIRED_KEYS.reduce((hash, key) => {
    return hash + String(answers[key]).charCodeAt(0)
  }, 0)
}

function resolveTrueTie(leaders: QuizRawFaction[], answers: QuizSubmitAnswers) {
  const orderedLeaders = QUIZ_FALLBACK_ORDER.filter((faction) => leaders.includes(faction))

  if (orderedLeaders.length === 1) {
    return orderedLeaders[0]
  }

  const signature = hashAnswerSignature(answers)
  return orderedLeaders[signature % orderedLeaders.length] ?? orderedLeaders[0] ?? 'agency'
}

export const QUIZ_DATA: QuizDataQuestion[] = [
  {
    id: 1,
    question: 'You have a rare and powerful ability. What is its purpose?',
    options: [
      { id: 'a', text: "To protect people who can't protect themselves", faction: 'agency' },
      { id: 'b', text: 'To establish your place. Power commands respect', faction: 'mafia' },
      {
        id: 'c',
        text: "It's an asset. Assets generate leverage. Leverage generates everything",
        faction: 'guild',
      },
      {
        id: 'd',
        text: "To serve justice without exception. Your ability is the state's weapon",
        faction: 'dogs',
      },
    ],
  },
  {
    id: 2,
    question:
      'Your closest ally has done something you believe is genuinely wrong. Not illegal - just wrong. What do you do?',
    options: [
      {
        id: 'a',
        text: 'Confront them directly. Loyalty means honesty not silence',
        faction: 'agency',
      },
      {
        id: 'b',
        text: 'Handle it internally. What happens inside stays inside',
        faction: 'mafia',
      },
      {
        id: 'c',
        text: "Evaluate the damage. If it doesn't affect your position it doesn't affect you",
        faction: 'guild',
      },
      {
        id: 'd',
        text: 'Report it. Rules exist for everyone including allies',
        faction: 'dogs',
      },
    ],
  },
  {
    id: 3,
    question:
      "You're hunting someone dangerous. An innocent person is caught in the middle - not hurt yet, but they'll slow you down. What do you do?",
    options: [
      {
        id: 'a',
        text: 'You stop. The mission exists to protect people. Abandoning one defeats the point',
        faction: 'agency',
      },
      {
        id: 'b',
        text: 'Someone else will handle them. Your job is the target',
        faction: 'mafia',
      },
      {
        id: 'c',
        text: 'Calculate quickly. If helping costs less than not helping, help',
        faction: 'guild',
      },
      {
        id: 'd',
        text: 'The mission takes priority. Sentiment in the field gets people killed',
        faction: 'dogs',
      },
    ],
  },
  {
    id: 4,
    question:
      'You just did something significant. Nobody saw it. Nobody will ever know it was you. How do you feel?',
    options: [
      { id: 'a', text: 'Fine. The outcome matters not the credit', faction: 'agency' },
      {
        id: 'b',
        text: 'Unsatisfied. Unwitnessed strength is wasted strength',
        faction: 'mafia',
      },
      {
        id: 'c',
        text: "Annoyed. Unrecognized work is uncompensated work. You'll find a way to leverage it",
        faction: 'guild',
      },
      { id: 'd', text: "Fine. You did your duty. That's the entire point", faction: 'dogs' },
    ],
  },
  {
    id: 5,
    question: "You're outnumbered, outpowered and losing. What do you do?",
    options: [
      {
        id: 'a',
        text: "Keep going. The mission doesn't end because it gets hard",
        faction: 'agency',
      },
      {
        id: 'b',
        text: "Fall back, regroup, return stronger. You can't win dead",
        faction: 'mafia',
      },
      {
        id: 'c',
        text: 'Negotiate. There is always something the other side wants',
        faction: 'guild',
      },
      {
        id: 'd',
        text: 'Hold the line. Retreat is failure. You were given a duty',
        faction: 'dogs',
      },
    ],
  },
  {
    id: 6,
    question:
      'You can achieve something genuinely good - but only by working with someone whose methods you find reprehensible. Do you?',
    options: [
      {
        id: 'a',
        text: "Yes - but you make clear it's temporary and you don't endorse them",
        faction: 'agency',
      },
      {
        id: 'b',
        text: 'Yes - sentiment about methods is a luxury. Outcomes are what matter',
        faction: 'mafia',
      },
      {
        id: 'c',
        text: 'Yes - and you use the alliance to gain something extra on the side',
        faction: 'guild',
      },
      {
        id: 'd',
        text: "No. Working with them legitimizes them. Some lines don't get crossed",
        faction: 'dogs',
      },
    ],
  },
  {
    id: 7,
    question: 'When this is all over - what do you want to be true?',
    options: [
      { id: 'a', text: 'That the people I protected are still standing', faction: 'agency' },
      {
        id: 'b',
        text: 'That nobody ever questioned my loyalty or my strength',
        faction: 'mafia',
      },
      {
        id: 'c',
        text: 'That I built something that lasts and that I won',
        faction: 'guild',
      },
      { id: 'd', text: 'That I never compromised. Not even once', faction: 'dogs' },
    ],
  },
]

function emptyScores(): QuizScores {
  return {
    agency: 0,
    mafia: 0,
    guild: 0,
    dogs: 0,
  }
}

export function resolveFactionFromScores(scores: QuizScores): QuizSubmitResult {
  const sorted = Object.entries(scores).sort((left, right) => right[1] - left[1]) as Array<
    [QuizRawFaction, number]
  >

  const first = sorted[0]
  const second = sorted[1]

  if (!first || !second) {
    throw new Error('Unable to resolve faction scores')
  }

  if (first[1] <= 2 && first[1] - second[1] <= 1) {
    return {
      faction: null,
      status: 'unplaceable',
      scores,
    }
  }

  if (first[1] === second[1]) {
    return {
      faction: first[0],
      status: 'tied',
      scores,
    }
  }

  return {
    faction: first[0],
    status: 'clear',
    scores,
  }
}

function assertValidAnswers(answers: unknown): asserts answers is QuizSubmitAnswers {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new Error('Answers payload must be an object')
  }

  const keys = Object.keys(answers)
  if (keys.length !== REQUIRED_KEYS.length) {
    throw new Error('Answers payload must contain exactly seven answers')
  }

  for (const key of REQUIRED_KEYS) {
    const value = (answers as Record<string, unknown>)[key]

    if (!value) {
      throw new Error(`Missing answer for question ${key}`)
    }

    if (!['a', 'b', 'c', 'd'].includes(String(value))) {
      throw new Error(`Invalid answer "${String(value)}" for question ${key}`)
    }
  }
}

export function calculateFaction(answers: unknown): QuizSubmitResult {
  assertValidAnswers(answers)

  const scores = emptyScores()

  for (const question of QUIZ_DATA) {
    const answerId = answers[String(question.id)]
    const option = question.options.find((entry) => entry.id === answerId)

    if (!option) {
      throw new Error(`Invalid answer "${answerId}" for question ${question.id}`)
    }

    scores[option.faction] += 1
  }

  const resolved = resolveFactionFromScores(scores)

  if (resolved.status !== 'tied') {
    return resolved
  }

  const sorted = Object.entries(scores).sort((left, right) => right[1] - left[1]) as Array<
    [QuizRawFaction, number]
  >
  const first = sorted[0]
  const second = sorted[1]

  if (first[1] === second[1]) {
    const tieScores = emptyScores()

    for (const questionId of TIEBREAKER_KEYS) {
      const tieAnswerId = answers[questionId]
      const tieQuestion = QUIZ_DATA.find((entry) => String(entry.id) === questionId)
      const tieOption = tieQuestion?.options.find((entry) => entry.id === tieAnswerId)

      if (!tieOption) {
        throw new Error(`Invalid answer "${tieAnswerId}" for question ${questionId}`)
      }

      tieScores[tieOption.faction] += 1
    }

    const tiedFactions = sorted
      .filter(([, score]) => first[1] === score)
      .map(([faction]) => faction)

    const highestTieScore = Math.max(...tiedFactions.map((faction) => tieScores[faction]))
    const tieLeaders = tiedFactions.filter(
      (faction) => tieScores[faction] === highestTieScore,
    )

    if (tieLeaders.length > 1) {
      return {
        faction: resolveTrueTie(tieLeaders, answers),
        status: 'tied',
        scores: resolved.scores,
      }
    }

    return {
      faction: tieLeaders[0] ?? resolveTrueTie(tiedFactions, answers),
      status: 'tied',
      scores: resolved.scores,
    }
  }

  return resolved
}

export function mapQuizFactionToStoredFaction(
  faction: QuizRawFaction | null,
): VisibleFactionId | null {
  if (!faction) {
    return null
  }

  if (faction === 'dogs') {
    return 'hunting_dogs'
  }

  return faction
}
