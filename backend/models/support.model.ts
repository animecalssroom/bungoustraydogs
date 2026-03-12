import { supabaseAdmin } from '@/backend/lib/supabase'
import type {
  ContentFlag,
  ContentFlagEntityType,
  ContentFlagStatus,
  FactionId,
  Profile,
  SupportTicket,
  TicketCategory,
  TicketQueue,
  TicketStatus,
} from '@/backend/types'

export interface TicketQueueItem extends SupportTicket {
  username: string
  faction: FactionId | null
  role: Profile['role']
}

export interface ContentFlagQueueItem extends ContentFlag {
  reporter_username: string
}

type TicketTargetRow = Pick<Profile, 'id' | 'username' | 'faction' | 'role'>

type FlagTarget =
  | {
      exists: false
      authorId: null
    }
  | {
      exists: true
      authorId: string | null
    }

function nowIso() {
  return new Date().toISOString()
}

function resolveTicketQueue(category: TicketCategory): TicketQueue {
  if (category === 'registry' || category === 'lore' || category === 'faction' || category === 'special_division') {
    return 'special_division'
  }

  return 'owner'
}

function canModerateQueue(
  actor: Pick<Profile, 'role' | 'faction'>,
  queue: TicketQueue,
) {
  if (actor.role === 'owner') {
    return true
  }

  return queue === 'special_division' && actor.role === 'mod' && actor.faction === 'special_div'
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

async function getOwnerIds() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'owner')

  return (data ?? []).map((row) => row.id)
}

async function getSpecialDivisionModeratorIds() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'mod')
    .eq('faction', 'special_div')

  return (data ?? []).map((row) => row.id)
}

async function notifyQueue(
  queue: TicketQueue,
  type: string,
  message: string,
  payload: Record<string, unknown>,
) {
  const recipientIds =
    queue === 'owner' ? await getOwnerIds() : await getSpecialDivisionModeratorIds()

  if (recipientIds.length === 0 && queue === 'special_division') {
    const owners = await getOwnerIds()
    await Promise.all(owners.map((id) => createNotification(id, type, message, payload)))
    return
  }

  await Promise.all(recipientIds.map((id) => createNotification(id, type, message, payload)))
}

async function loadTicketTargets(rows: Array<Pick<SupportTicket, 'user_id'>>) {
  const ids = Array.from(new Set(rows.map((row) => row.user_id)))

  if (ids.length === 0) {
    return {} as Record<string, TicketTargetRow>
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, faction, role')
    .in('id', ids)

  return (data ?? []).reduce<Record<string, TicketTargetRow>>((map, row) => {
    map[row.id] = row as TicketTargetRow
    return map
  }, {})
}

async function loadFlagReporters(rows: Array<Pick<ContentFlag, 'reporter_id'>>) {
  const ids = Array.from(new Set(rows.map((row) => row.reporter_id)))

  if (ids.length === 0) {
    return {} as Record<string, Pick<Profile, 'id' | 'username'>>
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .in('id', ids)

  return (data ?? []).reduce<Record<string, Pick<Profile, 'id' | 'username'>>>((map, row) => {
    map[row.id] = row
    return map
  }, {})
}

async function getFlagTarget(
  entityType: ContentFlagEntityType,
  entityId: string,
): Promise<FlagTarget> {
  if (entityType === 'lore_post') {
    const { data } = await supabaseAdmin
      .from('lore_posts')
      .select('author_id')
      .eq('id', entityId)
      .maybeSingle()

    if (!data) {
      return { exists: false, authorId: null }
    }

    return { exists: true, authorId: data.author_id ?? null }
  }

  if (entityType === 'registry_post') {
    const { data } = await supabaseAdmin
      .from('registry_posts')
      .select('author_id')
      .eq('id', entityId)
      .maybeSingle()

    if (!data) {
      return { exists: false, authorId: null }
    }

    return { exists: true, authorId: data.author_id ?? null }
  }

  const { data } = await supabaseAdmin
    .from('post_comments')
    .select('user_id')
    .eq('id', entityId)
    .maybeSingle()

  if (!data) {
    return { exists: false, authorId: null }
  }

  return { exists: true, authorId: data.user_id ?? null }
}

async function performFlagAction(
  flag: ContentFlag,
  note: string | null,
): Promise<{ actionTaken: string; authorId: string | null } | { error: string }> {
  const target = await getFlagTarget(flag.entity_type, flag.entity_id)

  if (!target.exists) {
    return {
      actionTaken: 'Target file was already missing when review was attempted.',
      authorId: null,
    }
  }

  if (flag.entity_type === 'lore_post') {
    const { error } = await supabaseAdmin
      .from('lore_posts')
      .update({
        is_published: false,
        updated_at: nowIso(),
      })
      .eq('id', flag.entity_id)

    if (error) {
      return { error: error.message }
    }

    return {
      actionTaken: note?.trim() || 'Lore entry was removed from public circulation.',
      authorId: target.authorId,
    }
  }

  if (flag.entity_type === 'registry_post') {
    const { error } = await supabaseAdmin
      .from('registry_posts')
      .update({
        status: 'review',
        featured: false,
        approved_at: null,
        mod_note: note?.trim() || 'Flagged for further registry review.',
      })
      .eq('id', flag.entity_id)

    if (error) {
      return { error: error.message }
    }

    return {
      actionTaken: note?.trim() || 'Registry file was pulled back into review.',
      authorId: target.authorId,
    }
  }

  const { error } = await supabaseAdmin.from('post_comments').delete().eq('id', flag.entity_id)

  if (error) {
    return { error: error.message }
  }

  return {
    actionTaken: note?.trim() || 'Comment was removed from the file thread.',
    authorId: target.authorId,
  }
}

export const SupportModel = {
  async createTicket(
    profile: Profile,
    input: { category: TicketCategory; subject: string; details: string },
  ) {
    const queue = resolveTicketQueue(input.category)
    const now = nowIso()
    const nextSubject = input.subject.trim()
    const nextDetails = input.details.trim()

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: profile.id,
        queue,
        category: input.category,
        subject: nextSubject,
        details: nextDetails,
        status: 'open',
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to file this ticket right now.' }
    }

    await createNotification(
      profile.id,
      'ticket_received',
      'The registry has filed your ticket for review.',
      {
        ticket_id: data.id,
        queue,
      },
    )

    await notifyQueue(
      queue,
      'support_ticket',
      `${profile.username} filed a ${input.category.replace(/_/g, ' ')} ticket.`,
      {
        ticket_id: data.id,
        username: profile.username,
        queue,
        category: input.category,
      },
    )

    return { data: data as SupportTicket }
  },

  async createContentFlag(
    profile: Profile,
    input: {
      entityType: ContentFlagEntityType
      entityId: string
      targetPath: string
      targetLabel?: string | null
      reason: string
      details?: string | null
    },
  ) {
    const target = await getFlagTarget(input.entityType, input.entityId)

    if (!target.exists) {
      return { error: 'That file is no longer available for review.' }
    }

    if (target.authorId && target.authorId === profile.id) {
      return { error: 'You cannot flag your own file.' }
    }

    const queue: TicketQueue = 'special_division'
    const now = nowIso()
    const reason = input.reason.trim()
    const details = input.details?.trim() || null

    const { data, error } = await supabaseAdmin
      .from('content_flags')
      .insert({
        reporter_id: profile.id,
        queue,
        entity_type: input.entityType,
        entity_id: input.entityId,
        target_path: input.targetPath,
        target_label: input.targetLabel ?? null,
        reason,
        details,
        status: 'open',
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Unable to flag this file right now.' }
    }

    await createNotification(
      profile.id,
      'content_flag_received',
      'The registry has accepted your flagged-file report.',
      {
        flag_id: data.id,
      },
    )

    await notifyQueue(
      queue,
      'content_flag',
      `${profile.username} flagged a file for review.`,
      {
        flag_id: data.id,
        target_path: input.targetPath,
        target_label: input.targetLabel ?? null,
        entity_type: input.entityType,
      },
    )

    return { data: data as ContentFlag }
  },

  async getUserDesk(userId: string) {
    const [ticketsResult, flagsResult] = await Promise.all([
      supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('content_flags')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    return {
      tickets: (ticketsResult.data ?? []) as SupportTicket[],
      flags: (flagsResult.data ?? []) as ContentFlag[],
    }
  },

  async getQueueTickets(queue?: TicketQueue) {
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .in('status', ['open', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(100)

    if (queue) {
      query = query.eq('queue', queue)
    }

    const { data } = await query
    const rows = (data ?? []) as SupportTicket[]
    const targets = await loadTicketTargets(rows)

    return rows.map<TicketQueueItem>((row) => ({
      ...row,
      username: targets[row.user_id]?.username ?? 'Unknown User',
      faction: targets[row.user_id]?.faction ?? null,
      role: targets[row.user_id]?.role ?? 'observer',
    }))
  },

  async getQueueFlags(queue?: TicketQueue) {
    let query = supabaseAdmin
      .from('content_flags')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(100)

    if (queue) {
      query = query.eq('queue', queue)
    }

    const { data } = await query
    const rows = (data ?? []) as ContentFlag[]
    const reporters = await loadFlagReporters(rows)

    return rows.map<ContentFlagQueueItem>((row) => ({
      ...row,
      reporter_username: reporters[row.reporter_id]?.username ?? 'Unknown Reporter',
    }))
  },

  async resolveTicket(
    actor: Pick<Profile, 'id' | 'role' | 'faction'>,
    ticketId: string,
    input: { status: Extract<TicketStatus, 'in_review' | 'resolved' | 'dismissed'>; note?: string | null },
  ) {
    const { data } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle()

    const ticket = (data as SupportTicket | null) ?? null

    if (!ticket) {
      return { error: 'Ticket not found.' }
    }

    if (!canModerateQueue(actor, ticket.queue)) {
      return { error: 'Forbidden' }
    }

    const now = nowIso()
    const responseNote = input.note?.trim() || null

    const { data: updated, error } = await supabaseAdmin
      .from('support_tickets')
      .update({
        status: input.status,
        response_note: responseNote,
        handled_by: actor.id,
        handled_at: now,
        updated_at: now,
      })
      .eq('id', ticketId)
      .select('*')
      .single()

    if (error || !updated) {
      return { error: error?.message ?? 'Unable to update this ticket.' }
    }

    await createNotification(
      ticket.user_id,
      'ticket_resolved',
      responseNote
        ? `Your registry ticket was updated: ${responseNote}`
        : `Your registry ticket is now marked ${input.status.replace(/_/g, ' ')}.`,
      {
        ticket_id: ticket.id,
        status: input.status,
      },
    )

    return { data: updated as SupportTicket }
  },

  async resolveFlag(
    actor: Pick<Profile, 'id' | 'role' | 'faction'>,
    flagId: string,
    input: { action: 'dismiss' | 'take_action'; note?: string | null },
  ) {
    const { data } = await supabaseAdmin
      .from('content_flags')
      .select('*')
      .eq('id', flagId)
      .maybeSingle()

    const flag = (data as ContentFlag | null) ?? null

    if (!flag) {
      return { error: 'Flagged file not found.' }
    }

    if (!canModerateQueue(actor, flag.queue)) {
      return { error: 'Forbidden' }
    }

    const now = nowIso()
    let nextStatus: ContentFlagStatus = 'dismissed'
    let actionTaken = input.note?.trim() || 'Flag dismissed after review.'
    let authorId: string | null = null

    if (input.action === 'take_action') {
      const result = await performFlagAction(flag, input.note?.trim() || null)

      if ('error' in result) {
        return { error: result.error }
      }

      nextStatus = 'actioned'
      actionTaken = result.actionTaken
      authorId = result.authorId
    }

    const { data: updated, error } = await supabaseAdmin
      .from('content_flags')
      .update({
        status: nextStatus,
        action_taken: actionTaken,
        handled_by: actor.id,
        handled_at: now,
        updated_at: now,
      })
      .eq('id', flagId)
      .select('*')
      .single()

    if (error || !updated) {
      return { error: error?.message ?? 'Unable to resolve this flagged file.' }
    }

    await createNotification(
      flag.reporter_id,
      'content_flag_resolved',
      actionTaken,
      {
        flag_id: flag.id,
        status: nextStatus,
        target_path: flag.target_path,
      },
    )

    if (authorId && authorId !== flag.reporter_id) {
      await createNotification(
        authorId,
        'content_flag_action',
        actionTaken,
        {
          flag_id: flag.id,
          target_path: flag.target_path,
        },
      )
    }

    return { data: updated as ContentFlag }
  },
}
