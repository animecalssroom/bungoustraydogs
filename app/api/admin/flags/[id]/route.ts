import { NextRequest } from 'next/server'
import { SupportController } from '@/backend/controllers/support.controller'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return SupportController.resolveFlag(request, params.id)
}
