import type { Profile } from '@/backend/types'

export const EXAM_RETAKE_COST = 500
export const EXAM_RETAKE_WAIT_DAYS = 30
export const EXAM_RETAKE_WAIT_MS =
  EXAM_RETAKE_WAIT_DAYS * 24 * 60 * 60 * 1000

export function buildExamRetakeEligibleAtIso(
  from: Date | string = new Date(),
) {
  const start =
    typeof from === 'string' ? new Date(from) : new Date(from.getTime())

  return new Date(start.getTime() + EXAM_RETAKE_WAIT_MS).toISOString()
}

export function getExamRetakeEligibleAt(profile: Pick<
  Profile,
  'exam_retake_eligible_at' | 'exam_taken_at'
>) {
  if (profile.exam_retake_eligible_at) {
    return new Date(profile.exam_retake_eligible_at)
  }

  if (profile.exam_taken_at) {
    return new Date(
      new Date(profile.exam_taken_at).getTime() + EXAM_RETAKE_WAIT_MS,
    )
  }

  return null
}

export function getExamRetakeStatus(
  profile: Pick<
    Profile,
    | 'exam_completed'
    | 'exam_taken_at'
    | 'exam_retake_eligible_at'
    | 'exam_retake_used'
    | 'ap_total'
    | 'quiz_completed'
    | 'quiz_locked'
  >,
  now = new Date(),
) {
  const eligibleAt = getExamRetakeEligibleAt(profile)
  const apShortfall = Math.max(0, EXAM_RETAKE_COST - profile.ap_total)
  const waitingMs = eligibleAt ? Math.max(0, eligibleAt.getTime() - now.getTime()) : null
  const retakeInProgress = profile.exam_completed && !profile.quiz_completed
  const canRetake =
    profile.exam_completed &&
    !profile.exam_retake_used &&
    !retakeInProgress &&
    profile.quiz_completed &&
    profile.quiz_locked &&
    eligibleAt !== null &&
    eligibleAt.getTime() <= now.getTime() &&
    apShortfall === 0

  return {
    eligibleAt,
    apShortfall,
    waitingMs,
    retakeInProgress,
    alreadyUsed: profile.exam_retake_used,
    canRetake,
  }
}
