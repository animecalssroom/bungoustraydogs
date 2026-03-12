'use client'

import Link from 'next/link'
import { useMemo, useState, type CSSProperties } from 'react'
import { useAuth } from '@/frontend/context/AuthContext'
import { useArena, type ArenaPayload } from '@/frontend/hooks/useArena'
import { FACTION_META, getCharacterReveal } from '@/frontend/lib/launch'
import { canDo } from '@/frontend/lib/permissions'
import { getRankTitle } from '@/backend/types'
import type { ArenaArgument, ArenaDebate } from '@/backend/types'
import styles from './ArenaCard.module.css'

function argumentAuthor(argument: ArenaArgument) {
  if (argument.author?.character_match_id) {
    return getCharacterReveal(argument.author.character_match_id)?.name ?? argument.author.username
  }

  return argument.author?.username ?? 'Unknown file'
}

function fighterMeta(slug: string) {
  const character = getCharacterReveal(slug)

  if (!character) {
    return null
  }

  const factionMeta = FACTION_META[character.faction]

  return {
    ...character,
    factionMeta,
  }
}

function ArenaDebateCard({
  debate,
  votedSide,
  argumentsList,
  canParticipate,
  onVote,
  onArgument,
}: {
  debate: ArenaDebate
  votedSide: 'a' | 'b' | undefined
  argumentsList: ArenaArgument[]
  canParticipate: boolean
  onVote: (side: 'a' | 'b') => Promise<void>
  onArgument: (content: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fighterA = fighterMeta(debate.fighter_a_id)
  const fighterB = fighterMeta(debate.fighter_b_id)
  const totalVotes = Math.max(1, debate.votes_a + debate.votes_b)
  const pctA = Math.round((debate.votes_a / totalVotes) * 100)
  const pctB = 100 - pctA

  const submitArgument = async () => {
    const content = draft.trim()

    if (!content || submitting) {
      return
    }

    setSubmitting(true)
    await onArgument(content)
    setDraft('')
    setSubmitting(false)
  }

  return (
    <article className={`${styles.card} paper-surface diagonal-card`}>
      <div className={styles.meta}>
        <span className={styles.label}>Arena file · week {debate.week}</span>
        <span className={styles.status}>
          {debate.is_active ? 'active matchup' : 'archived record'}
        </span>
      </div>

      <h2 className={styles.question}>{debate.question}</h2>

      <div className={styles.fighters}>
        {[fighterA, fighterB].map((fighter, index) => {
          const isA = index === 0
          const percent = isA ? pctA : pctB
          const votes = isA ? debate.votes_a : debate.votes_b

          return (
            <div
              key={fighter?.slug ?? `${debate.id}-${index}`}
              className={styles.fighter}
              style={{ '--fighter-color': fighter?.factionMeta.color } as CSSProperties}
            >
              <span className={styles.fighterFaction}>{fighter?.factionMeta.name ?? 'Unknown file'}</span>
              <h3 className={styles.fighterName}>{fighter?.name ?? 'Unknown operative'}</h3>
              <span className={styles.fighterJp}>{fighter?.nameJp ?? 'unfiled'}</span>
              <span className={styles.fighterAbility}>
                {fighter?.ability ?? 'Classified Ability'}
                {fighter?.abilityJp ? ` · ${fighter.abilityJp}` : ''}
              </span>
              <p className={styles.fighterQuote}>
                {fighter?.factionMeta.philosophy ?? 'No quote on record.'}
              </p>
              <div className={styles.barMeta}>
                <span>{percent}%</span>
                <span>{votes.toLocaleString()} votes</span>
              </div>
              <span className={styles.fighterSymbol}>{fighter?.factionMeta.kanji ?? '文'}</span>
            </div>
          )
        })}

        <div className={styles.versus}>VS</div>
      </div>

      <div className={styles.barWrap}>
        <div className={styles.barTrack}>
          <span
            className={styles.barA}
            style={{
              width: `${pctA}%`,
              background: fighterA?.factionMeta.color ?? 'var(--color-accent)',
            }}
          />
          <span
            className={styles.barB}
            style={{
              width: `${pctB}%`,
              background: fighterB?.factionMeta.color ?? 'var(--text4)',
            }}
          />
        </div>
        <div className={styles.barMeta}>
          <span>{fighterA?.name ?? 'Unknown'} · {pctA}%</span>
          <span>{totalVotes.toLocaleString()} total votes</span>
          <span>{fighterB?.name ?? 'Unknown'} · {pctB}%</span>
        </div>
      </div>

      {canParticipate ? (
        votedSide ? (
          <div className={styles.votedState}>
            Position filed · you backed {votedSide === 'a' ? fighterA?.name : fighterB?.name}
          </div>
        ) : (
          <div className={styles.actions}>
            <button type="button" className="btn-primary" onClick={() => void onVote('a')}>
              Vote {fighterA?.name?.split(' ')[0] ?? 'A'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => void onVote('b')}>
              Vote {fighterB?.name?.split(' ')[0] ?? 'B'}
            </button>
          </div>
        )
      ) : null}

      <section className={styles.thread}>
        <div className={styles.threadHead}>
          <span className={styles.threadTitle}>Debate Thread</span>
          <span className={styles.threadNote}>Filed responses update live</span>
        </div>

        <div className={styles.argumentList}>
          {argumentsList.length === 0 ? (
            <p className={styles.empty}>No filed responses yet.</p>
          ) : (
            argumentsList.map((argument) => (
              <article
                key={argument.id}
                className={styles.argument}
                style={{
                  '--argument-color': argument.author?.faction
                    ? FACTION_META[argument.author.faction].color
                    : 'var(--accent)',
                } as CSSProperties}
              >
                <div className={styles.argumentHead}>
                  <span className={styles.argumentAuthor}>{argumentAuthor(argument)}</span>
                  <div className={styles.argumentMeta}>
                    {argument.author?.faction ? (
                      <span className={styles.argumentFaction}>
                        {FACTION_META[argument.author.faction].kanji} {FACTION_META[argument.author.faction].name}
                      </span>
                    ) : null}
                    <span className={styles.argumentRank}>
                      {argument.author ? getRankTitle(argument.author.rank) : 'Unranked'}
                    </span>
                    <span className={styles.argumentTime}>
                      {new Date(argument.created_at).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.argumentBody}>{argument.content}</div>
              </article>
            ))
          )}
        </div>

        {canParticipate ? (
          <div className={styles.composer}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={styles.textarea}
              placeholder="File your argument for the record."
              maxLength={600}
            />
            <div className={styles.composerMeta}>
              <span>12–600 characters · permanent public record</span>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void submitArgument()}
                disabled={submitting || draft.trim().length < 12}
              >
                {submitting ? 'Filing...' : 'File Response'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.threadNote}>
            Read-only for guests, observers, and queued files. Full members may vote and file responses.
          </div>
        )}
      </section>
    </article>
  )
}

export function ArenaPageGrid({
  initialPayload,
}: {
  initialPayload?: Partial<ArenaPayload> | null
}) {
  const { profile } = useAuth()
  const { debates, argumentsByDebate, voted, canVote, loading, error, vote, postArgument } =
    useArena(initialPayload)

  const canParticipate = canDo(profile, 'vote_in_arena') && canVote
  const roleNotice = useMemo(() => {
    if (!profile) {
      return 'The arena is public to read. Sign in and accept an assignment to vote or file responses.'
    }

    if (canParticipate) {
      return 'Your faction can influence this debate. File one vote and any number of recorded responses.'
    }

    if (profile.role === 'waitlist') {
      return 'Queued files can observe the arena, but faction clearance is required before participation.'
    }

    if (profile.role === 'observer') {
      return 'Observed files may read the arena record, but cannot influence it.'
    }

    return 'Participation is currently sealed.'
  }, [canParticipate, profile])

  if (loading) {
    return (
      <div className={styles.shell}>
        <p className={styles.notice}>Opening the current arena record...</p>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.notice}>{roleNotice}</div>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.grid}>
        {debates.map((debate) => (
          <ArenaDebateCard
            key={debate.id}
            debate={debate}
            votedSide={voted[debate.id]}
            argumentsList={argumentsByDebate[debate.id] ?? []}
            canParticipate={canParticipate}
            onVote={async (side) => {
              await vote(debate.id, side)
            }}
            onArgument={async (content) => {
              await postArgument(debate.id, content)
            }}
          />
        ))}
      </div>
      {!profile ? (
        <div className={styles.notice}>
          <Link href="/login" className="btn-primary">
            Enter the Registry
          </Link>
        </div>
      ) : null}
    </div>
  )
}
