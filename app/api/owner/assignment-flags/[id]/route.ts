import { NextRequest } from 'next/server'
import { OwnerController } from '@/backend/controllers/owner.controller'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return OwnerController.resolveAssignmentFlag(request, params.id)
}
