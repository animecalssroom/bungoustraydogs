'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import type { LorePost } from '@/backend/types'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { usePersistentData } from '@/frontend/hooks/usePersistentData'

function LoreCard({ post }: { post: LorePost }) {
  return (
    <Link
      href={`/lore/${post.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        padding: '1.75rem',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.5rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'var(--tag)',
            padding: '3px 8px',
          }}
        >
          {post.category.replace('_', ' ')}
        </span>
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.5rem',
            color: 'var(--text3)',
          }}
        >
          {post.read_time} min
        </span>
      </div>
      <h3
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '0.75rem',
          lineHeight: 1.3,
        }}
      >
        {post.title}
      </h3>
      {post.excerpt ? (
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'var(--text2)',
            lineHeight: 1.7,
            marginBottom: '1rem',
          }}
        >
          {post.excerpt}
        </p>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.8rem',
            color: 'var(--text3)',
          }}
        >
          {post.profiles?.username ? (
            <AngoUsername userId={post.author_id} username={post.profiles.username} />
          ) : (
            'Anonymous'
          )}
        </span>
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.5rem',
            color: 'var(--text4)',
          }}
        >
          {post.view_count} views
        </span>
      </div>
    </Link>
  )
}

export function LorePageGridWithInitialPosts({ posts: serverPosts }: { posts: LorePost[] }) {
  const [posts, setPosts] = usePersistentData<LorePost[]>('lore_list', serverPosts)

  // Sync server posts to persistence when they change
  useEffect(() => {
    if (serverPosts.length) {
      setPosts(serverPosts)
    }
  }, [serverPosts])

  if (!posts.length) {
    return (
      <div className="section-wrap" style={{ paddingBottom: '6rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              color: 'var(--text3)',
              fontSize: '1.1rem',
            }}
          >
            No lore posts yet. Be the first to write one.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/lore/submit" className="btn-primary">
              Write The First Entry
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-wrap" style={{ paddingBottom: '6rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {posts.map((post) => (
          <LoreCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
