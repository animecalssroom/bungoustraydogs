
import { NextRequest } from 'next/server'
import { CharacterController } from '@/backend/controllers/character.controller'

export async function POST(request: NextRequest) {
  // --- Rate limit: max 1 per user ever ---
  const supabase = require('@/frontend/lib/supabase/server').createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const { data: assigned } = await supabase
    .from('character_assignments')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (assigned) {
    return new Response(JSON.stringify({ error: 'Already assigned' }), { status: 429 })
  }
  return CharacterController.assignMine(request)
}
