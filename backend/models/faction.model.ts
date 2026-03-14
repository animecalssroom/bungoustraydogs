import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import type {
  Faction,
  FactionId,
  FactionMemberSummary,
  StoredRole,
} from '@/backend/types'
import { FACTION_META, PUBLIC_FACTION_ORDER } from '@/frontend/lib/launch'

type SlotRow = {
  faction: string
  active_count: number
  max_slots: number
}

type PublicRosterRow = {
  id: string
  username: string
  character_name: string | null
  avatar_url: string | null
  rank: number
  ap_total: number
  role: StoredRole
  faction: FactionId | null
  character_match_id: string | null
  last_seen: string | null
}

function baseFaction(id: FactionId): Faction {
  const meta = FACTION_META[id]

  return {
    id,
    name: meta.name,
    name_jp: meta.nameJp,
    kanji: meta.kanji,
    description: meta.description,
    philosophy: meta.philosophy,
    theme: meta.theme,
    color: meta.color,
    is_joinable: meta.isJoinable,
    is_hidden: meta.isHidden,
    is_lore_locked: !meta.isJoinable,
    ap: 0,
    member_count: 0,
    waitlist_count: 0,
    slot_count: 0,
  }
}

export const FactionModel = {
  async getAll(): Promise<Faction[]> {
    return cache.getOrSet('factions:all', 3600, async () => {
      const [slotResult, waitlistResult, apResult] = await Promise.all([
        supabaseAdmin.from('faction_slots').select('faction, active_count, max_slots'),
        supabaseAdmin.from('waitlist').select('faction'),
        supabaseAdmin
          .from('profiles')
          .select('faction, ap_total')
          .not('faction', 'is', null),
      ])

      const slots = (slotResult.data ?? []) as SlotRow[]
      const waitlistRows = waitlistResult.data ?? []
      const apRows = apResult.data ?? []

      return PUBLIC_FACTION_ORDER.map((id) => {
        const faction = baseFaction(id)
        const slot = slots.find((row) => row.faction === id)
        const factionAp = apRows
          .filter((row) => row.faction === id)
          .reduce((sum, row) => sum + (row.ap_total ?? 0), 0)

        return {
          ...faction,
          ap: factionAp,
          member_count: slot?.active_count ?? 0,
          waitlist_count: waitlistRows.filter((row) => row.faction === id).length,
          slot_count: slot?.max_slots ?? 0,
        }
      })
    })
  },

  async invalidateCache() {
    await cache.invalidate('factions:all')
  },

  async getById(id: FactionId): Promise<Faction | null> {
    const all = await this.getAll()
    return all.find((faction) => faction.id === id) ?? null
  },

  async getLeader(id: FactionId): Promise<FactionMemberSummary | null> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, username, character_name, avatar_url, rank, ap_total, role, faction, character_match_id, last_seen')
      .eq('faction', id)
      .in('role', ['member', 'mod'])
      .order('role', { ascending: false })
      .order('ap_total', { ascending: false })
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return (data as FactionMemberSummary | null) ?? null
  },

  async getPublicRoster(id: FactionId, limit = 6): Promise<FactionMemberSummary[]> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, username, character_name, avatar_url, rank, ap_total, role, faction, character_match_id, last_seen')
      .eq('faction', id)
      .in('role', ['member', 'mod'])
      .order('role', { ascending: false })
      .order('ap_total', { ascending: false })
      .limit(limit)

    return ((data ?? []) as PublicRosterRow[]).map((member) => ({
      id: member.id,
      username: member.username,
      character_name: member.character_name,
      avatar_url: member.avatar_url,
      rank: member.rank,
      ap_total: member.ap_total,
      role: member.role,
      faction: member.faction,
      character_match_id: member.character_match_id,
      last_seen: member.last_seen,
    }))
  },

  async getRecentEvents(id: FactionId, limit = 4) {
    const { data } = await supabaseAdmin
      .from('user_events')
      .select('event_type, ap_awarded, created_at, metadata')
      .eq('faction', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data ?? []
  },
}
