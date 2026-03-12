import { NextRequest } from 'next/server'
import { RegistryController } from '@/backend/controllers/registry.controller'

export async function GET(req: NextRequest) {
  return RegistryController.getAll(req)
}

export async function POST(req: NextRequest) {
  return RegistryController.create(req)
}
