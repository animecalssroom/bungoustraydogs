import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/lib/supabase/server'
import { GlobalChatModel } from '@/backend/models/global-chat.model'

export async function GET() {
  const messages = await GlobalChatModel.getRecent()
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content } = await req.json()
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  // Fetch profile to get character/faction info
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, character_name, faction')
    .eq('id', session.user.id)
    .single()

  const message = await GlobalChatModel.sendMessage(session.user.id, content, profile || {})

  if (!message) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json(message)
}
