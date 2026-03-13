import { supabaseAdmin } from '@/backend/lib/supabase'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'
import type { AssignmentFlag, Profile, StoredRole } from '@/backend/types'

async function findOwnerUserId() {
  if (process.env.OWNER_USER_ID) {
    return process.env.OWNER_USER_ID
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

async function createNotification(
  userId: string,
  type: string,
  message: string,
  payload: Record<string, unknown> = {},
) {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    message,
    payload,
  })
}

export const AssignmentModel = {
  async getLatestFlag(userId: string) {
    const { data } = await supabaseAdmin
      .from('assignment_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return (data as AssignmentFlag | null) ?? null
  },

  async createFlag(profile: Profile, notes: string | null = null) {
    const existing = await this.getLatestFlag(profile.id)

    if (existing) {
      return existing
    }

    const { data } = await supabaseAdmin
      .from('assignment_flags')
      .insert({
        user_id: profile.id,
        requested_faction: profile.faction,
        notes,
        status: 'pending',
      })
      .select('*')
      .single()

    await supabaseAdmin
      .from('profiles')
      .update({
        assignment_flag_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    const ownerId = await findOwnerUserId()

    if (ownerId) {
      await createNotification(
        ownerId,
        'assignment_flag',
        `${profile.username} requested assignment review.`,
        {
          flag_user_id: profile.id,
          faction: profile.faction,
        },
      )
    }

    await createNotification(
      profile.id,
      'assignment_flag_received',
      'You will be observed.',
      {
        status: 'pending',
      },
    )

    // Invalidate notifications cache for the affected users
    try {
      if (ownerId) await invalidateNotificationsCache(ownerId)
      await invalidateNotificationsCache(profile.id)
    } catch (err) {
      console.error('[notifications] invalidate after createNotification', err)
    }

    return (data as AssignmentFlag | null) ?? existing
  },

  canFlag(profile: Profile) {
    const allowedRoles: StoredRole[] = ['member', 'waitlist', 'mod']

    return (
      allowedRoles.includes(profile.role) &&
      Boolean(profile.faction) &&
      profile.quiz_completed &&
      profile.quiz_locked &&
      !profile.assignment_flag_used
    )
  },
}
