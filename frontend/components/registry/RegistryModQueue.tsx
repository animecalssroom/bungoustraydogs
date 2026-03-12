'use client'

import { useState, useTransition } from 'react'
import type { RegistryPost } from '@/backend/types'
import styles from './Registry.module.css'

function badge(review: RegistryPost['gemini_review']) {
  if (!review) return 'manual'
  return review.recommendation
}

export function RegistryModQueue({ initialPosts }: { initialPosts: RegistryPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  if (posts.length === 0) {
    return null
  }

  return (
    <div className={styles.queuePanel}>
      {posts.map((post) => (
        <article key={post.id} className={styles.queueCard}>
          <div className={styles.queueHead}>
            <div>
              <div className={styles.meta}>{post.case_number}</div>
              <div className={styles.queueTitle}>{post.title}</div>
            </div>
            <div className={styles.queueReason}>{badge(post.gemini_review)}</div>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.meta}>{post.author_character ?? 'Unknown file'}</span>
            <span className={styles.meta}>{post.word_count} words</span>
          </div>
          <p className={styles.helper}>
            {post.gemini_review?.recommendation_reason ?? 'Gemini review unavailable. Manual review required.'}
          </p>
          <textarea
            className={`${styles.textArea} ${styles.moderationNote}`}
            rows={3}
            value={notes[post.id] ?? ''}
            onChange={(event) => setNotes((current) => ({ ...current, [post.id]: event.target.value }))}
            placeholder="Reason required for request edit or reject."
          />
          <div className={styles.queueActions}>
            {(['approve', 'review', 'reject'] as const).map((action) => (
              <button
                key={action}
                type="button"
                className={`${styles.queueButton} ${action === 'approve' ? '' : styles.queueButtonSecondary}`}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const response = await fetch(`/api/registry/posts/${post.id}/review`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action,
                        note: notes[post.id],
                        feature: action === 'approve',
                      }),
                    })

                    if (response.ok) {
                      setPosts((current) => current.filter((entry) => entry.id !== post.id))
                    }
                  })
                }
              >
                {action}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
