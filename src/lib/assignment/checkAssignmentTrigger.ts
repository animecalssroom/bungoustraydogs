import { supabaseAdmin } from '@/backend/lib/supabase'
import {
  CHARACTER_ASSIGNMENT_THRESHOLD,
  QUALIFYING_ASSIGNMENT_EVENTS,
} from '@/backend/types'
import { runCharacterAssignment } from './runCharacterAssignment'

export async function checkAssignmentTrigger(userId: string): Promise<void> {
  // Skip if already assigned
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('character_name, faction')
    .eq('id', userId)
    .single()

  if (!profile || profile.character_name) return // already assigned
  if (!profile.faction) return // needs faction first

  // Count qualifying events
  const { count } = await supabaseAdmin
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('event_type', QUALIFYING_ASSIGNMENT_EVENTS)

  if (!count || count < CHARACTER_ASSIGNMENT_THRESHOLD) return

  // Threshold reached — fire assignment
  await runCharacterAssignment(userId)
}
