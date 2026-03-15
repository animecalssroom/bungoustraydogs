'use client'

import Link from 'next/link'

const footerColumns = [
  {
    title: 'Navigate',
    subtitle: '案内',
    links: [
      { href: '/records', label: 'The Records Hall' },
      { href: '/archive', label: 'Character Archive' },
      { href: '/factions', label: 'Faction Dossiers' },
      { href: '/districts', label: 'City Districts' },
      { href: '/guide', label: 'Guide Bot Manual' },
    ],
  },
  {
    title: 'Community',
    subtitle: '社会',
    links: [
      { href: '/records/lore/submit', label: 'Write Lore' },
      { href: '/tickets', label: 'Support Desk' },
      { href: '/records/field-notes/submit', label: 'File Field Notes' },
      { href: '/factions', label: 'Faction Events' },
      { href: '/signup', label: 'Founders Registry' },
      { href: '/login', label: 'Profile Access' },
    ],
  },
  {
    title: 'Factions',
    subtitle: '勢力',
    links: [
      { href: '/factions', label: 'Agency · 探偵社' },
      { href: '/factions', label: 'Port Mafia · 港' },
      { href: '/factions', label: 'The Guild · 富' },
      { href: '/factions', label: 'Hunting Dogs · 犬' },
      { href: '/factions', label: 'Special Division · 務' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        padding: 'clamp(2rem, 8vw, 5rem) clamp(1rem, 5vw, 2.5rem) 2.5rem',
        transition: 'all 0.8s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '3rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            <img 
              src="/images/logo.jpg" 
              alt="Logo" 
              style={{ 
                width: '40px', 
                height: '40px', 
                objectFit: 'cover', 
                border: '1.5px solid var(--border)',
                borderRadius: '4px'
              }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--text)',
                }}
              >
                Bungou<span style={{ color: 'var(--accent)' }}>Archive</span>
              </span>
              <span
                style={{
                  marginTop: '4px',
                  fontFamily: 'Noto Serif JP, serif',
                  fontSize: '0.5rem',
                  letterSpacing: '0.2em',
                  color: 'var(--text3)',
                }}
              >
                Bungou Archive · Literary Records
              </span>
            </div>
          </Link>

          <p
            style={{
              maxWidth: '320px',
              marginTop: '1.25rem',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '0.98rem',
              fontStyle: 'italic',
              lineHeight: 1.85,
              color: 'var(--text2)',
            }}
          >
            A curated record of Yokohama&apos;s ability users, their gifts, their
            philosophies, and the conflicts that keep the city lit after midnight.
          </p>

          <a
            href="https://t.me/+VUN2mJJB4pBkMjM1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '1.5rem',
              padding: '0.8rem 1.2rem',
              border: '1px solid var(--border)',
              background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)'
            }}
          >
            <img src="/images/logo.jpg" alt="Telegram" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text2)' }}>
              Telegram Channel
            </span>
          </a>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p
              style={{
                marginBottom: '1.4rem',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--text3)',
              }}
            >
              {column.title} · {column.subtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {column.links.map((link) => (
                <Link
                  key={`${column.title}-${link.label}`}
                  href={link.href}
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '0.94rem',
                    fontStyle: 'italic',
                    color: 'var(--text2)',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          paddingTop: '1.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.1em',
            color: 'var(--text3)',
          }}
        >
          © 2026 BungouArchive · Fan project · Not affiliated with Kafka Asagiri
        </span>
        <span
          style={{
            fontFamily: 'Noto Serif JP, serif',
            fontSize: '0.66rem',
            fontWeight: 300,
            letterSpacing: '0.16em',
            color: 'var(--text3)',
          }}
        >
          Yokohama never fully dries.
        </span>
      </div>
    </footer>
  )
}
