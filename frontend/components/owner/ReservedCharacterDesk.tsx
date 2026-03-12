'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FACTION_META } from '@/frontend/lib/launch'
import type {
  OwnerDashboardUser,
  OwnerReservedCharacter,
} from '@/backend/models/owner.model'

function formatFactionName(faction: keyof typeof FACTION_META | null) {
  return faction ? FACTION_META[faction].name : 'Unassigned'
}

export function ReservedCharacterDesk({
  users,
  reservedCharacters,
}: {
  users: OwnerDashboardUser[]
  reservedCharacters: OwnerReservedCharacter[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [error, setError] = useState('')

  const assignableUsers = useMemo(
    () =>
      users.filter((user) => !user.character_match_id).filter((user) => {
        const query = search.trim().toLowerCase()

        if (!query) {
          return true
        }

        return (
          user.username.toLowerCase().includes(query) ||
          (user.faction ?? '').toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        )
      }),
    [search, users],
  )

  const unassignedReserved = useMemo(
    () => reservedCharacters.filter((character) => !character.assigned_to),
    [reservedCharacters],
  )

  useEffect(() => {
    if (!selectedUserId && assignableUsers[0]) {
      setSelectedUserId(assignableUsers[0].id)
    }

    if (
      selectedUserId &&
      !assignableUsers.some((user) => user.id === selectedUserId)
    ) {
      setSelectedUserId(assignableUsers[0]?.id ?? '')
    }
  }, [assignableUsers, selectedUserId])

  useEffect(() => {
    if (!selectedSlug && unassignedReserved[0]) {
      setSelectedSlug(unassignedReserved[0].slug)
    }

    if (
      selectedSlug &&
      !unassignedReserved.some((character) => character.slug === selectedSlug)
    ) {
      setSelectedSlug(unassignedReserved[0]?.slug ?? '')
    }
  }, [selectedSlug, unassignedReserved])

  const selectedUser = assignableUsers.find((user) => user.id === selectedUserId) ?? null
  const selectedReserved =
    unassignedReserved.find((character) => character.slug === selectedSlug) ?? null

  const assignReserved = async () => {
    if (!selectedUser || !selectedReserved) {
      return
    }

    setError('')

    const response = await fetch('/api/owner/assign-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: selectedUser.id,
        slug: selectedReserved.slug,
      }),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to assign reserved character.')
      return
    }

    startTransition(() => router.refresh())
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
          Reserved Assignment Desk
        </p>
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
          Owner Character Control
        </h1>
        <p className="section-sub" style={{ margin: 0, maxWidth: '720px' }}>
          Reserved characters bypass the normal behavioral queue. Pick an eligible user,
          seal the designation, and the registry updates the file immediately.
        </p>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            color: error ? 'var(--accent)' : 'var(--text4)',
          }}
        >
          {error || 'Only users without a current character file appear here.'}
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <article
          style={{
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: '1.5rem',
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
              Eligible Users
            </p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username, faction, role"
              style={{
                minWidth: '260px',
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0.75rem 0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {assignableUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                style={{
                  border: `1px solid ${selectedUserId === user.id ? 'var(--accent)' : 'var(--border2)'}`,
                  background:
                    selectedUserId === user.id ? 'var(--tag)' : 'var(--surface2)',
                  color: 'var(--text)',
                  textAlign: 'left',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem' }}>
                      {user.username}
                    </div>
                    <div
                      style={{
                        marginTop: '0.35rem',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.52rem',
                        color: 'var(--text4)',
                      }}
                    >
                      {user.role} · {formatFactionName(user.faction)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.52rem',
                      color: 'var(--accent)',
                    }}
                  >
                    R{user.rank} · {user.ap_total} AP
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article
          style={{
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: '1.5rem',
          }}
        >
          <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
            Assignment
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text4)',
                }}
              >
                Selected User
              </div>
              <div
                style={{
                  marginTop: '0.45rem',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '1.15rem',
                }}
              >
                {selectedUser?.username ?? 'No user selected'}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text4)',
                  marginBottom: '0.55rem',
                }}
              >
                Reserved Character
              </div>
              <select
                value={selectedSlug}
                onChange={(event) => setSelectedSlug(event.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  padding: '0.85rem 0.9rem',
                }}
              >
                {unassignedReserved.map((character) => (
                  <option key={character.slug} value={character.slug}>
                    {character.character_name} · {formatFactionName(character.faction)}
                  </option>
                ))}
              </select>
            </div>

            {selectedReserved ? (
              <div
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1rem',
                }}
              >
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem' }}>
                  {selectedReserved.character_name}
                </div>
                <div
                  style={{
                    marginTop: '0.35rem',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.52rem',
                    color: 'var(--text4)',
                  }}
                >
                  {formatFactionName(selectedReserved.faction)}
                </div>
                <p
                  style={{
                    marginTop: '0.55rem',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1rem',
                    color: 'var(--text2)',
                    fontStyle: 'italic',
                  }}
                >
                  {selectedReserved.reserved_reason ?? 'Reserved for owner-only assignment.'}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="btn-primary"
              onClick={() => void assignReserved()}
              disabled={pending || !selectedUser || !selectedReserved}
            >
              {pending ? 'Sealing...' : 'Seal Reserved Designation'}
            </button>
          </div>
        </article>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '1.5rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Reserved Character Ledger
        </p>
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
                  color: 'var(--text4)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {formatFactionName(character.faction)}
              </div>
              <div
                style={{
                  marginTop: '0.45rem',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '1.05rem',
                }}
              >
                {character.character_name}
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'var(--text2)',
                }}
              >
                {character.assigned_username
                  ? `Assigned to ${character.assigned_username}`
                  : 'Unassigned'}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
