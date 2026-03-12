import { NextRequest } from 'next/server'
import { OnboardingController } from '@/backend/controllers/onboarding.controller'

export async function POST(request: NextRequest) {
  return OnboardingController.accept(request)
}
