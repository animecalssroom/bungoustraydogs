import { NextRequest } from 'next/server'
import { SpecialDivisionController } from '@/backend/controllers/special-division.controller'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return SpecialDivisionController.resolve(request, params.id)
}
