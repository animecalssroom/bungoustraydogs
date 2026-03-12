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

export async function POST(request: NextRequest) {
  // --- Rate limit: max 3 per hour per IP ---
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
  const rlKey = `quiz_submit_${ip}`
  const nowMs = Date.now()
  const windowMs = 60 * 60 * 1000
  const maxReq = 3
  const rlStore = (globalThis as any).__quizSubmitRL || ((globalThis as any).__quizSubmitRL = {})
  rlStore[rlKey] = (rlStore[rlKey] || []).filter((t: number) => nowMs - t < windowMs)
  if (rlStore[rlKey].length >= maxReq) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  rlStore[rlKey].push(nowMs)

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('quiz_completed, exam_completed, exam_scores, exam_retake_used')
    .eq('id', user.id)
    .single()

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
      return NextResponse.json(
        {
          error:
            'Faction registry is missing required records. Run backend/db/schema.sql and backend/db/seed.sql in Supabase, then try again.',
        },
        { status: 500 },
      )
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      exam_completed: true,
      exam_taken_at: now,
      exam_answers: answers,
      exam_scores: finalScores,
      faction: storedFaction,
      exam_status: finalResolution.status,
      quiz_completed: true,
      quiz_locked: false,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    )
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

  return NextResponse.json({
    faction: finalResolution.faction,
    factionId: storedFaction,
    status: finalResolution.status,
    scores: finalScores,
    retake: isRetake,
  })
}
