import { supabaseAdmin } from '@/backend/lib/supabase'
import { CHARACTER_ASSIGNMENT_POOL } from '@/frontend/lib/bsd-character-update'
import { assignCharacterWithGemini } from './geminiAssignment'
import { assignCharacterByDistance, findSecondaryMatch } from './distanceAssignment'

export async function runCharacterAssignment(userId: string): Promise<void> {
  // Double-check not already assigned (race condition guard)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, faction, behavior_scores, trait_scores, avg_move_speed_minutes,
      quiz_scores, character_name
    `)
    .eq('id', userId)
    .single()

  if (!profile || profile.character_name) return

  // Gather data to send to Gemini
  const behaviorScores = profile.behavior_scores ?? {}
  const traitScores    = profile.trait_scores    ?? {}

  // Top 3 archive reads (lore_topics)
  const { data: archiveEvents } = await supabaseAdmin
    .from('user_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'archive_read')
    .limit(50)

  const slugCounts: Record<string, number> = {}
  for (const e of archiveEvents ?? []) {
    const slug = (e.metadata as any)?.slug
    if (slug) slugCounts[slug] = (slugCounts[slug] ?? 0) + 1
  }
  const loreTopics = Object.entries(slugCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug)

  // Duel style counts
  const duelStyle = (behaviorScores as any)?.duel_style ?? { gambit: 0, strike: 0, stance: 0 }

  // Most recent 5 event types
  const { data: recentEvents } = await supabaseAdmin
    .from('user_events')
    .select('event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  const recentEventTypes = (recentEvents ?? []).map((e) => e.event_type)

  // Earliest registry post for writing sample
  const { data: registryPosts } = await supabaseAdmin
    .from('registry_posts')
    .select('content')
    .eq('author_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(1)
  const writingSample = registryPosts?.[0]?.content?.slice(0, 200) ?? null

  // Dominant quiz trait
  const scores = profile.quiz_scores ?? traitScores ?? {}
  const quizDominantTrait = Object.entries(scores as Record<string, number>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Combined trait vector: 60% exam + 40% behavior
  const AXES = ['justice', 'power', 'social', 'emotion', 'world', 'identity', 'method', 'loyalty']
  const compositeVector: Record<string, number> = {}
  for (const axis of AXES) {
    const exam     = (traitScores as any)?.[axis]     ?? 5
    const behavior = (behaviorScores as any)?.[axis]  ?? 5
    compositeVector[axis] = exam * 0.6 + behavior * 0.4
  }

  const assignmentData = {
    compositeVector,
    loreTopics,
    duelStyle,
    avgMoveSpeed: profile.avg_move_speed_minutes ?? null,
    writingSample,
    recentEvents: recentEventTypes,
    quizDominantTrait,
    faction: profile.faction,
  }

  // Try Gemini first, fall back to distance
  let isDistanceFallback = false
  let result: any = await assignCharacterWithGemini(assignmentData)

  if (!result) {
    isDistanceFallback = true
    const fallback = assignCharacterByDistance(assignmentData.compositeVector, profile.faction)
    if (fallback) {
      const meta = CHARACTER_ASSIGNMENT_POOL.find((c) => c.slug === fallback.slug)
      if (meta) {
        result = {
          slug: meta.slug,
          name: meta.name,
          ability: meta.ability,
          ability_jp: meta.abilityJp,
          description: '',
          type: 'Assigned',
        }
      }
    }
  }

  if (!result) {
    console.error('[assignment] Both Gemini and distance fallback failed for', userId)
    return
  }

  // Find secondary match (second closest by distance)
  const secondaryMatch = findSecondaryMatch(compositeVector, result.slug, profile.faction)
  let secondaryName = secondaryMatch?.slug ?? null
  if (secondaryMatch?.slug) {
    const sMeta = CHARACTER_ASSIGNMENT_POOL.find(c => c.slug === secondaryMatch.slug)
    if (sMeta) secondaryName = sMeta.name
  }

  // Write to profile
  await supabaseAdmin
    .from('profiles')
    .update({
      character_name:          result.name,
      character_match_id:      result.slug,
      character_ability:       result.ability ?? null,
      character_ability_jp:    result.ability_jp ?? null,
      character_description:   result.description ?? null,
      character_type:          result.type ?? null,
      character_assigned_at:   new Date().toISOString(),
      secondary_character_slug: secondaryMatch?.slug ?? null,
      secondary_character_name: secondaryName,
    })
    .eq('id', userId)

  // Calculate dominant composite axis for UI explanation
  const dominantCompositeAxis = Object.entries(compositeVector)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

  // Record assignment event
  await supabaseAdmin.from('user_events').insert({
    user_id: userId,
    event_type: 'character_assigned',
    ap_awarded: 0,
    metadata: { 
      slug: result.slug, 
      name: result.name,
      source: isDistanceFallback ? 'distance' : 'gemini',
      dominant_axis: dominantCompositeAxis,
      behavior_snapshot: compositeVector
    },
  })

  // Notify the user
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'character_assigned',
    message: `The city has registered your ability. You have been matched with ${result.name}.`,
    payload: { slug: result.slug, name: result.name },
    action_url: `/profile`,
  })

  try { await import('@/backend/lib/notifications-cache').then(m => m.invalidateNotificationsCache(userId)) } catch (err) { }

  console.log(`[assignment] Assigned ${result.name} to user ${userId}`)
}
