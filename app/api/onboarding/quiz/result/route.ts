import { NextRequest } from 'next/server'
import { OnboardingController } from '@/backend/controllers/onboarding.controller'

export async function GET(request: NextRequest) {
  return OnboardingController.result(request)
}
