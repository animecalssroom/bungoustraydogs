import { NextRequest } from 'next/server'
import { RegistryController } from '@/backend/controllers/registry.controller'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseNumber: string }> },
) {
  const { caseNumber } = await params
  return RegistryController.save(req, caseNumber)
}
