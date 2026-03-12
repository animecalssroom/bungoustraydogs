import { supabaseAdmin } from '@/backend/lib/supabase'
import type { PostComment, Profile } from '@/backend/types'

const COMMENT_SELECT =
  'id, entity_type, entity_id, user_id, content, created_at, updated_at, profiles(username, avatar_url, role, rank, faction)'

type RawComment = Omit<Partial<PostComment>, 'profiles'> & {
  id: string
  entity_type: 'lore' | 'registry'
  entity_id: string
  user_id: string
  content: string
  profiles?:
    | Pick<Profile, 'username' | 'avatar_url' | 'role' | 'rank' | 'faction'>
    | Array<Pick<Profile, 'username' | 'avatar_url' | 'role' | 'rank' | 'faction'>>
    | null
}

function normalizeComment(row: RawComment): PostComment {
  const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null)

  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    profiles: profile ?? null,
  }
}

async function getEntityIdBySlug(slug: string) {
  const { data } = await supabaseAdmin
    .from('lore_posts')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  return data?.id ?? null
}

async function getEntityIdByCaseNumber(caseNumber: string) {
  const { data } = await supabaseAdmin
    .from('registry_posts')
    .select('id, status')
    .eq('case_number', caseNumber)
    .maybeSingle()

  if (!data || data.status !== 'approved') {
    return null
  }

  return data.id
}

export const DiscussionModel = {
  async getComments(entityType: 'lore' | 'registry', entityId: string) {
    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .select(COMMENT_SELECT)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return (data as RawComment[]).map((row) => normalizeComment(row))
  },

  async getLoreComments(slug: string) {
    const entityId = await getEntityIdBySlug(slug)
    if (!entityId) {
      return []
    }

    return this.getComments('lore', entityId)
  },

  async getRegistryComments(caseNumber: string) {
    const entityId = await getEntityIdByCaseNumber(caseNumber)
    if (!entityId) {
      return []
    }

    return this.getComments('registry', entityId)
  },

  async addLoreComment(profile: Profile, slug: string, content: string) {
    const entityId = await getEntityIdBySlug(slug)
    if (!entityId) {
      return { error: 'Lore entry not found.' }
    }

    return this.addComment(profile, 'lore', entityId, content)
  },

  async addRegistryComment(profile: Profile, caseNumber: string, content: string) {
    const entityId = await getEntityIdByCaseNumber(caseNumber)
    if (!entityId) {
      return { error: 'Registry file not found.' }
    }

    return this.addComment(profile, 'registry', entityId, content)
  },

  async addComment(
    profile: Profile,
    entityType: 'lore' | 'registry',
    entityId: string,
    content: string,
  ) {
    if (!['member', 'mod', 'owner'].includes(profile.role)) {
      return { error: 'Only active users can leave a note on the file.' }
    }

    const nextContent = content.trim()
    if (nextContent.length < 2) {
      return { error: 'Comment is too short.' }
    }

    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: profile.id,
        content: nextContent,
      })
      .select(COMMENT_SELECT)
      .single()

    if (error || !data) {
      return { error: 'Unable to file your note right now.' }
    }

    return { data: normalizeComment(data as RawComment) }
  },
}
