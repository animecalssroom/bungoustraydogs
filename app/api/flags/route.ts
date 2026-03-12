import { NextRequest } from 'next/server'
import { SupportController } from '@/backend/controllers/support.controller'

export async function POST(request: NextRequest) {
  return SupportController.createFlag(request)
}
