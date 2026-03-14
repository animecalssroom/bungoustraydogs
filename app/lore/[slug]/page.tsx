import { notFound } from 'next/navigation'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { LoreModel } from '@/backend/models/lore.model'
import { DiscussionModel } from '@/backend/models/discussion.model'
import { CommentThread } from '@/frontend/components/discussion/CommentThread'
import { FlagFileButton } from '@/frontend/components/support/FlagFileButton'
import { LoreViewTracker } from '@/frontend/components/lore/LoreViewTracker'

// Incremental Static Regeneration: 5 minutes
export const revalidate = 300

export default async function LorePostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await LoreModel.getBySlug(params.slug)
  const comments = await DiscussionModel.getLoreComments(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div style={{ paddingTop: '36px' }}>
      <LoreViewTracker postSlug={post.slug} />
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
              {post.profiles?.username ? (
                <AngoUsername userId={post.author_id} username={post.profiles.username} />
              ) : (
                'Anonymous'
              )}{' '}
              · {post.read_time} min read
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
              marginBottom: '1.5rem',
              padding: '1rem 1.1rem',
              border: '1px solid var(--border)',
              background: 'color-mix(in srgb, var(--card) 88%, transparent)',
              fontFamily: 'Cormorant Garamond, serif',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            Lore is essay space: interpretation, theory, literary context, and character
            analysis. If a piece is written like an in-world incident filing with a case
            number and district, it belongs in the staff Registry desk instead.
          </div>

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

          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <FlagFileButton
              entityType="lore_post"
              entityId={post.id}
              targetPath={`/lore/${encodeURIComponent(post.slug)}`}
              targetLabel={post.title}
            />
          </div>

          <CommentThread
            title="Reader Thread"
            description="Use this space for counter-readings, theory replies, author context, or a cleaner argument than the one in the main essay."
            endpoint={`/api/lore/${encodeURIComponent(post.slug)}/comments`}
            initialComments={comments}
          />
        </article>
      </div>
    </div>
  )
}
