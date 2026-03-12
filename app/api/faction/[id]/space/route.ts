import { FactionSpaceController } from '@/backend/controllers/faction-space.controller'
import type { FactionId } from '@/backend/types'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return FactionSpaceController.getSpace(req, params.id as FactionId)
}
