import Link from 'next/link'
import { CharacterProgress } from '@/frontend/components/profile/CharacterProgress'
import { getViewerUserId } from '@/frontend/lib/auth-server'

const cardStyle = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  padding: '1.5rem',
} as const

export default async function GuidePage() {
  const userId = await getViewerUserId()

  return (
    <div style={{ paddingTop: '36px' }}>
      <div className="section-head">
        <p className="section-eyebrow">City Guide · How To Play BungouArchive</p>
        <h1 className="section-title">
          Enter Yokohama. <em>Build Your File.</em>
        </h1>
        <div className="ink-divider" />
        <p className="section-sub">
          BungouArchive is a slow-burn BSD city simulation. You explore the archive,
          enter a faction, contribute records, and build enough behavioral evidence for
          the city to assign your character file.
        </p>
      </div>

      {userId ? (
        <div className="section-wrap" style={{ marginBottom: '2rem' }}>
          <CharacterProgress />
        </div>
      ) : null}

      <div className="section-wrap" style={{ display: 'grid', gap: '1rem', paddingBottom: '3rem' }}>
        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>1. Start The File</p>
          <p className="section-sub" style={{ padding: 0 }}>
            Register, complete the onboarding exam, and accept your faction result.
            Faction placement happens first. Character assignment comes later, after
            your behavior has actually been observed.
          </p>
        </section>

        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>2. Explore The City</p>
          <p className="section-sub" style={{ padding: 0 }}>
            Read the <strong>Archive</strong> for official character files. Visit your
            faction room, read the transmission feed, and check other profiles. These
            actions help the city understand what kind of file you are building.
          </p>
        </section>

        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>3. The Records Hall</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
              <p className="font-space-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text4)' }}>Lore Hall</p>
              <p className="section-sub" style={{ padding: '0.5rem 0', fontSize: '0.95rem' }}>Community studies, essays, and literary deep-dives. Any member can contribute.</p>
              <Link href="/records?tab=lore" className="btn-secondary" style={{ fontSize: '0.7rem' }}>Explore Lore</Link>
            </div>
            <div style={{ borderLeft: '3px solid var(--blue)', paddingLeft: '1rem' }}>
              <p className="font-space-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text4)' }}>Field Notes</p>
              <p className="section-sub" style={{ padding: '0.5rem 0', fontSize: '0.95rem' }}>In-world logs and operational reports. Requires Senior Operative (Rank 2) status.</p>
              <Link href="/records?tab=field-notes" className="btn-secondary" style={{ fontSize: '0.7rem' }}>File Field Notes</Link>
            </div>
            <div style={{ borderLeft: '3px solid var(--text3)', paddingLeft: '1rem' }}>
              <p className="font-space-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text4)' }}>The Chronicle</p>
              <p className="section-sub" style={{ padding: '0.5rem 0', fontSize: '0.95rem' }}>The official record of Yokohama events, wars, and historical milestones. Read-only.</p>
              <Link href="/records?tab=chronicle" className="btn-secondary" style={{ fontSize: '0.7rem' }}>Read Chronicle</Link>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>4. Earn AP And Rank</p>
          <p className="section-sub" style={{ padding: 0 }}>
            Daily returns, transmissions, archive reading, profile visits, lore writing,
            and approved field notes all feed your AP and behavior profile.
            Higher rank expands your file and unlocks deeper filing access.
          </p>
        </section>

        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>5. Character Assignment</p>
          <p className="section-sub" style={{ padding: 0 }}>
            The system waits until you have enough active evidence. It reads your behavior
            scores, recent event history, and faction-only candidate pool. Gemini chooses first
            when available; deterministic fallback assigns if Gemini fails. Reserved characters
            are excluded from normal auto-assignment.
          </p>
        </section>

        <section style={cardStyle}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>6. Special Division</p>
          <p className="section-sub" style={{ padding: 0 }}>
            Special Division is not a normal public faction loop. If Ango designates you,
            your faction file flips immediately and your character stays sealed as <strong>???</strong>
            until manual assignment is made.
          </p>
        </section>

        <section
          style={{
            ...cardStyle,
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Quick Start</p>
            <p className="section-sub" style={{ padding: 0 }}>
              Archive for canon files. Records Hall for all community writing and official history. 
              Faction room for activity. Profile for your live file.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/archive" className="btn-secondary">Browse Archive</Link>
            <Link href="/records" className="btn-secondary">Explore Records</Link>
            <Link href="/tickets" className="btn-secondary">Open Ticket Desk</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
