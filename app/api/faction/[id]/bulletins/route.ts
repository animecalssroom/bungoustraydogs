import { NextRequest } from 'next/server'
import { FactionSpaceController } from '@/backend/controllers/faction-space.controller'
import type { FactionId } from '@/backend/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return FactionSpaceController.postBulletin(req, params.id as FactionId)
}
