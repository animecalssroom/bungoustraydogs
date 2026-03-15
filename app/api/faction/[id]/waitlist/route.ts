import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/lib/supabase/server'
import { WaitlistModel } from '@/backend/models/waitlist.model'
import { OnboardingModel } from '@/backend/models/onboarding.model'
import type { VisibleFactionId } from '@/backend/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const factionId = params.id as VisibleFactionId
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify viewer is Mod/Owner of THIS faction
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, faction')
    .eq('id', user.id)
    .single()

  const isAuthorized = profile?.role === 'owner' || (profile?.role === 'mod' && profile.faction === factionId)
  if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('waitlist')
    .select(`
      id,
      user_id,
      joined_at,
      position,
      profiles:user_id (
        username,
        character_name
      )
    `)
    .eq('faction', factionId)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const factionId = params.id as VisibleFactionId
  const body = await request.json()
  const { action, targetUserId } = body // action: 'activate' | 'reject'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify viewer is Mod/Owner of THIS faction
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, faction')
    .eq('id', user.id)
    .single()

  const isAuthorized = profile?.role === 'owner' || (profile?.role === 'mod' && profile.faction === factionId)
  if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (action === 'activate') {
    // Check space first
    const hasSpace = await OnboardingModel.factionHasSpace(factionId)
    if (!hasSpace) return NextResponse.json({ error: 'Faction is currently full.' }, { status: 400 })

    // If targetUserId is provided, we activate that specific user if they are at the top,
    // but the model usually activates the 'next' one. Let's make it flexible.
    // For now, let's use the model's activateNext but we can refine it to a specific user if needed.
    // Actually, let's allow activating a SPECIFIC user from the waitlist if space allows.
    
    // Custom activation for a specific user
    const { data: entry } = await supabase
      .from('waitlist')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('faction', factionId)
      .single()

    if (!entry) return NextResponse.json({ error: 'User not found in waitlist.' }, { status: 404 })

    // Move to member
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'member',
        faction: factionId,
        exam_completed: true,
        quiz_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Cleanup waitlist
    await WaitlistModel.removeByUser(targetUserId)
    
    return NextResponse.json({ success: true, message: 'File activated.' })
  }

  if (action === 'reject') {
    await WaitlistModel.removeByUser(targetUserId)
    // Optional: add a notification for the user?
    return NextResponse.json({ success: true, message: 'Waitlist entry removed.' })
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
}
