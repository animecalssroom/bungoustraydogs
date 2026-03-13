import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import {
  calculateFaction,
  mapQuizFactionToStoredFaction,
  type QuizScores,
  resolveFactionFromScores,
} from '@/backend/lib/quiz'

function averageScores(
  current: Record<string, number> | null | undefined,
  next: Record<string, number>,
): QuizScores {
  if (!current) {
    return next as QuizScores
  }

  const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(next)]))

  return keys.reduce<Record<string, number>>((scores, key) => {
    scores[key] = Math.round(((current[key] ?? 0) + (next[key] ?? 0)) / 2)
    return scores
  }, {}) as QuizScores
}


function deriveBehaviorQuizScores(scores: QuizScores) {
  return {
    power: scores.mafia ?? 0,
    intel: scores.guild ?? 0,
    loyalty: scores.agency ?? 0,
    control: scores.dogs ?? 0,
  }
}

export async function POST(request: NextRequest) {

  // Rate limit: 1 successful submission per user (enforced by quiz_completed check below)
  // IP rate limit removed — unreliable on serverless + breaks shared networks

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[quiz/submit] start', { userId: user.id })

  const { data: profile } = await supabase
    .from('profiles')
    .select('quiz_completed, exam_completed, exam_scores, exam_retake_used')
    .eq('id', user.id)
    .single()

  console.log('[quiz/submit] fetched profile', { userId: user.id, profile })

  if (profile?.quiz_completed) {
    return NextResponse.json(
      { error: 'Exam already completed' },
      { status: 400 },
    )
  }

  const body = await request.json().catch(() => null)
  const answers = body?.answers

  let result

  try {
    result = calculateFaction(answers)
  } catch {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
  }

  console.log('[quiz/submit] calculated faction', { userId: user.id, result })

  try {
    // Log the raw answers explicitly for traceability
    // eslint-disable-next-line no-console
    console.log('[quiz/submit] answers', { userId: user.id, answers })
  } catch {}

  const isRetake = Boolean(
    profile?.exam_completed && profile?.exam_retake_used && !profile?.quiz_completed,
  )

  const finalScores = isRetake
    ? averageScores(profile?.exam_scores ?? null, result.scores)
    : result.scores
  const averagedResolution = isRetake ? resolveFactionFromScores(finalScores) : result
  const finalResolution =
    isRetake && averagedResolution.status === 'tied' && result.faction
      ? { ...averagedResolution, faction: result.faction }
      : averagedResolution
  const storedFaction = mapQuizFactionToStoredFaction(finalResolution.faction)
  const behaviorQuizScores = deriveBehaviorQuizScores(finalScores)
  const now = new Date().toISOString()

  if (storedFaction) {
    const { data: factionExists, error: factionLookupError } = await supabaseAdmin
      .from('factions')
      .select('id')
      .eq('id', storedFaction)
      .maybeSingle()

    if (factionLookupError) {
      return NextResponse.json(
        { error: factionLookupError.message },
        { status: 500 },
      )
    }

    if (!factionExists) {
      console.error('[quiz/submit] missing faction registry', { storedFaction })
      return NextResponse.json(
        {
          error:
            'Faction registry is missing required records. Run backend/db/schema.sql and backend/db/seed.sql in Supabase, then try again.',
        },
        { status: 500 },
      )
    }
  }

  const updatePayload = {
    exam_completed: true,
    exam_taken_at: now,
    exam_answers: answers,
    exam_scores: finalScores,
    quiz_scores: behaviorQuizScores,
    faction: storedFaction,
    exam_status: finalResolution.status,
    quiz_completed: true,
    // mark locked to prevent accidental retake/race conditions
    quiz_locked: true,
    behavior_scores: {
      power: behaviorQuizScores.power,
      intel: behaviorQuizScores.intel,
      loyalty: behaviorQuizScores.loyalty,
      control: behaviorQuizScores.control,
      arena_votes: {},
      duel_style: {
        gambit: 0,
        strike: 0,
        stance: 0,
      },
      lore_topics: {},
    },
    updated_at: now,
  }

  console.log('[quiz/submit] updatePayload', { userId: user.id, updatePayload })

  try {
    // Log final resolution mapping
    // eslint-disable-next-line no-console
    console.log('[quiz/submit] finalResolution', {
      userId: user.id,
      finalResolution,
      storedFaction,
      finalScores,
      isRetake,
    })
  } catch {}

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)
    .select()
    .maybeSingle()

  if (updateError) {
    console.error('[quiz/submit] profile update error', { userId: user.id, updateError })
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (!updatedProfile) {
    console.error('[quiz/submit] profile update returned no row', { userId: user.id })
    return NextResponse.json({ error: 'Profile update did not modify any row — possible concurrent update' }, { status: 409 })
  }

  if (finalResolution.status === 'unplaceable') {
    await supabaseAdmin.from('observer_pool').upsert(
      {
        user_id: user.id,
        scores: finalScores,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
  }

  console.log('[quiz/submit] success', {
    userId: user.id,
    faction: finalResolution.faction,
    storedFaction,
    status: finalResolution.status,
    scores: finalScores,
    retake: isRetake,
  })

  return NextResponse.json({
    faction: finalResolution.faction,
    factionId: storedFaction,
    status: finalResolution.status,
    scores: finalScores,
    retake: isRetake,
    profile: updatedProfile,
  })
}
