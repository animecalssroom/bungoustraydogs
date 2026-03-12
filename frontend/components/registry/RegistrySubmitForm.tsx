'use client'

import { useMemo, useState, useTransition } from 'react'
import { REGISTRY_DISTRICT_LABELS, countWords } from '@/backend/lib/registry'
import type { RegistryDistrict } from '@/backend/types'
import styles from './Registry.module.css'

const DISTRICTS = Object.keys(REGISTRY_DISTRICT_LABELS) as RegistryDistrict[]

export function RegistrySubmitForm() {
  const [title, setTitle] = useState('')
  const [district, setDistrict] = useState<RegistryDistrict>('kannai')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const wordCount = useMemo(() => countWords(content), [content])

  return (
    <form
      className={styles.caseWrap}
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)

        startTransition(async () => {
          const response = await fetch('/api/registry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, district, content }),
          })

          const json = (await response.json().catch(() => ({}))) as {
            error?: string
            data?: { case_number?: string }
          }

          if (!response.ok || json.error) {
            setMessage(json.error ?? 'Unable to file report.')
            return
          }

          setMessage(`Your report has been filed. Case ${json.data?.case_number}. Awaiting registry review.`)
          setTitle('')
          setDistrict('kannai')
          setContent('')
        })
      }}
    >
      <div className={styles.caseFile}>
        <div className={styles.caseHeader}>
          <div>
            <p className={styles.meta}>Incident Report</p>
            <h1 className={styles.caseTitle}>New Submission</h1>
          </div>
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Title</p>
          <input className={styles.textInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>District</p>
          <select className={styles.control} value={district} onChange={(e) => setDistrict(e.target.value as RegistryDistrict)}>
            {DISTRICTS.map((value) => (
              <option key={value} value={value}>{REGISTRY_DISTRICT_LABELS[value]}</option>
            ))}
          </select>
        </div>

        <div className={styles.caseSection}>
          <p className={styles.sectionLabel}>Content</p>
          <textarea
            className={styles.textArea}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className={styles.statsRow}>
            <span className={styles.counter}>Word count: {wordCount}</span>
          </div>
          <p className={styles.helper}>
            All submissions are reviewed by the city registry. The city does not publish inaccurate records.
          </p>
        </div>

        <button type="submit" className={styles.submitButton} disabled={pending || wordCount < 200}>
          {pending ? 'Filing...' : 'Submit Report'}
        </button>
        {message ? <p className={styles.helper}>{message}</p> : null}
      </div>
    </form>
  )
}
