import type { EffectiveRole, FactionId, Profile, StoredRole } from '@/backend/types'

export type PermissionAction =
  | 'view_character_archive'
  | 'view_lore_posts'
  | 'view_public_faction_pages'
  | 'view_war_strip'
  | 'review_special_division'
  | 'take_faction_quiz'
  | 'access_faction_private_space'
  | 'vote_in_arena'
  | 'submit_lore_post'
  | 'comment_case_note'
  | 'challenge_duel'
  | 'approve_lore_post'
  | 'kick_member'
  | 'appoint_mod'
  | 'trigger_faction_event'
  | 'view_waitlist'
  | 'activate_waitlist_user'
  | 'view_all_users'
  | 'view_leader_channel'

export const PERMISSIONS: Record<PermissionAction, EffectiveRole[]> = {
  view_character_archive: ['guest', 'observer', 'waitlist', 'member', 'mod', 'owner'],
  view_lore_posts: ['guest', 'observer', 'waitlist', 'member', 'mod', 'owner'],
  view_public_faction_pages: ['guest', 'observer', 'waitlist', 'member', 'mod', 'owner'],
  view_war_strip: ['guest', 'observer', 'waitlist', 'member', 'mod', 'owner'],
  review_special_division: ['mod', 'owner'],
  take_faction_quiz: ['waitlist', 'observer', 'mod', 'owner'],
  access_faction_private_space: ['member', 'mod', 'owner'],
  vote_in_arena: ['member', 'mod', 'owner'],
  submit_lore_post: ['member', 'mod', 'owner'],
  comment_case_note: ['member', 'mod', 'owner'],
  challenge_duel: ['member', 'mod', 'owner'],
  approve_lore_post: ['mod', 'owner'],
  kick_member: ['mod', 'owner'],
  appoint_mod: ['owner'],
  trigger_faction_event: ['mod', 'owner'],
  view_waitlist: ['mod', 'owner'],
  activate_waitlist_user: ['mod', 'owner'],
  view_all_users: ['owner'],
  view_leader_channel: ['member', 'mod', 'owner'],
}

export interface PermissionContext {
  rank?: number
  targetFaction?: FactionId | null
  isFactionLeader?: boolean
}

function effectiveRole(profile: Profile | null): EffectiveRole {
  return profile?.role ?? 'guest'
}

function isFactionScopedModerator(
  profile: Profile,
  targetFaction: FactionId | null | undefined,
) {
  if (profile.role === 'owner') return true
  if (profile.role !== 'mod') return false
  if (!targetFaction) return false
  return profile.faction === targetFaction
}

export function canDo(
  profile: Profile | null,
  action: PermissionAction,
  context: PermissionContext = {},
): boolean {
  const role = effectiveRole(profile)
  const allowed = PERMISSIONS[action]

  if (!allowed.includes(role)) {
    return false
  }

  if (!profile) {
    return role === 'guest'
  }

  if (action === 'take_faction_quiz') {
    return (
      profile.username_confirmed &&
      !profile.quiz_completed &&
      !profile.quiz_locked
    )
  }

  if (action === 'challenge_duel' && profile.role === 'member') {
    return (context.rank ?? profile.rank) >= 3
  }

  if (
    action === 'review_special_division' ||
    action === 'approve_lore_post' ||
    action === 'kick_member' ||
    action === 'trigger_faction_event' ||
    action === 'view_waitlist' ||
    action === 'activate_waitlist_user'
  ) {
    return isFactionScopedModerator(profile, context.targetFaction)
  }

  if (action === 'access_faction_private_space' && context.targetFaction) {
    if (profile.role === 'owner') return true
    return profile.faction === context.targetFaction
  }

  if (action === 'view_leader_channel') {
    return profile.role === 'owner' || context.isFactionLeader === true
  }

  return true
}

export function isParticipatingRole(role: StoredRole | null | undefined) {
  return role === 'member' || role === 'mod' || role === 'owner'
}
