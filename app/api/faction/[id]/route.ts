import { NextRequest } from 'next/server'
import { FactionController } from '@/backend/controllers/faction.controller'
import type { FactionId } from '@/backend/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return FactionController.getById(request, params.id as FactionId)
}
