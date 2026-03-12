'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FACTION_META, VISIBLE_FACTIONS } from '@/frontend/lib/launch'
import type {
  OwnerDashboardEvent,
  OwnerDashboardFlag,
  OwnerReservedCharacter,
  OwnerSupportTicket,
  OwnerContentFlag,
  OwnerSpecialDivisionRecommendation,
  OwnerDashboardSlot,
  OwnerDashboardUser,
} from '@/backend/models/owner.model'
import type { VisibleFactionId } from '@/backend/types'

interface OwnerConsoleProps {
  users: OwnerDashboardUser[]
  flags: OwnerDashboardFlag[]
  slots: OwnerDashboardSlot[]
  events: OwnerDashboardEvent[]
  reservedCharacters: OwnerReservedCharacter[]
  specialDivisionRecommendations: OwnerSpecialDivisionRecommendation[]
  supportTickets: OwnerSupportTicket[]
  contentFlags: OwnerContentFlag[]
}

function formatFactionName(faction: keyof typeof FACTION_META | null) {
  return faction ? FACTION_META[faction].name : 'Unassigned'
}

export function OwnerConsole({
  users,
  flags,
  slots,
  events,
  reservedCharacters,
  specialDivisionRecommendations,
  supportTickets,
  contentFlags,
}: OwnerConsoleProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({})
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>({})
  const [reassignChoice, setReassignChoice] = useState<Partial<Record<string, VisibleFactionId>>>(
    {},
  )

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return users
    }

    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(query) ||
        (user.faction ?? '').toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      )
    })
  }, [search, users])

  const refresh = () => startTransition(() => router.refresh())

  const activateNext = async (faction: OwnerDashboardSlot['faction']) => {
    setError('')
    const response = await fetch('/api/owner/waitlist/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ faction }),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to activate waitlist.')
      return
    }

    refresh()
  }

  const resolveFlag = async (flagId: string, action: 'confirm' | 'reassign') => {
    setError('')

    const body =
      action === 'reassign'
        ? { action, faction: reassignChoice[flagId] ?? 'agency' }
        : { action }

    const response = await fetch(`/api/owner/assignment-flags/${flagId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to resolve assignment review.')
      return
    }

    refresh()
  }

  const resolveSpecialDivision = async (
    observerPoolId: string,
    action: 'approve' | 'decline',
  ) => {
    setError('')

    const response = await fetch(`/api/owner/special-division/${observerPoolId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to resolve Special Division review.')
      return
    }

    refresh()
  }

  const resolveTicket = async (
    ticketId: string,
    status: 'in_review' | 'resolved' | 'dismissed',
  ) => {
    setError('')

    const response = await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        note: ticketNotes[ticketId]?.trim() || undefined,
      }),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to update ticket.')
      return
    }

    refresh()
  }

  const resolveContentFlag = async (
    flagId: string,
    action: 'dismiss' | 'take_action',
  ) => {
    setError('')

    const response = await fetch(`/api/admin/flags/${flagId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        note: flagNotes[flagId]?.trim() || undefined,
      }),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to resolve flagged file.')
      return
    }

    refresh()
  }

  const deleteUser = async (userId: string, username: string) => {
    setError('')

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Delete @${username} and wipe their auth account plus all linked data?`)
    ) {
      return
    }

    const response = await fetch(`/api/owner/users/${userId}`, {
      method: 'DELETE',
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to delete user.')
      return
    }

    refresh()
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Owner Console
        </p>
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
          Site Authority
        </h1>
        <p className="section-sub" style={{ margin: 0, maxWidth: '720px' }}>
          This surface sees every faction wall, every flagged file, and every queue that
          keeps Yokohama moving.
        </p>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            color: error ? 'var(--accent)' : 'var(--text4)',
          }}
        >
          {error || 'Owner access is global and invisible to faction walls.'}
        </p>
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/owner/assign-character" className="btn-secondary">
              Open Reserved Assignment Desk
            </Link>
            <Link href="/admin/special-division" className="btn-secondary">
              Open Ango Queue
            </Link>
            <Link href="/tickets" className="btn-secondary">
              Open Ticket Desk
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {slots.map((slot) => (
          <article
            key={slot.faction}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem',
                color: 'var(--text4)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {slot.faction.replace(/_/g, ' ')}
            </p>
            <h2
              style={{
                marginTop: '0.6rem',
                fontFamily: 'Cinzel, serif',
                fontSize: '1.2rem',
                color: 'var(--text)',
              }}
            >
              {slot.name}
            </h2>
            <p
              style={{
                marginTop: '0.8rem',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.6rem',
                color: 'var(--text3)',
              }}
            >
              {slot.active_count}/{slot.max_slots} active · {slot.waitlist_count} queued
            </p>
            <button
              type="button"
              className="btn-secondary"
              disabled={pending}
              onClick={() => void activateNext(slot.faction)}
              style={{ marginTop: '1rem' }}
            >
              Activate Next Waitlist
            </button>
          </article>
        ))}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <p className="section-eyebrow" style={{ margin: 0 }}>
            Reserved Character Status
          </p>
          <Link href="/owner/assign-character" className="btn-secondary">
            Assign Reserved Character
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {reservedCharacters.map((character) => (
            <article
              key={character.slug}
              style={{
                border: '1px solid var(--border2)',
                background: 'var(--surface2)',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text4)',
                }}
              >
                {formatFactionName(character.faction)}
              </div>
              <h3
                style={{
                  marginTop: '0.5rem',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '1.1rem',
                  color: 'var(--text)',
                }}
              >
                {character.character_name}
              </h3>
              <p
                style={{
                  marginTop: '0.5rem',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1rem',
                  color: 'var(--text2)',
                  fontStyle: 'italic',
                }}
              >
                {character.assigned_username
                  ? `Assigned to ${character.assigned_username}`
                  : 'Currently unassigned'}
              </p>
              <p
                style={{
                  marginTop: '0.45rem',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.52rem',
                  color: 'var(--text4)',
                }}
              >
                {character.reserved_reason ?? 'Reserved for owner-only assignment.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Pending Assignment Reviews
        </p>
        {flags.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No disputed assignments are waiting for review.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {flags.map((flag) => (
              <article
                key={flag.id}
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1.2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '1.1rem',
                        color: 'var(--text)',
                      }}
                    >
                      {flag.username}
                    </h3>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--text3)',
                      }}
                    >
                      Current: {formatFactionName(flag.current_faction)} · Requested from:{' '}
                      {formatFactionName(flag.requested_faction)}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.55rem',
                      color: 'var(--text4)',
                    }}
                  >
                    {new Date(flag.created_at).toLocaleDateString()}
                  </p>
                </div>
                {flag.notes && (
                  <p
                    style={{
                      marginTop: '0.8rem',
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1rem',
                      fontStyle: 'italic',
                      color: 'var(--text2)',
                    }}
                  >
                    {flag.notes}
                  </p>
                )}
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pending}
                    onClick={() => void resolveFlag(flag.id, 'confirm')}
                  >
                    Confirm Current Assignment
                  </button>
                  <select
                    value={reassignChoice[flag.id] ?? 'agency'}
                    onChange={(event) =>
                      setReassignChoice((current) => ({
                        ...current,
                        [flag.id]: event.target.value as VisibleFactionId,
                      }))
                    }
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      padding: '0.75rem 0.9rem',
                      minWidth: '180px',
                    }}
                  >
                    {VISIBLE_FACTIONS.map((faction) => (
                      <option key={faction} value={faction}>
                        {FACTION_META[faction].name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={pending}
                    onClick={() => void resolveFlag(flag.id, 'reassign')}
                  >
                    Reassign
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Open Registry Tickets
        </p>
        {supportTickets.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No registry tickets are waiting for review.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {supportTickets.map((ticket) => (
              <article
                key={ticket.id}
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1.2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '1.1rem',
                        color: 'var(--text)',
                      }}
                    >
                      {ticket.subject}
                    </h3>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--text3)',
                      }}
                    >
                      @{ticket.username} · {formatFactionName(ticket.faction)} · {ticket.queue.replace(/_/g, ' ')} · {ticket.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.55rem',
                      color: 'var(--text4)',
                    }}
                  >
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p
                  style={{
                    marginTop: '0.8rem',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1rem',
                    color: 'var(--text2)',
                    lineHeight: 1.7,
                  }}
                >
                  {ticket.details}
                </p>
                <textarea
                  value={ticketNotes[ticket.id] ?? ''}
                  onChange={(event) =>
                    setTicketNotes((current) => ({
                      ...current,
                      [ticket.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional response note for the filed ticket."
                  style={{
                    width: '100%',
                    minHeight: '88px',
                    marginTop: '0.95rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0.8rem 0.9rem',
                    resize: 'vertical',
                  }}
                />
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pending}
                    onClick={() => void resolveTicket(ticket.id, 'in_review')}
                  >
                    Mark In Review
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={pending}
                    onClick={() => void resolveTicket(ticket.id, 'resolved')}
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pending}
                    onClick={() => void resolveTicket(ticket.id, 'dismissed')}
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Flagged Files
        </p>
        {contentFlags.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No flagged files are waiting for review.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {contentFlags.map((flag) => (
              <article
                key={flag.id}
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1.2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '1.1rem',
                        color: 'var(--text)',
                      }}
                    >
                      {flag.target_label ?? 'Flagged File'}
                    </h3>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--text3)',
                      }}
                    >
                      Reported by @{flag.reporter_username} · {flag.entity_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Link href={flag.target_path} className="btn-secondary">
                    Open Target
                  </Link>
                </div>
                <p
                  style={{
                    marginTop: '0.8rem',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1rem',
                    color: 'var(--text2)',
                  }}
                >
                  Reason: {flag.reason}
                </p>
                {flag.details ? (
                  <p
                    style={{
                      marginTop: '0.45rem',
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1rem',
                      color: 'var(--text2)',
                      lineHeight: 1.7,
                    }}
                  >
                    {flag.details}
                  </p>
                ) : null}
                <textarea
                  value={flagNotes[flag.id] ?? ''}
                  onChange={(event) =>
                    setFlagNotes((current) => ({
                      ...current,
                      [flag.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional moderation note."
                  style={{
                    width: '100%',
                    minHeight: '88px',
                    marginTop: '0.95rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0.8rem 0.9rem',
                    resize: 'vertical',
                  }}
                />
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pending}
                    onClick={() => void resolveContentFlag(flag.id, 'dismiss')}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={pending}
                    onClick={() => void resolveContentFlag(flag.id, 'take_action')}
                  >
                    Take Action
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Special Division Notifications
        </p>
        {specialDivisionRecommendations.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No Special Division recommendations are waiting for owner review.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {specialDivisionRecommendations.map((recommendation) => (
              <article
                key={recommendation.observer_pool_id}
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1.2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '1.1rem',
                        color: 'var(--text)',
                      }}
                    >
                      {recommendation.username}
                    </h3>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--text3)',
                      }}
                    >
                      Recommended by {recommendation.recommended_by_username}
                      {recommendation.recommended_at
                        ? ` · ${new Date(recommendation.recommended_at).toLocaleDateString()}`
                        : ''}
                    </p>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--text4)',
                      }}
                    >
                      Scores: agency {recommendation.scores.agency ?? 0} · mafia{' '}
                      {recommendation.scores.mafia ?? 0} · guild{' '}
                      {recommendation.scores.guild ?? 0} · dogs{' '}
                      {recommendation.scores.dogs ?? 0}
                    </p>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem',
                        color: 'var(--accent)',
                      }}
                    >
                      Activity count: {recommendation.action_count}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={pending}
                      onClick={() =>
                        void resolveSpecialDivision(
                          recommendation.observer_pool_id,
                          'decline',
                        )
                      }
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pending}
                      onClick={() =>
                        void resolveSpecialDivision(
                          recommendation.observer_pool_id,
                          'approve',
                        )
                      }
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <p className="section-eyebrow" style={{ margin: 0 }}>
            Searchable User Registry
          </p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username, role, or faction"
            style={{
              minWidth: '280px',
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text)',
              padding: '0.75rem 0.9rem',
            }}
          />
        </div>
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 0.9fr 0.7fr 0.7fr 0.9fr auto',
                gap: '1rem',
                alignItems: 'center',
                paddingBottom: '0.8rem',
                borderBottom: '1px solid var(--border2)',
              }}
            >
              <div>
                <p style={{ fontFamily: 'Cinzel, serif', color: 'var(--text)' }}>
                  {user.username}
                </p>
                <p
                  style={{
                    marginTop: '0.3rem',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.52rem',
                    color: 'var(--text4)',
                  }}
                >
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text3)' }}>
                {user.role}
              </p>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text3)' }}>
                {formatFactionName(user.faction)}
              </p>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text3)' }}>
                R{user.rank}
              </p>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--accent)' }}>
                {user.ap_total} AP
              </p>
              <button
                type="button"
                className="btn-secondary"
                disabled={pending || user.role === 'owner'}
                onClick={() => void deleteUser(user.id, user.username)}
                style={{ padding: '0.55rem 0.75rem' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Recent Site Activity
        </p>
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingBottom: '0.8rem',
                borderBottom: '1px solid var(--border2)',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p style={{ fontFamily: 'Cinzel, serif', color: 'var(--text)' }}>
                  {event.username}
                </p>
                <p
                  style={{
                    marginTop: '0.35rem',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.55rem',
                    color: 'var(--text3)',
                  }}
                >
                  {event.event_type.replace(/_/g, ' ')} · {formatFactionName(event.faction)}
                </p>
              </div>
              <p
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.55rem',
                  color: 'var(--accent)',
                }}
              >
                +{event.ap_awarded} AP
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
