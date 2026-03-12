import { NextRequest } from 'next/server'
import { BehaviorController } from '@/backend/controllers/behavior.controller'

export async function POST(request: NextRequest) {
  return BehaviorController.dailyLogin(request)
}
