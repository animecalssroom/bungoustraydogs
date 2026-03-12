import { notFound } from 'next/navigation'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { LoreModel } from '@/backend/models/lore.model'

export const dynamic = 'force-dynamic'

export default async function LorePostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await LoreModel.getBySlug(params.slug)

  if (!post) {
    notFound()
  }

  await LoreModel.incrementViews(post.id)

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <div className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
          <article
            style={{
              maxWidth: '820px',
              margin: '0 auto',
              padding: '2.5rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          >
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.55rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  marginBottom: '0.75rem',
                }}
              >
                {post.category.replace('_', ' ')}
              </p>
              <h1
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: 'var(--text)',
                  marginBottom: '0.75rem',
                }}
              >
                {post.title}
              </h1>
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  color: 'var(--text3)',
                  fontSize: '0.95rem',
                }}
              >
                {post.profiles?.username ?? 'Anonymous'} · {post.read_time} min read
              </p>
            </div>

            {post.excerpt ? (
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  color: 'var(--text2)',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  marginBottom: '2rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {post.excerpt}
              </p>
            ) : null}

            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.08rem',
                lineHeight: 1.95,
                color: 'var(--text)',
              }}
            >
              {post.content}
            </div>

            {post.tags.length ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.55rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                      background: 'var(--tag)',
                      padding: '4px 10px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
