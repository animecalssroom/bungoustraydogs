import { NextRequest } from 'next/server'
import { DiscussionController } from '@/backend/controllers/discussion.controller'

export async function GET(
  _: NextRequest,
  { params }: { params: { slug: string } },
) {
  return DiscussionController.getLoreComments(params.slug)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  return DiscussionController.addLoreComment(req, params.slug)
}
