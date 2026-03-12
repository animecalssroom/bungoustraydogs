import { NextRequest, NextResponse } from 'next/server'
import { ArenaController } from '@/backend/controllers/arena.controller'
import { ArenaModel } from '@/backend/models/arena.model'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const debate = await ArenaModel.getById(params.id)

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
  }

  const argumentsList = await ArenaModel.getArguments(params.id)
  return NextResponse.json({ data: argumentsList })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return ArenaController.postArgument(req, params.id)
}
