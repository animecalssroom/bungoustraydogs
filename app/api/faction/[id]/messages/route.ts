import { FactionSpaceController } from '@/backend/controllers/faction-space.controller'
import type { FactionId } from '@/backend/types'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return FactionSpaceController.getMessages(req, params.id as FactionId)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return FactionSpaceController.postMessage(req, params.id as FactionId)
}
