'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/frontend/lib/supabase/client'
import { FACTION_META, getCharacterReveal } from '@/frontend/lib/launch'
import { playSound } from '@/frontend/lib/sounds'
import { getSpecialDivisionProvisionalDesignation } from '@/frontend/lib/special-division'
import type {
  FactionActivity,
  FactionBulletin,
  Faction,
  FactionId,
  FactionMessage,
  Profile,
  RegistryPost,
  VisibleFactionId,
} from '@/backend/types'
import { getRankTitle } from '@/backend/types'
import styles from './FactionPrivateSpace.module.css'
import registryStyles from '@/frontend/components/registry/Registry.module.css'
import { RegistryModQueue } from '@/frontend/components/registry/RegistryModQueue'
import { FactionFeedPing } from '@/frontend/components/ui/FactionFeedPing'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'

type PrivateTab = 'bulletin' | 'feed' | 'roster' | 'chat'

type RosterEntry = Pick<
  Profile,
  'id' | 'username' | 'role' | 'rank' | 'ap_total' | 'character_match_id' | 'faction'
> & {
  behavior_scores?: Profile['behavior_scores']
  last_seen?: string | null
}

type JoinableFactionSummary = {
  id: InfluenceFactionId
  name: string
  kanji: string
  ap: number
  member_count: number
}

type InfluenceFactionId = VisibleFactionId | 'special_div'

type WarSegment = JoinableFactionSummary & {
  percent: number
  colorVar: string
}

const MOBILE_TABS: { id: PrivateTab; label: string }[] = [
  { id: 'bulletin', label: 'Bulletin' },
  { id: 'feed', label: 'Feed' },
  { id: 'roster', label: 'Roster' },
  { id: 'chat', label: 'Chat' },
]

const FACTION_COLOR_VARS: Record<FactionId, string> = {
  agency: 'var(--color-agency)',
  mafia: 'var(--color-mafia)',
  guild: 'var(--color-guild)',
  hunting_dogs: 'var(--color-dogs)',
  special_div: 'var(--color-special)',
  rats: 'var(--color-mafia)',
  decay: 'var(--color-dogs)',
  clock_tower: 'var(--color-guild)',
}

const BANNER_BASE_VARS: Record<FactionId, string> = {
  agency: 'var(--color-bg-dark)',
  mafia: 'var(--color-bg-dark)',
  guild: 'var(--color-bg-neutral)',
  hunting_dogs: 'var(--color-bg-dark)',
  special_div: 'var(--color-bg-dark)',
  rats: 'var(--color-bg-dark)',
  decay: 'var(--color-bg-dark)',
  clock_tower: 'var(--color-bg-dark)',
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isRecentlySeen(value: string | null) {
  if (!value) return false
  return Date.now() - new Date(value).getTime() < 15 * 60 * 1000
}

function trimActivity(items: FactionActivity[]) {
  return items.slice(0, 50)
}

function trimMessages(items: FactionMessage[]) {
  return items.slice(-50)
}

function normalizeMessage(row: Record<string, unknown>): FactionMessage {
  return {
    id: String(row.id),
    faction_id: row.faction_id as FactionId,
    user_id: String(row.user_id),
    sender_character: (row.sender_character as string | null) ?? null,
    sender_rank: (row.sender_rank as string | null) ?? null,
    content: String(row.content ?? ''),
    created_at: String(row.created_at),
    author: null,
  }
}

function characterNameFromProfile(profile: Pick<Profile, 'character_match_id'> | RosterEntry) {
  return getCharacterReveal(profile.character_match_id)?.name ?? '???'
}

export function FactionPrivateSpace({
  factionId,
  profile,
  initialBulletins = [],
  initialActivity = [],
  initialRoster = [],
  initialMessages = [],
  initialWarFactions = [],
  initialPendingRegistryPosts = [],
}: {
  factionId: FactionId
  profile: Profile
  initialBulletins?: FactionBulletin[]
  initialActivity?: FactionActivity[]
  initialRoster?: RosterEntry[]
  initialMessages?: FactionMessage[]
  initialWarFactions?: Faction[]
  initialPendingRegistryPosts?: RegistryPost[]
}) {
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(initialRoster.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PrivateTab>('feed')
  const [bulletins, setBulletins] = useState<FactionBulletin[]>(initialBulletins)
  const [activity, setActivity] = useState<FactionActivity[]>(initialActivity)
  const [roster, setRoster] = useState<RosterEntry[]>(initialRoster)
  const [messages, setMessages] = useState<FactionMessage[]>(initialMessages)
  const [warSegments, setWarSegments] = useState<WarSegment[]>(() => {
    const joinable = initialWarFactions.filter((row) =>
      ['agency', 'mafia', 'guild', 'hunting_dogs'].includes(row.id),
    ) as JoinableFactionSummary[]

    const special = factionId === 'special_div'
      ? {
          id: 'special_div' as const,
          name: FACTION_META.special_div.name,
          kanji: FACTION_META.special_div.kanji,
          ap: profile.faction === 'special_div' ? profile.ap_total : 0,
          member_count: 0,
        }
      : null

    const visibleRows = special ? [...joinable, special] : joinable
    const totalAp = visibleRows.reduce((sum, row) => sum + (row.ap ?? 0), 0)

    return visibleRows.map((row) => ({
      ...row,
      percent:
        totalAp > 0 ? (row.ap / totalAp) * 100 : 100 / Math.max(visibleRows.length, 1),
      colorVar: FACTION_COLOR_VARS[row.id],
    }))
  })
  const [showBulletinModal, setShowBulletinModal] = useState(false)
  const [bulletinDraft, setBulletinDraft] = useState('')
  const [postingBulletin, setPostingBulletin] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const chatLogRef = useRef<HTMLDivElement | null>(null)

  const factionMeta = FACTION_META[factionId]
  const currentCharacter = getCharacterReveal(profile.character_match_id)?.name ?? '???'
  const currentRank = getRankTitle(profile.rank)
  const canPostBulletin =
    profile.role === 'owner' || (profile.role === 'mod' && profile.faction === factionId)
  const canModerateRegistry =
    profile.role === 'owner' || (profile.role === 'mod' && profile.faction === factionId)
  const leaderId = roster[0]?.id ?? null
  const pageStyle = useMemo(
    () =>
      ({
        '--faction-color': FACTION_COLOR_VARS[factionId],
        '--banner-base': BANNER_BASE_VARS[factionId],
      }) as CSSProperties,
    [factionId],
  )

  const loadBulletins = useCallback(async () => {
    const { data, error: requestError } = await supabase
      .from('faction_bulletins')
      .select('*')
      .eq('faction_id', factionId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)

    if (requestError) {
      throw requestError
    }

    setBulletins((data as FactionBulletin[] | null) ?? [])
  }, [factionId, supabase])

  const loadActivity = useCallback(async () => {
    const { data, error: requestError } = await supabase
      .from('faction_activity')
      .select('*')
      .eq('faction_id', factionId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (requestError) {
      throw requestError
    }

    setActivity((data as FactionActivity[] | null) ?? [])
  }, [factionId, supabase])

  const loadRoster = useCallback(async () => {
    const { data, error: requestError } = await supabase
      .from('profiles')
      .select('id, username, role, rank, ap_total, character_match_id, faction, behavior_scores, last_seen')
      .eq('faction', factionId)
      .in('role', ['member', 'mod'])
      .order('ap_total', { ascending: false })
      .order('updated_at', { ascending: true })

    if (requestError) {
      throw requestError
    }

    setRoster((data as RosterEntry[] | null) ?? [])
  }, [factionId, supabase])

  const loadMessages = useCallback(async () => {
    const { data, error: requestError } = await supabase
      .from('faction_messages')
      .select('id, faction_id, user_id, sender_character, sender_rank, content, created_at')
      .eq('faction_id', factionId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (requestError) {
      throw requestError
    }

    setMessages(((data as Record<string, unknown>[] | null) ?? []).map(normalizeMessage))
  }, [factionId, supabase])

  const loadWarStrip = useCallback(async () => {
    const response = await fetch('/api/faction', { cache: 'no-store' })
    const json = await response.json().catch(() => ({}))
    const rows = Array.isArray(json.data) ? (json.data as JoinableFactionSummary[]) : []
    const joinable = rows.filter((row) =>
      ['agency', 'mafia', 'guild', 'hunting_dogs'].includes(row.id),
    ) as JoinableFactionSummary[]
    const special = factionId === 'special_div'
      ? {
          id: 'special_div' as const,
          name: FACTION_META.special_div.name,
          kanji: FACTION_META.special_div.kanji,
          ap: profile.faction === 'special_div' ? profile.ap_total : 0,
          member_count: 0,
        }
      : null

    const visibleRows = special ? [...joinable, special] : joinable
    const totalAp = visibleRows.reduce((sum, row) => sum + (row.ap ?? 0), 0)

    setWarSegments(
      visibleRows.map((row) => ({
        ...row,
        percent:
          totalAp > 0 ? (row.ap / totalAp) * 100 : 100 / Math.max(visibleRows.length, 1),
        colorVar: FACTION_COLOR_VARS[row.id],
      })),
    )
  }, [factionId, profile.ap_total, profile.faction])

  const loadSpace = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadBulletins(),
        loadActivity(),
        loadRoster(),
        loadMessages(),
        loadWarStrip(),
      ])
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to open faction space.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [loadActivity, loadBulletins, loadMessages, loadRoster, loadWarStrip])

  useEffect(() => {
    if (
      initialRoster.length === 0 &&
      initialMessages.length === 0 &&
      initialBulletins.length === 0 &&
      initialActivity.length === 0
    ) {
      void loadSpace()
    }
  }, [loadSpace])

  useEffect(() => {
    if (!chatLogRef.current) {
      return
    }

    chatLogRef.current.scrollTo({
      top: chatLogRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Ensure scroll also triggers when mobile FEED tab becomes active
  useEffect(() => {
    if (activeTab === 'feed' && chatLogRef.current) {
      chatLogRef.current.scrollTo({ top: chatLogRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [activeTab, messages])

  useEffect(() => {
    // Single multiplexed channel for all faction-space realtime events to reduce
    // concurrent connection counts per client session.
    const factionChannel = supabase
      .channel(`faction-space-${factionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'faction_activity',
          filter: `faction_id=eq.${factionId}`,
        },
        (payload) => {
          setActivity((current) => trimActivity([payload.new as FactionActivity, ...current]))
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'faction_messages',
          filter: `faction_id=eq.${factionId}`,
        },
        (payload) => {
          const next = normalizeMessage(payload.new as Record<string, unknown>)
          setMessages((current) => {
            if (current.some((message) => message.id === next.id)) {
              return current
            }

            return trimMessages([...current, next])
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const previousFaction = (payload.old as Partial<Profile> | null)?.faction ?? null
          const nextFaction = (payload.new as Partial<Profile> | null)?.faction ?? null

          if (previousFaction === factionId || nextFaction === factionId) {
            void loadRoster()
          }

          if (
            ['agency', 'mafia', 'guild', 'hunting_dogs', 'special_div'].includes(
              previousFaction ?? '',
            ) ||
            ['agency', 'mafia', 'guild', 'hunting_dogs', 'special_div'].includes(
              nextFaction ?? '',
            )
          ) {
            void loadWarStrip()
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'faction_slots',
        },
        () => {
          void loadWarStrip()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(factionChannel)
    }
  }, [factionId, loadRoster, loadWarStrip, supabase])

  const postBulletin = useCallback(
    async (content: string, options?: { pinned?: boolean }) => {
      const response = await fetch(`/api/faction/${factionId}/bulletins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          pinned: options?.pinned ?? false,
        }),
      })
      const json = (await response.json().catch(() => ({}))) as {
        error?: string
        data?: FactionBulletin
      }

      if (!response.ok || !json.data) {
        throw new Error(json.error ?? 'Unable to post bulletin.')
      }

      const bulletin = json.data
      setBulletins((current) => [bulletin, ...current].slice(0, 10))

      await playSound('stamp')
    },
    [factionId],
  )

  const handleBulletinSubmit = async () => {
    const content = bulletinDraft.trim()

    if (!content || postingBulletin) {
      return
    }

    setPostingBulletin(true)
    setError(null)

    try {
      await postBulletin(content)
      setBulletinDraft('')
      setShowBulletinModal(false)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to post bulletin.'
      setError(message)
    } finally {
      setPostingBulletin(false)
    }
  }

  const handleMessageSubmit = async () => {
    const content = messageDraft.trim()

    if (!content || sendingMessage) {
      return
    }

    setSendingMessage(true)
    setError(null)

    const response = await fetch(`/api/faction/${factionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const json = (await response.json().catch(() => ({}))) as {
      error?: string
      data?: FactionMessage
    }

    if (!response.ok || !json.data) {
      setError(json.error ?? 'Unable to send transmission.')
      setSendingMessage(false)
      return
    }

    const nextMessage = json.data

    setMessages((current) => {
      if (current.some((message) => message.id === nextMessage.id)) {
        return current
      }

      return trimMessages([...current, nextMessage])
    })
    setMessageDraft('')
    setSendingMessage(false)
    await playSound('stamp')
  }

  const handlePinMessage = async (message: FactionMessage) => {
    if (!canPostBulletin) {
      return
    }

    setError(null)

    try {
      await postBulletin(message.content, { pinned: true })
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : 'Unable to pin message.'
      setError(messageText)
    }
  }

  if (loading) {
    return (
      <section className={styles.shell} style={pageStyle}>
        <div className={styles.wrap}>
          <section className={styles.banner}>
            <div className={styles.bannerInner}>
              <div className={styles.bannerKanji}>{factionMeta.kanji}</div>
              <div className={styles.bannerName}>Opening sealed room.</div>
              <div className={styles.bannerJp}>{factionMeta.nameJp}</div>
            </div>
          </section>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.shell} style={pageStyle}>
      <FactionFeedPing factionId={factionId} />
      <div className={styles.wrap}>
        <section className={styles.banner}>
          <div className={styles.bannerInner}>
            <div className={styles.bannerKanji}>{factionMeta.kanji}</div>
            <div className={styles.bannerName}>{factionMeta.name}</div>
            <div className={styles.bannerJp}>{factionMeta.nameJp}</div>
          </div>
        </section>

        <div className={styles.mobileTabs}>
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.tabButtonActive : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.columns}>
          <section
            className={`${styles.column} ${
              activeTab === 'bulletin' ? styles.mobilePanelVisible : styles.mobilePanelHidden
            }`}
          >
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Bulletin</span>
              <div className={styles.sectionActions}>
                <span className={styles.sectionMeta}>{bulletins.length} files</span>
                {canPostBulletin && (
                  <button
                    type="button"
                    className={styles.pinButton}
                    onClick={() => setShowBulletinModal(true)}
                  >
                    Post Bulletin
                  </button>
                )}
              </div>
            </div>
            <div className={styles.bulletinList}>
              {bulletins.length === 0 ? (
                <p className={styles.empty}>No bulletins filed yet.</p>
              ) : (
                bulletins.map((bulletin) => (
                  <article key={bulletin.id} className={styles.bulletinCard}>
                    <div className={styles.bulletinHead}>
                      <span className={styles.caseLine}>
                        <span>{bulletin.case_number}</span>
                        {bulletin.pinned ? <span className={styles.pinStamp}>ðŸ“Œ</span> : null}
                      </span>
                      <span className={styles.sectionMeta}>{formatStamp(bulletin.created_at)}</span>
                    </div>
                    <div className={styles.authorCharacter}>
                      {bulletin.author_character ?? 'Unknown File'}
                    </div>
                    <div className={styles.bulletinRule} />
                    <div className={styles.bulletinContent}>{bulletin.content}</div>
                  </article>
                ))
              )}
            </div>
            {canModerateRegistry ? (
              <div style={{ marginTop: '1rem' }}>
                <div className={styles.sectionHead}>
                  <span className={styles.sectionTitle}>Pending Reports</span>
                  <span className={styles.sectionMeta}>{initialPendingRegistryPosts.length} waiting</span>
                </div>
                {initialPendingRegistryPosts.length === 0 ? (
                  <p className={`${styles.empty} ${registryStyles.helper}`}>
                    No registry reports are waiting for review.
                  </p>
                ) : (
                  <RegistryModQueue initialPosts={initialPendingRegistryPosts} />
                )}
              </div>
            ) : null}
          </section>

          <section
            className={`${styles.column} ${
              activeTab === 'feed' ? styles.mobilePanelVisible : styles.mobilePanelHidden
            }`}
          >
            <div className={styles.sectionHead}>
              <span className={styles.liveHead}>
                <span className={styles.liveDot} />
                <span className={styles.sectionTitle}>Live Feed</span>
              </span>
              <span className={styles.sectionMeta}>Latest 50</span>
            </div>
            <div className={styles.feedList}>
              <AnimatePresence initial={false}>
                {activity.length === 0 ? (
                  <motion.p
                    key="activity-empty"
                    className={styles.empty}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    No transmissions in the live feed yet.
                  </motion.p>
                ) : (
                  activity.map((item) => (
                    <motion.article
                      key={item.id}
                      className={styles.feedItem}
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                    >
                      <span className={styles.feedTime}>{formatStamp(item.created_at)}</span>
                      <span className={styles.feedText}>{item.description}</span>
                    </motion.article>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          <section
            className={`${styles.column} ${
              activeTab === 'roster' ? styles.mobilePanelVisible : styles.mobilePanelHidden
            }`}
          >
            <div className={`${styles.sectionHead} ${styles.rosterHead}`}>
              <span className={styles.sectionTitle}>Roster</span>
              <span className={styles.operatives}>{roster.length} operatives</span>
            </div>
            <div className={styles.rosterList}>
              {roster.length === 0 ? (
                <p className={styles.empty}>No operatives are registered here yet.</p>
              ) : (
                roster.map((member) => (
                  <Link
                    key={member.id}
                    href={`/profile/${member.username}`}
                    className={styles.rosterLink}
                  >
                    <article className={styles.rosterRow}>
                      <div className={styles.rosterLeft}>
                        {isRecentlySeen(member.last_seen ?? null) ? (
                          <span className={styles.onlineDot} />
                        ) : (
                          <span className={styles.onlineDot} style={{ opacity: 0.2 }} />
                        )}
                        <div className={styles.nameStack}>
                          <div className={styles.rosterNameLine}>
                            {leaderId === member.id ? (
                              <span className={styles.leaderSeal}>é‡‘</span>
                            ) : null}
                            <span className={styles.rosterName}>
                              {factionId === 'special_div' &&
                              characterNameFromProfile(member) === '???' ? (
                                <AngoUsername userId={member.id} username={member.username} />
                              ) : (
                                characterNameFromProfile(member)
                              )}
                            </span>
                            {member.role === 'mod' ? (
                              <span className={styles.modBadge}>MOD</span>
                            ) : null}
                          </div>
                          <div className={styles.rosterMeta}>
                            {factionId === 'special_div' && characterNameFromProfile(member) === '???'
                              ? getSpecialDivisionProvisionalDesignation(member)?.name
                                ? `special division draft · provisional reading: ${getSpecialDivisionProvisionalDesignation(member)?.name}`
: 'special division draft'
                              : `${getRankTitle(member.rank)} · `}
                            {!(factionId === 'special_div' && characterNameFromProfile(member) === '???') ? (
                              <AngoUsername userId={member.id} username={member.username} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <span className={styles.apValue}>{member.ap_total} AP</span>
                    </article>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <section
          className={`${styles.chatSection} ${
            activeTab === 'chat' ? styles.chatVisible : ''
          }`}
        >
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Transmission Log</span>
            {error ? <span className={styles.sectionMeta}>{error}</span> : null}
          </div>
          <div className={styles.chatLog} ref={chatLogRef}>
            <div className={styles.chatLogInner}>
              {messages.length === 0 ? (
                <p className={styles.empty}>The line is open. No transmissions recorded yet.</p>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className={styles.messageRow}>
                    <div className={styles.messageHead}>
                      <div>
                        <div className={styles.messageCharacter}>
                          {message.sender_character ?? '???'}
                        </div>
                        <div className={styles.messageMeta}>
                          <span className={styles.messageRank}>
                            {message.sender_rank ?? 'Unfiled'}
                          </span>
                          {message.author ? (
                            <>
                              {' · '}
                              <AngoUsername userId={message.author.id} username={message.author.username} />
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.messageActions}>
                        {canPostBulletin ? (
                          <button
                            type="button"
                            className={styles.pinButton}
                            onClick={() => void handlePinMessage(message)}
                            title="Pin to bulletin"
                          >
                            ðŸ“Œ
                          </button>
                        ) : null}
                        <span className={styles.messageTime}>{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                    <div className={styles.messageContent}>{message.content}</div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div
            className={styles.chatInputRow}
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'var(--card)',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              boxSizing: 'border-box',
            }}
          >
            <input
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleMessageSubmit()
                }
              }}
              className={styles.input}
              placeholder="Transmit..."
              maxLength={300}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={sendingMessage || messageDraft.trim().length === 0}
              onClick={() => void handleMessageSubmit()}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </section>

        <section className={styles.warStrip}>
          <div className={styles.warLabel}>Yokohama Influence</div>
          <div className={styles.warSegments}>
            {warSegments.map((segment) => (
              <div
                key={segment.id}
                className={styles.warSegment}
                style={
                  {
                    width: `${segment.percent}%`,
                    '--segment-color': segment.colorVar,
                  } as CSSProperties
                }
              >
                <div className={styles.warSegmentInner}>
                  {segment.percent >= 12 ? (
                    <span className={styles.segmentLabel}>{segment.kanji}</span>
                  ) : null}
                  <span className={styles.segmentMeta}>{segment.ap.toLocaleString()} AP</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showBulletinModal ? (
        <div className={styles.bulletinModalBackdrop}>
          <div className={styles.bulletinModal}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Post Bulletin</span>
              <button
                type="button"
                className={styles.pinButton}
                onClick={() => setShowBulletinModal(false)}
              >
                Close
              </button>
            </div>
            <textarea
              className={styles.textarea}
              value={bulletinDraft}
              onChange={(event) => setBulletinDraft(event.target.value)}
              placeholder="File a bulletin for your faction."
              maxLength={1200}
            />
            <div className={styles.modalActions}>
              <span className={styles.sectionMeta}>{bulletinDraft.trim().length}/1200</span>
              <button
                type="button"
                className="btn-primary"
                disabled={postingBulletin || bulletinDraft.trim().length === 0}
                onClick={() => void handleBulletinSubmit()}
              >
                {postingBulletin ? 'Posting...' : 'Transmit Bulletin'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}


