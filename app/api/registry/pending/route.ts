import { NextRequest } from 'next/server'
import { RegistryController } from '@/backend/controllers/registry.controller'

export async function GET(req: NextRequest) {
  return RegistryController.getMinePending(req)
}
