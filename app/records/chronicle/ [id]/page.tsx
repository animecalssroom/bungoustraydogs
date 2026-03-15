import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChronicleModel } from '@/backend/models/chronicle.model'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'

export const dynamic = 'force-dynamic'

export default async function ChronicleDetailPage({ params }: { params: { id: string } }) {
  const entry = await ChronicleModel.getById(params.id)

  if (!entry) {
    notFound()
  }

  return (
    <ErrorBoundary>
      <div style={{ 
        minHeight: '100vh', 
        padding: '2rem 1rem', 
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <Link href="/records?tab=chronicle" style={{ 
            color: 'var(--text-muted)', 
            textDecoration: 'none', 
            fontSize: '0.8rem',
            fontFamily: 'var(--font-record)',
            letterSpacing: '0.1em',
            display: 'block',
            marginBottom: '2rem'
          }}>
            ← RETURN TO RECORDS HALL
          </Link>

          <article className="paper-surface" style={{ 
            padding: '4rem 3rem',
            position: 'relative',
            border: '1px solid var(--border)',
            background: 'var(--card)'
          }}>
            {/* Sealed File Decoration */}
            <div style={{ 
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              width: '80px',
              height: '80px',
              border: '2px solid rgba(139, 37, 0, 0.4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(15deg)',
              color: 'rgba(139, 37, 0, 0.5)',
              fontFamily: 'var(--font-header)',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              SEALED
            </div>

            <header style={{ marginBottom: '3rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                marginBottom: '1rem',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-record)',
                color: 'var(--text-muted)',
                letterSpacing: '0.2em'
              }}>
                <span>#{String(entry.entry_number).padStart(3, '0')}</span>
                <span style={{ 
                  background: 'var(--border)', 
                  padding: '0.2rem 0.5rem',
                  color: 'var(--text)'
                }}>{entry.entry_type.replace('_', ' ').toUpperCase()}</span>
                {entry.published_at && (
                  <span>{new Date(entry.published_at).toLocaleDateString()}</span>
                )}
              </div>
              
              <h1 className="font-header" style={{ 
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                lineHeight: 1.1,
                color: 'var(--text)',
                marginBottom: '1rem'
              }}>{entry.title}</h1>
              
              <div style={{ 
                height: '2px', 
                background: 'var(--accent)', 
                width: '60px',
                marginTop: '1.5rem'
              }} />
            </header>

            <main style={{ 
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
              textAlign: 'justify'
            }}>
              {entry.content}
            </main>

            <footer style={{ 
              marginTop: '5rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              opacity: 0.6
            }}>
              <div style={{ fontFamily: 'var(--font-record)', fontSize: '0.7rem' }}>
                FILED BY: SPECIAL OPERATIONS DIVISION<br/>
                DEPARTMENT: ARCHIVE MANAGEMENT
              </div>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem' }}>
                Ango Sakaguchi
              </div>
            </footer>
          </article>
        </div>
      </div>
    </ErrorBoundary>
  )
}
