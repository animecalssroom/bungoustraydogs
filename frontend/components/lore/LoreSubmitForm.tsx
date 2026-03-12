'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { LoreCategory } from '@/backend/types'
import { countWords } from '@/backend/lib/registry'
import styles from '@/frontend/components/registry/Registry.module.css'

const CATEGORIES: Array<{ id: LoreCategory; label: string; description: string }> = [
  { id: 'deep_dive', label: 'Deep Dive', description: 'Long-form analysis of arcs, themes, and structure.' },
  { id: 'theory', label: 'Theory', description: 'Speculative but canon-aware interpretation.' },
  { id: 'character_study', label: 'Character Study', description: 'Close reading of a single character.' },
  { id: 'arc_review', label: 'Arc Review', description: 'Reflective writing about a BSD arc.' },
  { id: 'ability_analysis', label: 'Ability Analysis', description: 'Interpretive writing on an ability and its meaning.' },
  { id: 'real_author', label: 'Real Author', description: 'Context on the real-world author behind the BSD character.' },
]

export function LoreSubmitForm({ viewerRank }: { viewerRank: number }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [category, setCategory] = useState<LoreCategory>('deep_dive')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const wordCount = useMemo(() => countWords(content), [content])
  const maxWords = viewerRank >= 2 ? 500 : 200
  const minWords = 50
  const readTime = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount])
  const activeCategory = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0]
  const effectiveSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
  const canPublish =
    !pending &&
    title.trim().length >= 5 &&
    effectiveSlug.length >= 3 &&
    wordCount >= minWords &&
    wordCount <= maxWords

  return (
    <form
      className={styles.caseWrap}
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)

        startTransition(async () => {
          const response = await fetch('/api/lore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              slug: effectiveSlug,
              category,
              excerpt,
              content,
              read_time: readTime,
            }),
          })

          const json = (await response.json().catch(() => ({}))) as {
            error?: string
            data?: { slug?: string }
          }

          if (!response.ok || json.error) {
            setMessage(json.error ?? 'Unable to publish lore.')
            return
          }

          const nextSlug = json.data?.slug ?? effectiveSlug
          setMessage(`Lore published to /lore/${nextSlug}.`)
          setTitle('')
          setSlug('')
          setSlugTouched(false)
          setCategory('deep_dive')
          setExcerpt('')
          setContent('')
          router.push(`/lore/${nextSlug}`)
          router.refresh()
        })
      }}
    >
      <div className={styles.caseFile}>
        <div className={styles.caseHeader}>
          <div>
            <p className={styles.meta}>Literary Desk</p>
            <h1 className={styles.caseTitle}>New Lore Entry</h1>
          </div>
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Category</p>
          <select
            className={styles.control}
            value={category}
            onChange={(event) => setCategory(event.target.value as LoreCategory)}
          >
            {CATEGORIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
          <p className={styles.helper}>{activeCategory.description}</p>
          <p className={styles.helper}>
            {viewerRank >= 2
              ? 'Lore entries require 50 to 500 words. Longer work should be split into continuation entries.'
              : 'Rank 1 lore entries require 50 to 200 words. Longer work should be split into continuation entries after ranking up.'}
          </p>
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Title</p>
          <input className={styles.textInput} value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Slug</p>
          <input
            className={styles.textInput}
            value={slugTouched ? slug : effectiveSlug}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))
            }}
          />
          <p className={styles.helper}>Auto-generated from the title. You can still edit it.</p>
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Excerpt</p>
          <textarea className={styles.textArea} rows={4} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Essay</p>
          <textarea className={styles.textArea} rows={18} value={content} onChange={(event) => setContent(event.target.value)} />
          <div className={styles.statsRow}>
            <span className={styles.counter}>
              Word count: {wordCount} / {maxWords}
            </span>
            <span className={styles.counter}>{readTime} min read</span>
          </div>
          <p className={styles.helper}>
            Lore is for analysis, theory, and literary context. If this is an in-world incident
            account, keep it for the staff Registry desk instead.
          </p>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!canPublish}
        >
          {pending ? 'Publishing...' : 'Publish Lore'}
        </button>
        {!canPublish ? (
          <p className={styles.helper}>
            {title.trim().length < 5
              ? 'Title must be at least 5 characters.'
              : effectiveSlug.length < 3
                ? 'Slug could not be generated yet. Add a longer title.'
                : wordCount < minWords
                  ? `Lore requires at least ${minWords} words. Current count: ${wordCount}.`
                  : wordCount > maxWords
                    ? `This entry exceeds your current ${maxWords}-word limit. Split it into a continuation entry.`
                  : 'Lore cannot be published yet.'}
          </p>
        ) : null}
        {message ? <p className={styles.helper}>{message}</p> : null}
      </div>
    </form>
  )
}
