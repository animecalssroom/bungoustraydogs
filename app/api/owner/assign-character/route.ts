import { NextRequest } from 'next/server'
import { OwnerController } from '@/backend/controllers/owner.controller'

export async function POST(request: NextRequest) {
  return OwnerController.assignReservedCharacter(request)
}
