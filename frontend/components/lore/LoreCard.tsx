'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LorePost } from '@/backend/types'

function LoreCard({ post }: { post: LorePost }) {
  return (
    <Link href={`/lore/${post.slug}`} style={{ display: 'block', textDecoration: 'none', border: '1px solid var(--border)', background: 'var(--card)', padding: '1.75rem', transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--tag)', padding: '3px 8px' }}>{post.category.replace('_', ' ')}</span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.5rem', color: 'var(--text3)' }}>{post.read_time} min</span>
      </div>
      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.3 }}>{post.title}</h3>
      {post.excerpt && <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1rem' }}>{post.excerpt}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.8rem', color: 'var(--text3)' }}>{post.profiles?.username ?? 'Anonymous'}</span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.5rem', color: 'var(--text4)' }}>{post.view_count} views</span>
      </div>
    </Link>
  )
}

export function LoreSection() {
  const [posts, setPosts] = useState<LorePost[]>([])
  useEffect(() => { fetch('/api/lore').then(r => r.json()).then(({ data }) => setPosts(data?.slice(0, 3) ?? [])) }, [])
  if (!posts.length) return null
  return (
    <section style={{ padding: '4rem 0' }}>
      <div className="section-wrap">
        <div className="section-head" style={{ padding: '0 0 3rem' }}>
          <p className="section-eyebrow">文学 · Lore</p>
          <h2 className="section-title">From the <em>Archive</em></h2>
          <div className="ink-divider" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {posts.map(p => <LoreCard key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  )
}

export function LorePageGrid() {
  const [posts, setPosts] = useState<LorePost[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/lore').then(r => r.json()).then(({ data }) => { setPosts(data ?? []); setLoading(false) }) }, [])
  if (loading) return <p style={{ textAlign: 'center', padding: '4rem', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'var(--text3)' }}>Loading lore...</p>
  if (!posts.length) return <p style={{ textAlign: 'center', padding: '4rem', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'var(--text3)' }}>No lore posts yet. Be the first to write one.</p>
  return (
    <div className="section-wrap" style={{ paddingBottom: '6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {posts.map(p => <LoreCard key={p.id} post={p} />)}
      </div>
    </div>
  )
}
