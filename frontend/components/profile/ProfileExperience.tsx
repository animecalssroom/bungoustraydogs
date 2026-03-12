'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { EXAM_RETAKE_COST, getExamRetakeStatus } from '@/backend/lib/exam-retake'
import { getRankTitle, type Profile, type UserEvent } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { generateAbilitySignature } from '@/frontend/lib/ability-signature'
import {
  ABILITY_TYPE_COLORS,
  ABILITY_TYPE_DESC,
  ABILITY_TYPE_LABELS,
  getAbilityTypeForCharacter,
} from '@/frontend/lib/ability-types'
import { useRealtimeProfile } from '@/frontend/lib/hooks/useRealtimeProfile'
import { FACTION_META, getCharacterReveal } from '@/frontend/lib/launch'
import { getRankInfo } from '@/frontend/lib/rank'
import dynamic from 'next/dynamic'
import ObservationMeter from '@/frontend/components/ui/ObservationMeter'

const CharacterReveal = dynamic(() => import('@/frontend/components/ui/CharacterReveal'), { ssr: false })
const RankUpFlash = dynamic(() => import('@/frontend/components/ui/RankUpFlash'), { ssr: false })
const KanjiReveal = dynamic(() => import('@/frontend/components/ui/KanjiReveal'), { ssr: false })

const REVEAL_KEY = 'bsd_char_reveal_shown'

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
    : 'No record on file'

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'No timestamp on file'

const roleLabel = (role: Profile['role']) =>
  ({
    owner: 'Owner',
    mod: 'Moderator',
    member: 'Member',
    observer: 'Observer',
    waitlist: 'Waitlist',
  })[role] ?? role

const themeLabel = (theme: Profile['theme']) =>
  theme === 'dark' ? 'Midnight' : theme === 'neutral' ? 'Twilight' : 'Dawn'

const pendingDesignationCopy = (profile: Profile) => {
  if (profile.faction === 'special_div' && profile.role === 'member') {
    return 'Assignment pending. Ango-san will determine your designation.'
  }

  if (profile.role === 'waitlist') {
    return 'This file has not entered active faction service yet. Character assignment begins only after activation.'
  }

  if (profile.role === 'observer') {
    return 'This file remains outside the public factions. The city is still deciding whether it belongs in ordinary circulation at all.'
  }

  return 'The city has not finalized a character file for this user yet. The record remains open while new behavioral evidence is filed.'
}

const eventLabel = (type: UserEvent['event_type']) =>
  ({
    quiz_complete: 'Exam Cleared',
    faction_assignment: 'Faction Assigned',
    character_assigned: 'Character File Sealed',
    exam_retake: 'Exam Retake Opened',
    arena_vote: 'Arena Vote Logged',
    lore_post: 'Lore Record Filed',
    registry_post: 'Registry Report Approved',
    write_lore: 'Lore Record Filed',
    save_lore: 'Archive Entry Saved',
    registry_save: 'Registry File Saved',
    registry_featured: 'Registry Feature Filed',
    daily_login: 'Daily Return Logged',
    login_streak: 'Streak Milestone',
    debate_upvote: 'Debate Support Logged',
    faction_event: 'Faction Event',
    easter_egg: 'Hidden Record Triggered',
    join_faction: 'Faction Entry',
  })[type] ?? type.replace(/_/g, ' ')

const COUNTS_TOWARD_OBSERVATION = new Set([
  'quiz_complete',
  'faction_assignment',
  'arena_vote',
  'lore_post',
  'registry_post',
  'write_lore',
  'save_lore',
  'registry_save',
  'debate_upvote',
  'faction_event',
  'easter_egg',
  'join_faction',
])

const pane = {
  padding: '1.25rem',
  border: '1px solid var(--border2)',
  background: 'var(--surface2)',
}

export function ProfileExperience({
  initialProfile,
  initialEvents,
  viewerUserId,
}: {
  initialProfile: Profile
  initialEvents: UserEvent[]
  viewerUserId: string | null
}) {
  const isOwnProfile = viewerUserId === initialProfile.id
  const liveProfile = useRealtimeProfile(
    isOwnProfile ? initialProfile.id : undefined,
    isOwnProfile ? initialProfile : null,
  )
  const activeProfile = liveProfile ?? initialProfile
  const [supabase] = useState(createClient)
  const [events, setEvents] = useState(initialEvents)
  const [eventCount, setEventCount] = useState<number | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [showRankFlash, setShowRankFlash] = useState(false)
  const [rankFlashTitle, setRankFlashTitle] = useState(getRankTitle(initialProfile.rank))
  const previousRankRef = useRef(initialProfile.rank)

  const factionMeta = activeProfile.faction ? FACTION_META[activeProfile.faction] : null
  const character = getCharacterReveal(activeProfile.character_match_id)
  const abilityType =
    activeProfile.character_type ??
    getAbilityTypeForCharacter(activeProfile.character_match_id)
  const rankInfo = getRankInfo(activeProfile.ap_total, activeProfile.rank)
  const retake = getExamRetakeStatus(activeProfile)
  const showObservation =
    isOwnProfile &&
    activeProfile.role === 'member' &&
    activeProfile.faction !== 'special_div' &&
    !activeProfile.character_match_id

  useEffect(() => {
    if (!showObservation) {
      setEventCount(null)
      return
    }

    let active = true
    void supabase
      .from('user_events')
      .select('event_type')
      .eq('user_id', activeProfile.id)
      .limit(50)
      .then(({ data }) => {
        if (!active) return
        const count =
          (data ?? []).filter((event) =>
            COUNTS_TOWARD_OBSERVATION.has(event.event_type),
          ).length ?? 0
        setEventCount(count)
      })

    return () => {
      active = false
    }
  }, [activeProfile.id, activeProfile.updated_at, showObservation, supabase])

  useEffect(() => {
    if (!isOwnProfile) {
      setEvents(initialEvents)
      return
    }

    let active = true
    void supabase
      .from('user_events')
      .select('id, event_type, faction, ap_awarded, created_at')
      .eq('user_id', activeProfile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (active) setEvents((data as UserEvent[] | null) ?? [])
      })

    return () => {
      active = false
    }
  }, [activeProfile.id, activeProfile.updated_at, initialEvents, isOwnProfile, supabase])

  useEffect(() => {
    if (isOwnProfile && activeProfile.rank > previousRankRef.current) {
      setRankFlashTitle(getRankTitle(activeProfile.rank))
      setShowRankFlash(true)
    }
    previousRankRef.current = activeProfile.rank
  }, [activeProfile.rank, isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile || !activeProfile.character_match_id) return
    if (window.localStorage.getItem(REVEAL_KEY) !== activeProfile.character_match_id) {
      setShowReveal(true)
    }
  }, [activeProfile.character_match_id, isOwnProfile])

  const abilitySignature =
    factionMeta && character
      ? generateAbilitySignature(activeProfile.username, character.slug, factionMeta.color)
      : null

  return (
    <>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <section className="paper-surface" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="font-space-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: factionMeta?.color ?? 'var(--accent)' }}>
              Yokohama Registry File
            </div>
            <h1 className="font-cinzel" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.7rem)', lineHeight: 1.05 }}>
              {activeProfile.username}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <span className="ink-stamp">{roleLabel(activeProfile.role)}</span>
              {factionMeta ? <span className="ink-stamp">{factionMeta.name}</span> : null}
              <span className="ink-stamp">{themeLabel(activeProfile.theme)}</span>
            </div>
            <p className="font-cormorant" style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--text2)', fontStyle: 'italic' }}>
              {activeProfile.bio?.trim() || 'No statement has been filed by this user. The city records actions before it records explanations.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Rank</div><div className="font-cinzel" style={{ marginTop: '0.35rem', fontSize: '1.5rem' }}>{activeProfile.rank}</div><div className="font-cormorant" style={{ marginTop: '0.35rem', color: 'var(--text3)' }}>{rankInfo.title}</div></div>
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Status</div><div className="font-cinzel" style={{ marginTop: '0.35rem', fontSize: '1.2rem' }}>{roleLabel(activeProfile.role)}</div><div className="font-cormorant" style={{ marginTop: '0.35rem', color: 'var(--text3)' }}>{factionMeta?.name ?? 'Unassigned'}</div></div>
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>File Opened</div><div className="font-cormorant" style={{ marginTop: '0.35rem', color: 'var(--text2)' }}>{formatDate(activeProfile.created_at)}</div></div>
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Last Seen</div><div className="font-cormorant" style={{ marginTop: '0.35rem', color: 'var(--text2)' }}>{formatDateTime(activeProfile.last_seen)}</div></div>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <section className="paper-surface" style={{ padding: '1.5rem' }}>
            <div className="font-space-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: factionMeta?.color ?? 'var(--accent)' }}>Ability Registry</div>
            {character ? (
              <>
                <h2 className="font-cinzel" style={{ marginTop: '0.85rem', fontSize: 'clamp(1.7rem, 4vw, 2.3rem)' }}>{activeProfile.character_name ?? character.name}</h2>
                <p className="font-cormorant" style={{ marginTop: '0.4rem', fontSize: '1.05rem', color: factionMeta?.color ?? 'var(--accent)', fontStyle: 'italic' }}>{activeProfile.character_ability ?? character.ability}</p>
                {abilityType ? <div style={{ marginTop: '0.9rem', display: 'inline-flex', padding: '0.45rem 0.75rem', border: `1px solid ${ABILITY_TYPE_COLORS[abilityType]}`, color: ABILITY_TYPE_COLORS[abilityType] }}><span className="font-space-mono" style={{ fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{ABILITY_TYPE_LABELS[abilityType]}</span></div> : null}
                <p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1rem', lineHeight: 1.7, color: 'var(--text2)', fontStyle: 'italic' }}>{activeProfile.character_description || (abilityType ? ABILITY_TYPE_DESC[abilityType] : 'The registry has not filed a formal ability classification for this signature yet.')}</p>
                {abilitySignature ? <div style={{ ...pane, marginTop: '1rem' }}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: '0.6rem' }}>Deterministic Signature</div><div dangerouslySetInnerHTML={{ __html: abilitySignature }} /></div> : null}
              </>
            ) : (
              <>
                <h2 className="font-cinzel" style={{ marginTop: '0.85rem', fontSize: 'clamp(1.7rem, 4vw, 2.3rem)' }}>Designation Pending</h2>
                <p className="font-cormorant" style={{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.75, color: 'var(--text2)', fontStyle: 'italic' }}>{pendingDesignationCopy(activeProfile)}</p>
                {showObservation ? <ObservationMeter eventCount={eventCount ?? 0} factionColor={factionMeta?.color ?? 'var(--accent)'} /> : null}
              </>
            )}
          </section>

          <section className="paper-surface" style={{ padding: '1.5rem' }}>
            <div className="font-space-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: factionMeta?.color ?? 'var(--accent)' }}>Archive Progress</div>
            <h2 className="font-cinzel" style={{ marginTop: '0.9rem', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Rank {activeProfile.rank}</h2>
            <p className="font-cormorant" style={{ marginTop: '0.5rem', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text2)', fontStyle: 'italic' }}>{isOwnProfile ? (rankInfo.isMaxRank ? 'Maximum designation reached.' : `${rankInfo.remainingAP.toLocaleString()} AP remain before the next title.`) : 'Public files expose title and rank only. AP totals remain private.'}</p>
            {isOwnProfile ? (
              <>
                <div style={{ marginTop: '1rem', height: '8px', background: 'var(--border2)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${rankInfo.percentage}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ height: '100%', background: `linear-gradient(90deg, ${factionMeta?.color ?? 'var(--accent)'}, color-mix(in srgb, ${factionMeta?.color ?? 'var(--accent)'} 55%, white))` }} />
                </div>
                <div className="font-space-mono" style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.52rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text4)', flexWrap: 'wrap' }}>
                  <span>{rankInfo.previousThreshold.toLocaleString()} AP</span>
                  <span>{rankInfo.isMaxRank ? 'Final threshold reached' : `${rankInfo.nextThreshold.toLocaleString()} AP`}</span>
                </div>
                <div className="case-divider" style={{ marginTop: '1rem' }} />
              </>
            ) : null}
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
              {isOwnProfile ? <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Total AP</div><div className="font-cinzel" style={{ marginTop: '0.35rem', fontSize: '1.4rem' }}>{activeProfile.ap_total.toLocaleString()}</div></div> : null}
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Theme</div><div className="font-cinzel" style={{ marginTop: '0.35rem', fontSize: '1.2rem' }}>{themeLabel(activeProfile.theme)}</div></div>
              <div style={pane}><div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}>Observation</div><div className="font-cinzel" style={{ marginTop: '0.35rem', fontSize: '1.2rem' }}>{showObservation ? 'In progress' : activeProfile.character_match_id ? 'Complete' : 'Pending'}</div></div>
            </div>
          </section>
        </div>

        <section className="paper-surface" style={{ padding: '1.5rem' }}>
          <div className="font-space-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: factionMeta?.color ?? 'var(--accent)' }}>Field Record Log</div>
          {!isOwnProfile ? (
            <p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--text2)' }}>This log is only visible to the owner of the file.</p>
          ) : events.length === 0 ? (
            <p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--text2)' }}>The city has not recorded any qualifying actions yet.</p>
          ) : (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              {events.map((event) => (
                <article key={event.id} style={pane}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div className="font-cinzel" style={{ fontSize: '1.05rem' }}>{eventLabel(event.event_type)}</div>
                      <div className="font-space-mono" style={{ marginTop: '0.35rem', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text4)' }}>{event.faction ? `${event.faction.replace(/_/g, ' ')} file` : 'City-wide record'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-space-mono" style={{ fontSize: '0.55rem', color: event.ap_awarded >= 0 ? 'var(--accent)' : 'var(--text2)' }}>{event.ap_awarded >= 0 ? '+' : ''}{event.ap_awarded} AP</div>
                      <div className="font-space-mono" style={{ marginTop: '0.3rem', fontSize: '0.5rem', color: 'var(--text4)' }}>{formatDateTime(event.created_at)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {activeProfile.role === 'waitlist' ? <section className="paper-surface" style={{ padding: '1.5rem' }}><div className="ink-stamp">Waitlist Notice</div><p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text2)', fontStyle: 'italic' }}>Your faction file is queued. Character assignment remains locked until a vacancy opens and the city activates your placement.</p></section> : null}
        {activeProfile.role === 'observer' ? <section className="paper-surface" style={{ padding: '1.5rem' }}><div className="ink-stamp">Observer Notice</div><p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text2)', fontStyle: 'italic' }}>This file remains outside the public factions. The city is still deciding whether it belongs in ordinary circulation at all.</p></section> : null}

        {isOwnProfile && activeProfile.exam_completed ? (
          <section className="paper-surface" style={{ padding: '1.5rem' }}>
            <div className="ink-stamp">Exam Retake</div>
            <p className="font-cormorant" style={{ marginTop: '0.9rem', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text2)', fontStyle: 'italic' }}>
              {retake.retakeInProgress
                ? 'A retake is already open. Complete the exam so the city can average the new result against your original file.'
                : retake.canRetake
                  ? `This file qualifies for one retake. Cost: ${EXAM_RETAKE_COST} AP.`
                  : retake.alreadyUsed
                    ? 'This file has already used its one retake.'
                    : retake.eligibleAt
                      ? `Retake access opens ${formatDateTime(retake.eligibleAt.toISOString())}.`
                      : 'This file does not have a retake window on record yet.'}
            </p>
            {!retake.canRetake && !retake.retakeInProgress && !retake.alreadyUsed ? <div className="font-space-mono" style={{ marginTop: '0.9rem', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text4)' }}>{retake.apShortfall > 0 ? `${retake.apShortfall} AP still required.` : 'Thirty-day wait requirement still active.'}</div> : null}
            {retake.canRetake ? <Link href="/exam" className="btn-primary" style={{ marginTop: '1.1rem' }}>Open Retake Desk</Link> : null}
          </section>
        ) : null}
      </div>

      {character && factionMeta ? (
        <CharacterReveal
          show={showReveal}
          characterName={activeProfile.character_name ?? character.name}
          abilityName={activeProfile.character_ability ?? character.ability}
          abilityType={abilityType}
          registryNote={activeProfile.character_description ?? `Ability signature confirms designation as ${character.name}. The city has completed a lasting record for this file.`}
          factionColor={factionMeta.color}
          onComplete={() => {
            window.localStorage.setItem(REVEAL_KEY, activeProfile.character_match_id ?? '')
            setShowReveal(false)
          }}
        />
      ) : null}

      {factionMeta ? (
        <RankUpFlash
          show={showRankFlash}
          faction={activeProfile.faction ?? 'agency'}
          newRankTitle={rankFlashTitle}
          onComplete={() => setShowRankFlash(false)}
        />
      ) : null}
    </>
  )
}
