import { FactionPageGrid } from '@/frontend/components/faction/FactionCard'
import { FACTION_META, PUBLIC_FACTION_ORDER } from '@/frontend/lib/launch'
import type { Faction } from '@/backend/types'

export const dynamic = 'force-static'

export default async function FactionsPage() {
  const factions: Faction[] = PUBLIC_FACTION_ORDER.map((id) => {
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
      is_lore_locked: false,
      // Static defaults for dynamic fields so the UI renders without Supabase
      ap: 0,
      member_count: 0,
      waitlist_count: 0,
      slot_count: 0,
    }
  })

  return (
    <>
      <div className="section-head">
        <p className="section-eyebrow">派閥 · Factions of Yokohama</p>
        <h1 className="section-title">
          Public Files. <em>Sealed Rooms.</em>
        </h1>
        <div className="ink-divider" />
        <p className="section-sub">
          Everyone can read the dossiers. Only assigned members can cross the inner threshold.
        </p>
      </div>
      <FactionPageGrid factions={factions} />
    </>
  )
}
