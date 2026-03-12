import { NextRequest } from 'next/server'
import { RegistryController } from '@/backend/controllers/registry.controller'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  return RegistryController.review(req, postId)
}
