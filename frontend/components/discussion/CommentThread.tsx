'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { useAuth } from '@/frontend/context/AuthContext'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { FlagFileButton } from '@/frontend/components/support/FlagFileButton'
import type { PostComment } from '@/backend/types'
import styles from './Discussion.module.css'

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function CommentThread({
  title,
  description,
  endpoint,
  initialComments,
}: {
  title: string
  description: string
  endpoint: string
  initialComments: PostComment[]
}) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canComment = useMemo(
    () => Boolean(user && profile && ['member', 'mod', 'owner'].includes(profile.role)),
    [profile, user],
  )

  return (
    <section className={styles.thread}>
      <div className={styles.intro}>
        <p className={styles.label}>Discussion</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{description}</p>
      </div>

      {canComment ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            if (!content.trim()) return

            startTransition(async () => {
              setMessage(null)
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
              })
              const json = (await response.json().catch(() => ({}))) as {
                error?: string
                data?: PostComment
              }

              if (!response.ok || json.error || !json.data) {
                setMessage(json.error ?? 'Unable to file your note.')
                return
              }

              setComments((current) => [...current, json.data as PostComment])
              setContent('')
              setMessage('Your note has been added to the thread.')
            })
          }}
        >
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add your reading, counterpoint, theory, or case-note response."
            className={styles.textarea}
          />
          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={pending}>
              {pending ? 'Filing note...' : 'Add Note'}
            </button>
            {message ? <span className={styles.hint}>{message}</span> : null}
          </div>
        </form>
      ) : (
        <p className={styles.hint}>
          <Link href="/login">Enter the city</Link> with an active file to join the discussion.
        </p>
      )}

      <div className={styles.list}>
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id} className={styles.comment}>
              <div className={styles.commentHead}>
                <div className={styles.author}>
                  {comment.profiles?.username ? (
                    <AngoUsername userId={comment.user_id} username={comment.profiles.username} />
                  ) : (
                    'Unknown file'
                  )}
                  {comment.profiles?.rank ? (
                    <span className={styles.stamp}>R{comment.profiles.rank}</span>
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className={styles.meta}>{formatTime(comment.created_at)}</span>
                  <FlagFileButton
                    entityType="comment"
                    entityId={comment.id}
                    targetPath={pathname || endpoint}
                    targetLabel={`Comment on ${title}`}
                    compact
                    hidden={user?.id === comment.user_id}
                  />
                </div>
              </div>
              <div className={styles.content}>{comment.content}</div>
            </article>
          ))
        ) : (
          <p className={styles.empty}>
            No notes yet. This file is still waiting for a first response.
          </p>
        )}
      </div>
    </section>
  )
}
