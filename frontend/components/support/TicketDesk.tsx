'use client'

import { useState, useTransition } from 'react'
import type { ContentFlag, SupportTicket, TicketCategory } from '@/backend/types'
import { AssignmentFlagPanel } from '@/frontend/components/account/AssignmentFlagPanel'

const CATEGORIES: Array<{ id: TicketCategory; label: string; description: string }> = [
  { id: 'assignment', label: 'Assignment Issue', description: 'Wrong faction, wrong state, or character-file problem.' },
  { id: 'intake', label: 'Intake Error', description: 'Quiz completed but faction/result file did not resolve correctly.' },
  { id: 'faction', label: 'Faction Room', description: 'Faction wall, transmission, roster, or room access issue.' },
  { id: 'registry', label: 'Registry', description: 'Filing, save, approval, or case-file issue.' },
  { id: 'lore', label: 'Lore', description: 'Essay publishing, lore visibility, or lore-file issue.' },
  { id: 'account', label: 'Account', description: 'Username, sign-in, profile, or file access problem.' },
  { id: 'bug', label: 'System Fault', description: 'Broken route, UI bug, performance issue, or other technical problem.' },
  { id: 'special_division', label: 'Special Division', description: 'Drafting, designation, or Special Division review issue.' },
]

function statusCopy(value: SupportTicket['status'] | ContentFlag['status']) {
  switch (value) {
    case 'in_review':
    case 'reviewed':
      return 'In review'
    case 'resolved':
    case 'actioned':
      return 'Action taken'
    case 'dismissed':
      return 'Dismissed'
    default:
      return 'Open'
  }
}

export function TicketDesk({
  initialTickets,
  initialFlags,
}: {
  initialTickets: SupportTicket[]
  initialFlags: ContentFlag[]
}) {
  const [tickets, setTickets] = useState(initialTickets)
  const [flags] = useState(initialFlags)
  const [category, setCategory] = useState<TicketCategory>('bug')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>
          Registry Ticket Desk
        </p>
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
          File A Ticket
        </h1>
        <p className="section-sub" style={{ margin: 0, maxWidth: '760px' }}>
          Use this desk when the city file is wrong, a page is broken, or a public record needs human review.
          Assignment review remains separate below because it is one-time and owner adjudicated.
        </p>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          One-Time Assignment Review
        </p>
        <AssignmentFlagPanel />
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Submit Ticket
            </p>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as TicketCategory)}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0.85rem 0.95rem',
              }}
            >
              {CATEGORIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
            <p className="section-sub" style={{ padding: 0, marginTop: '0.6rem' }}>
              {CATEGORIES.find((entry) => entry.id === category)?.description}
            </p>
          </div>

          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text)',
              padding: '0.85rem 0.95rem',
            }}
          />
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Describe the problem precisely. Routes, usernames, case numbers, and visible symptoms help."
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text)',
              padding: '0.85rem 0.95rem',
              minHeight: '180px',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem',
                color: message?.includes('Unable') ? 'var(--accent)' : 'var(--text4)',
              }}
            >
              {message ?? 'Filed tickets route to the owner or Special Division based on category.'}
            </span>
            <button
              type="button"
              className="btn-primary"
              disabled={pending || subject.trim().length < 4 || details.trim().length < 20}
              onClick={() =>
                startTransition(async () => {
                  setMessage(null)
                  const response = await fetch('/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      category,
                      subject,
                      details,
                    }),
                  })
                  const json = await response.json().catch(() => ({}))

                  if (!response.ok || !json.data) {
                    setMessage(json.error ?? 'Unable to file ticket.')
                    return
                  }

                  setTickets((current) => [json.data as SupportTicket, ...current])
                  setSubject('')
                  setDetails('')
                  setCategory('bug')
                  setMessage('Ticket filed into the registry queue.')
                })
              }
            >
              {pending ? 'Filing...' : 'Submit Ticket'}
            </button>
          </div>
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
          Your Filed Tickets
        </p>
        {tickets.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No tickets filed yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tickets.map((ticket) => (
              <article
                key={ticket.id}
                style={{
                  border: '1px solid var(--border2)',
                  background: 'var(--surface2)',
                  padding: '1.2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.08rem', color: 'var(--text)' }}>
                      {ticket.subject}
                    </h3>
                    <p style={{ marginTop: '0.4rem', fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text3)' }}>
                      {ticket.category.replace(/_/g, ' ')} · {ticket.queue.replace(/_/g, ' ')} · {statusCopy(ticket.status)}
                    </p>
                  </div>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text4)' }}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p style={{ marginTop: '0.75rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--text2)', lineHeight: 1.7 }}>
                  {ticket.details}
                </p>
                {ticket.response_note ? (
                  <p style={{ marginTop: '0.75rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--accent)', lineHeight: 1.7 }}>
                    Response: {ticket.response_note}
                  </p>
                ) : null}
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
          Your Flagged Files
        </p>
        {flags.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No files flagged yet.
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
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.08rem', color: 'var(--text)' }}>
                  {flag.target_label ?? 'Flagged File'}
                </h3>
                <p style={{ marginTop: '0.4rem', fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: 'var(--text3)' }}>
                  {flag.entity_type.replace(/_/g, ' ')} · {statusCopy(flag.status)}
                </p>
                <p style={{ marginTop: '0.75rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--text2)' }}>
                  Reason: {flag.reason}
                </p>
                {flag.details ? (
                  <p style={{ marginTop: '0.45rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--text2)', lineHeight: 1.7 }}>
                    {flag.details}
                  </p>
                ) : null}
                {flag.action_taken ? (
                  <p style={{ marginTop: '0.75rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--accent)' }}>
                    Review note: {flag.action_taken}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
