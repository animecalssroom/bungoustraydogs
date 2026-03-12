import { REGISTRY_FALLBACK_POSTS } from '@/backend/lib/registry-catalog'
import {
  countWords,
  generateRegistryCaseNumber,
  reviewRegistryPostWithGemini,
} from '@/backend/lib/registry'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { UserModel } from '@/backend/models/user.model'
import type {
  FactionId,
  Profile,
  RegistryDistrict,
  RegistryPost,
  RegistryStatus,
} from '@/backend/types'
import { AP_VALUES, getRankTitle } from '@/backend/types'

type RegistryListOptions = {
  faction?: FactionId | 'all'
  district?: RegistryDistrict | 'all'
  sort?: 'recent' | 'saved' | 'featured'
  viewerId?: string | null
}

function normalizeRegistryPost(
  row: Partial<RegistryPost> & { id: string; title: string; content: string },
): RegistryPost {
  return {
    id: row.id,
    case_number: row.case_number ?? 'UNFILED',
    author_id: row.author_id ?? '',
    author_character: row.author_character ?? null,
    author_faction: (row.author_faction as FactionId | null) ?? null,
    author_rank: row.author_rank ?? null,
    title: row.title,
    content: row.content,
    district: (row.district as RegistryDistrict | null) ?? null,
    status: (row.status as RegistryStatus) ?? 'pending',
    featured: Boolean(row.featured),
    gemini_review: row.gemini_review ?? null,
    mod_note: row.mod_note ?? null,
    reviewed_by: row.reviewed_by ?? null,
    word_count: row.word_count ?? countWords(row.content),
    save_count: row.save_count ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
    approved_at: row.approved_at ?? null,
    profiles: row.profiles ?? null,
  }
}

function sortRegistryPosts(posts: RegistryPost[], sort: RegistryListOptions['sort']) {
  if (sort === 'saved') {
    return [...posts].sort((left, right) => right.save_count - left.save_count)
  }

  if (sort === 'featured') {
    return [...posts].sort((left, right) => Number(right.featured) - Number(left.featured))
  }

  return [...posts].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )
}

function applyRegistryFilters(posts: RegistryPost[], options: RegistryListOptions) {
  return sortRegistryPosts(
    posts.filter((post) => {
      const factionOk =
        !options.faction || options.faction === 'all' ? true : post.author_faction === options.faction
      const districtOk =
        !options.district || options.district === 'all' ? true : post.district === options.district
      return factionOk && districtOk
    }),
    options.sort ?? 'recent',
  )
}

export const RegistryModel = {
  async getPublic(options: RegistryListOptions = {}) {
    try {
      let query = supabaseAdmin
        .from('registry_posts')
        .select(
          'id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, status, featured, gemini_review, mod_note, reviewed_by, word_count, save_count, created_at, approved_at',
        )
        .eq('status', 'approved')
        .limit(100)

      if (options.faction && options.faction !== 'all') {
        query = query.eq('author_faction', options.faction)
      }

      if (options.district && options.district !== 'all') {
        query = query.eq('district', options.district)
      }

      if (options.sort === 'saved') {
        query = query.order('save_count', { ascending: false })
      } else if (options.sort === 'featured') {
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (error || !data) {
        return applyRegistryFilters(REGISTRY_FALLBACK_POSTS, options)
      }

      return (data as RegistryPost[]).map((row) => normalizeRegistryPost(row))
    } catch {
      return applyRegistryFilters(REGISTRY_FALLBACK_POSTS, options)
    }
  },

  async getByCaseNumber(caseNumber: string, viewerId?: string | null) {
    try {
      const { data } = await supabaseAdmin
        .from('registry_posts')
        .select(
          'id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, status, featured, gemini_review, mod_note, reviewed_by, word_count, save_count, created_at, approved_at',
        )
        .eq('case_number', caseNumber)
        .maybeSingle()

      const post = data ? normalizeRegistryPost(data as RegistryPost) : null

      if (!post) {
        return REGISTRY_FALLBACK_POSTS.find((entry) => entry.case_number === caseNumber) ?? null
      }

      if (post.status === 'approved' || (viewerId && post.author_id === viewerId)) {
        return post
      }

      return null
    } catch {
      return REGISTRY_FALLBACK_POSTS.find((entry) => entry.case_number === caseNumber) ?? null
    }
  },

  async getPendingForFaction(faction: FactionId, viewer: Pick<Profile, 'role' | 'faction'>) {
    if (viewer.role !== 'mod' && viewer.role !== 'owner') {
      return []
    }

    try {
      const queryFaction = viewer.role === 'owner' ? faction : viewer.faction
      const { data, error } = await supabaseAdmin
        .from('registry_posts')
        .select(
          'id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, status, featured, gemini_review, mod_note, reviewed_by, word_count, save_count, created_at, approved_at',
        )
        .in('status', ['pending', 'review'])
        .eq('author_faction', queryFaction)
        .order('created_at', { ascending: true })
        .limit(20)

      if (error || !data) {
        return []
      }

      return (data as RegistryPost[]).map((row) => normalizeRegistryPost(row))
    } catch {
      return []
    }
  },

  async createSubmission(profile: Profile, input: {
    title: string
    content: string
    district: RegistryDistrict
  }) {
    const wordCount = countWords(input.content)

    if (wordCount < 200) {
      return { error: 'Incident reports require at least 200 words.' }
    }

    const { count } = await supabaseAdmin
      .from('registry_posts')
      .select('id', { count: 'exact', head: true })

    const caseNumber = generateRegistryCaseNumber(profile.faction, (count ?? 0) + 1)
    const authorCharacter = profile.character_name ?? profile.character_match_id ?? profile.username
    const authorRank = getRankTitle(profile.rank)

    const payload = {
      case_number: caseNumber,
      author_id: profile.id,
      author_character: authorCharacter,
      author_faction: profile.faction,
      author_rank: authorRank,
      title: input.title,
      content: input.content,
      district: input.district,
      status: 'pending',
      featured: false,
      word_count: wordCount,
      save_count: 0,
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('registry_posts')
        .insert(payload)
        .select(
          'id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, status, featured, gemini_review, mod_note, reviewed_by, word_count, save_count, created_at, approved_at',
        )
        .single()

      if (error || !data) {
        return { error: 'Registry storage is not ready yet. Apply the phase 5 SQL first.' }
      }

      const geminiReview = await reviewRegistryPostWithGemini({
        title: input.title,
        content: input.content,
        authorFaction: profile.faction,
        wordCount,
      })

      if (geminiReview) {
        await supabaseAdmin
          .from('registry_posts')
          .update({ gemini_review: geminiReview })
          .eq('id', data.id)
      }

      return { data: normalizeRegistryPost({ ...(data as RegistryPost), gemini_review: geminiReview ?? null }) }
    } catch {
      return { error: 'Registry storage is not ready yet. Apply the phase 5 SQL first.' }
    }
  },

  async savePost(caseNumber: string, saverId: string) {
    const post = await this.getByCaseNumber(caseNumber, saverId)

    if (!post || post.status !== 'approved') {
      return { error: 'Case file not available.' }
    }

    if (post.author_id === saverId) {
      return { error: 'You cannot save your own report.' }
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('registry_saves')
        .insert({ user_id: saverId, post_id: post.id })
        .select('id')
        .single()

      if (error || !data) {
        return { error: 'This file is already saved to your registry.' }
      }

      await supabaseAdmin
        .from('registry_posts')
        .update({ save_count: (post.save_count ?? 0) + 1 })
        .eq('id', post.id)

      await UserModel.addAp(post.author_id, 'registry_save', AP_VALUES.registry_save, {
        case_number: post.case_number,
        saved_by: saverId,
      })

      return { data: { case_number: post.case_number, save_count: (post.save_count ?? 0) + 1 } }
    } catch {
      return { error: 'Registry save failed.' }
    }
  },

  async reviewPost(
    reviewer: Profile,
    postId: string,
    input: { action: 'approve' | 'review' | 'reject'; note?: string; feature?: boolean },
  ) {
    if (reviewer.role !== 'mod' && reviewer.role !== 'owner') {
      return { error: 'Only moderators can review registry posts.' }
    }

    const { data: row } = await supabaseAdmin
      .from('registry_posts')
      .select(
        'id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, status, featured, gemini_review, mod_note, reviewed_by, word_count, save_count, created_at, approved_at',
      )
      .eq('id', postId)
      .maybeSingle()

    const post = row ? normalizeRegistryPost(row as RegistryPost) : null

    if (!post) {
      return { error: 'Registry post not found.' }
    }

    if (
      reviewer.role === 'mod' &&
      reviewer.faction &&
      post.author_faction &&
      reviewer.faction !== post.author_faction
    ) {
      return { error: 'You can only review reports from your own faction.' }
    }

    if (input.action !== 'approve' && !input.note?.trim()) {
      return { error: 'A moderation note is required for review or rejection.' }
    }

    const nextStatus = input.action === 'approve' ? 'approved' : input.action === 'reject' ? 'rejected' : 'review'
    const updates: Record<string, unknown> = {
      status: nextStatus,
      mod_note: input.note?.trim() || null,
      reviewed_by: reviewer.id,
      approved_at: input.action === 'approve' ? new Date().toISOString() : null,
    }

    if (input.action === 'approve' && input.feature && !post.featured) {
      updates.featured = true
    }

    await supabaseAdmin.from('registry_posts').update(updates).eq('id', post.id)

    if (input.action === 'approve') {
      await UserModel.addAp(post.author_id, 'registry_post', AP_VALUES.registry_post, {
        case_number: post.case_number,
        district: post.district,
      })

      if (input.feature && !post.featured) {
        await UserModel.addAp(post.author_id, 'registry_featured', AP_VALUES.registry_featured, {
          case_number: post.case_number,
        })
      }

      await supabaseAdmin.from('notifications').insert({
        user_id: post.author_id,
        type: 'registry_approved',
        message: `Your incident report ${post.case_number} has been accepted into the Registry. The city remembers.`,
        payload: { case_number: post.case_number },
      })

      if (post.author_faction) {
        await supabaseAdmin.from('faction_activity').insert({
          faction_id: post.author_faction,
          event_type: 'registry_posted',
          description: `${post.author_character ?? 'An operative'} filed incident report ${post.case_number}`,
          actor_id: post.author_id,
        })
      }
    } else {
      await supabaseAdmin.from('notifications').insert({
        user_id: post.author_id,
        type: input.action === 'reject' ? 'registry_rejected' : 'registry_review',
        message:
          input.action === 'reject'
            ? `Your incident report ${post.case_number} was declined. ${input.note?.trim()}`
            : `Your incident report ${post.case_number} needs revision. ${input.note?.trim()}`,
        payload: { case_number: post.case_number },
      })
    }

    return { data: { id: post.id, status: nextStatus } }
  },
}
