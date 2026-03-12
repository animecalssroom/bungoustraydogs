import Link from 'next/link'

const footerColumns = [
  {
    title: 'Navigate',
    subtitle: '案内',
    links: [
      { href: '/registry', label: 'The Registry' },
      { href: '/archive', label: 'Character Archive' },
      { href: '/factions', label: 'Faction Dossiers' },
      { href: '/arena', label: 'The Arena' },
      { href: '/lore', label: 'Lore Archive' },
    ],
  },
  {
    title: 'Community',
    subtitle: '社会',
    links: [
      { href: '/lore/submit', label: 'Write Lore' },
      { href: '/tickets', label: 'Registry Ticket Desk' },
      { href: '/arena', label: 'Open Debates' },
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
        padding: '5rem 2.5rem 2.5rem',
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
            <div
              style={{
                width: '38px',
                height: '38px',
                border: '1.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '15px',
                color: 'var(--accent)',
              }}
            >
              文
            </div>
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
