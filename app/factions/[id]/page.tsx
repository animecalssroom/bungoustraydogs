import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRankTitle, type FactionId } from '@/backend/types'
import { FactionModel } from '@/backend/models/faction.model'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { FACTION_META, getCharacterReveal, privateFactionPath } from '@/frontend/lib/launch'
import { getViewerProfile } from '@/frontend/lib/auth-server'
import styles from './page.module.css'


const HERO_CLASSES: Record<FactionId, string> = {
  agency: styles.heroAgency,
  mafia: styles.heroMafia,
  guild: styles.heroGuild,
  hunting_dogs: styles.heroDogs,
  special_div: styles.heroSpecial,
  rats: styles.heroRats,
  decay: styles.heroDecay,
  clock_tower: styles.heroClock,
}

const DOSSIER_LABELS: Record<FactionId, string> = {
  agency: 'Agency case file · Yokohama branch',
  mafia: 'Port registry · Internal circulation',
  guild: 'Executive ledger · Overseas file',
  hunting_dogs: 'Military operations record',
  special_div: 'Special surveillance file',
  rats: 'Sealed theological annex',
  decay: 'Counter-order instability file',
  clock_tower: 'Foreign office intelligence copy',
}

const LEADER_NOTES: Record<FactionId, string> = {
  agency:
    'Casework compounds into influence. The desk with the longest file usually holds the room.',
  mafia:
    'Inside the Port Mafia, authority is never decorative. It is visible, enforced, and remembered.',
  guild:
    'Guild leadership reads like capital allocation: whoever shapes the board shapes the city beneath it.',
  hunting_dogs:
    'Command belongs to the member most willing to carry duty past comfort and past mercy.',
  special_div:
    'No public chain of command is filed here. Observation replaces spectacle, and silence replaces ceremony.',
  rats: 'No stable leader record is distributed for this file.',
  decay: 'This file does not preserve leadership as a stable institution.',
  clock_tower: 'Command in this file appears only after it has already been exercised.',
}

const TERRITORIES: Record<FactionId, string> = {
  agency: 'Kannai District',
  mafia: 'Yokohama Harbor / Motomachi Delta',
  guild: 'Waterfront / Minato Mirai',
  hunting_dogs: 'Military Administration Sector',
  special_div: 'Classified / Observer Perimeter',
  rats: 'Honmoku Industrial Annex',
  decay: 'Tsurumi / Abandoned Transit',
  clock_tower: 'Foreign Settlement Exclusion Zone'
}

function displayName(member: {
  character_name?: string | null
  character_match_id: string | null
  username: string
}) {
  return (
    member.character_name ??
    (member.character_match_id ? getCharacterReveal(member.character_match_id)?.name : null) ??
    '???'
  )
}

function displaySlug(characterMatchId: string | null) {
  return characterMatchId ?? 'unassigned'
}

export default async function FactionDossierPage({
  params,
}: {
  params: { id: string }
}) {
  const factionId = params.id as FactionId
  const faction = await FactionModel.getById(factionId)

  if (!faction) {
    notFound()
  }

  const [leader, roster, events, viewer] = await Promise.all([
    FactionModel.getLeader(factionId),
    FactionModel.getPublicRoster(factionId),
    FactionModel.getRecentEvents(factionId),
    getViewerProfile(),
  ])

  const canEnterHub =
    viewer &&
    (viewer.role === 'owner' ||
      ((viewer.role === 'member' || viewer.role === 'mod') && viewer.faction === factionId))
  const canInspectSpecialDivision =
    factionId !== 'special_div' ||
    viewer?.role === 'owner' ||
    ((viewer?.role === 'member' || viewer?.role === 'mod') && viewer.faction === 'special_div')
  const isQueuedHere =
    viewer?.role === 'waitlist' && viewer.quiz_locked && viewer.faction === factionId
  const isObserved = viewer?.role === 'observer'
  const heroClass = HERO_CLASSES[factionId]
  const dossierLabel = DOSSIER_LABELS[factionId]
  const bannerMeta = FACTION_META[factionId]

  return (
    <div className={styles.main}>
      <section className={styles.section}>
        <section className={`${styles.hero} ${heroClass} paper-surface diagonal-card`}>
          <div className={styles.watermark}>{faction.kanji}</div>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroTag}>{dossierLabel}</p>
              <p className={styles.heroJp}>{faction.name_jp}</p>
              <h1 className={styles.heroTitle}>{faction.name}</h1>
              <div className={styles.territoryLine}>
                TERRITORY: {TERRITORIES[factionId]}
              </div>
              <p className={styles.heroPhilosophy}>{bannerMeta.philosophy}</p>
              <p className={styles.heroDescription}>{faction.description}</p>

              <div className={styles.heroActions}>
                {canEnterHub ? (
                  <Link href={privateFactionPath(factionId)} className="btn-primary">
                    Enter Private Hub
                  </Link>
                ) : isQueuedHere ? (
                  <Link href="/waitlist" className="btn-primary">
                    View Queue Status
                  </Link>
                ) : isObserved ? (
                  <Link href="/observer" className="btn-primary">
                    View Observation File
                  </Link>
                ) : (
                  <Link href="/login" className="btn-primary">
                    Begin Assignment
                  </Link>
                )}
                <Link href="/archive" className="btn-secondary">
                  Browse Character Files
                </Link>
                {viewer &&
                  (viewer.role === 'owner' ||
                    (viewer.role === 'mod' && viewer.faction === 'special_div')) &&
                  factionId === 'special_div' && (
                    <Link href="/admin/special-division" className="btn-secondary">
                      Open Review Desk
                    </Link>
                  )}
              </div>
            </div>

            <aside className={styles.heroAside}>
              <div className={styles.classification}>
                {['rats', 'decay', 'clock_tower'].includes(factionId)
                  ? 'existence unconfirmed'
                  : factionId === 'special_div' && !canInspectSpecialDivision
                    ? 'sealed circulation'
                    : faction.is_joinable
                      ? 'joinable public file'
                      : 'restricted annex'}
              </div>

              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Active Members</div>
                  <div className={styles.metricValue}>
                    {canInspectSpecialDivision ? faction.member_count : '—'}
                  </div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Waitlist</div>
                  <div className={styles.metricValue}>
                    {canInspectSpecialDivision ? faction.waitlist_count : '—'}
                  </div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Faction AP</div>
                  <div className={styles.metricValue}>
                    {canInspectSpecialDivision && !['rats', 'decay', 'clock_tower'].includes(factionId) 
                      ? faction.ap.toLocaleString() 
                      : 'Classified'}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className={styles.content}>
          <section className={`${styles.panel} paper-surface diagonal-card`}>
            <p className={styles.panelEyebrow}>
              {factionId === 'special_div' && !canInspectSpecialDivision
                ? 'Public Record'
                : 'Public Roster'}
            </p>
            {factionId === 'special_div' && !canInspectSpecialDivision ? (
              <div className={styles.sealed}>
                <div className={styles.sealedBar} />
                <p className={styles.panelLead}>
                  No public roster is filed for this division. Observation records remain
                  sealed behind internal circulation.
                </p>
                <div className={styles.sealedBar} />
              </div>
            ) : (
              <div className={styles.roster}>
                {roster.map((member) => (
                  <div key={member.id} className={styles.rosterItem}>
                    <div>
                      <p className={styles.rosterName}>{displayName(member)}</p>
                      <p className={styles.rosterMeta}>
                        {getRankTitle(member.rank, member.faction)} · {member.ap_total} AP
                      </p>
                      <p className={styles.rosterMeta}>
                        <AngoUsername userId={member.id} username={member.username} />
                      </p>
                    </div>
                    <p className={styles.apValue}>{displaySlug(member.character_match_id)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className={styles.stack}>
            <section className={`${styles.panel} paper-surface diagonal-card`}>
              <p className={styles.panelEyebrow}>
                {factionId === 'special_div' && !canInspectSpecialDivision
                  ? 'Visibility'
                  : 'Current Leader'}
              </p>
              {factionId === 'special_div' && !canInspectSpecialDivision ? (
                <p className={styles.panelLead}>
                  The Special Division does not publish its internal chain of command.
                </p>
              ) : leader ? (
                <div className={styles.leaderBlock}>
                  <div>
                    <p className={styles.leaderName}>{displayName(leader)}</p>
                    <p className={styles.leaderMeta}>
                      {getRankTitle(leader.rank, leader.faction)} · {leader.ap_total} AP
                    </p>
                    <p className={styles.leaderMeta}>
                      <AngoUsername userId={leader.id} username={leader.username} />
                    </p>
                  </div>
                  <p className={styles.apValue}>{displaySlug(leader.character_match_id)}</p>
                  <p className={styles.leaderQuote}>{LEADER_NOTES[factionId]}</p>
                </div>
              ) : (
                <p className={styles.panelLead}>No active leader file is visible yet.</p>
              )}
            </section>

            <section className={`${styles.panel} paper-surface diagonal-card`}>
              <p className={styles.panelEyebrow}>
                {factionId === 'special_div' && !canInspectSpecialDivision
                  ? 'Activity Feed'
                  : 'Recent Contributions'}
              </p>
              {factionId === 'special_div' && !canInspectSpecialDivision ? (
                <p className={styles.panelLead}>
                  No public activity feed is maintained for this division.
                </p>
              ) : events.length === 0 ? (
                <p className={styles.panelLead}>Public faction activity has not been filed yet.</p>
              ) : (
                <div className={styles.roster}>
                  {events.map((event, index) => (
                    <div key={`${event.event_type}-${index}`} className={styles.eventItem}>
                      <div>
                        <p className={styles.eventTitle}>
                          {String(event.event_type).replace(/_/g, ' ')}
                        </p>
                        <p className={styles.eventMeta}>
                          {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={styles.apValue}>+{event.ap_awarded ?? 0} AP</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
