import { NextRequest } from 'next/server'
import { ArenaController } from '@/backend/controllers/arena.controller'
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return ArenaController.vote(req, params.id)
}
