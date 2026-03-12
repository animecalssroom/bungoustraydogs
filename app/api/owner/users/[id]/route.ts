import { NextRequest } from 'next/server'
import { OwnerController } from '@/backend/controllers/owner.controller'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return OwnerController.deleteUser(request, params.id)
}
