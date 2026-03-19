
import { NextRequest } from 'next/server'
import { BehaviorController } from '@/backend/controllers/behavior.controller'
import { requireUserId, isNextResponse } from '@/backend/middleware/auth'

export async function POST(request: NextRequest) {
  // --- Rate limit: max 60 per hour per user ---
  const userId = await requireUserId(request)
  if (isNextResponse(userId)) {
    return userId
  }

  const rlKey = `behavior_update_${userId}`
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const maxReq = 60
  const rlStore = (globalThis as any).__behaviorUpdateRL || ((globalThis as any).__behaviorUpdateRL = {})
  rlStore[rlKey] = (rlStore[rlKey] || []).filter((t: number) => now - t < windowMs)
  if (rlStore[rlKey].length >= maxReq) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
  }
  rlStore[rlKey].push(now)
  return BehaviorController.updateForUser(request, userId)
}
