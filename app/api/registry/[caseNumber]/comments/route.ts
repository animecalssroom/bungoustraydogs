import { NextRequest } from 'next/server'
import { DiscussionController } from '@/backend/controllers/discussion.controller'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ caseNumber: string }> },
) {
  const { caseNumber } = await params
  return DiscussionController.getRegistryComments(caseNumber)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseNumber: string }> },
) {
  const { caseNumber } = await params
  return DiscussionController.addRegistryComment(req, caseNumber)
}
