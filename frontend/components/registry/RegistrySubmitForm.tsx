'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  REGISTRY_DISTRICT_LABELS,
  REGISTRY_POST_TYPE_META,
  countWords,
  getAvailableRegistryPostTypes,
} from '@/backend/lib/registry'
import type { RegistryDistrict, RegistryPostType } from '@/backend/types'
import styles from './Registry.module.css'

const DISTRICTS = Object.keys(REGISTRY_DISTRICT_LABELS) as RegistryDistrict[]

export function RegistrySubmitForm({ viewerRank }: { viewerRank: number }) {
  const [title, setTitle] = useState('')
  const [district, setDistrict] = useState<RegistryDistrict>('kannai')
  const availableTypes = useMemo(() => getAvailableRegistryPostTypes(viewerRank), [viewerRank])
  const [postType, setPostType] = useState<RegistryPostType>(availableTypes[0] ?? 'field_note')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const wordCount = useMemo(() => countWords(content), [content])
  const postMeta = REGISTRY_POST_TYPE_META[postType]

  const canSubmit = wordCount >= postMeta.minWords && title.trim().length >= 5

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
            body: JSON.stringify({
              title,
              district,
              content,
              postType,
              threadMode: 'new',
              threadTitle: title.trim(),
            }),
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
          setPostType(availableTypes[0] ?? 'field_note')
          setContent('')
        })
      }}
    >
        <div className={styles.caseFile}>
          <div className={styles.caseHeader}>
            <div>
              <p className={styles.meta}>{postMeta.label}</p>
              <h1 className={styles.caseTitle}>New Submission</h1>
            </div>
          </div>

          <div className={styles.caseSection}>
            <p className={styles.sectionLabel}>Report Type</p>
            <select
              className={styles.control}
              value={postType}
              onChange={(e) => setPostType(e.target.value as RegistryPostType)}
            >
              {availableTypes.map((value) => (
                <option key={value} value={value}>
                  {REGISTRY_POST_TYPE_META[value].label} · {REGISTRY_POST_TYPE_META[value].minWords} words · {REGISTRY_POST_TYPE_META[value].approvalAp} AP on approval
                </option>
              ))}
            </select>
            <p className={styles.helper}>{postMeta.description}</p>
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
            <span className={styles.counter}>
              Word count: {wordCount} / {postMeta.minWords}
            </span>
            <span className={styles.counter}>
              Approval reward: {postMeta.approvalAp} AP
            </span>
          </div>
          <p className={styles.helper}>
            All submissions are reviewed by the city registry. Field notes are reviewed lightly.
            Higher report types are judged more strictly for canon and internal consistency.
          </p>
        </div>

        <button type="submit" className={styles.submitButton} disabled={pending || !canSubmit}>
          {pending ? 'Filing...' : 'Submit Report'}
        </button>
        {message ? <p className={styles.helper}>{message}</p> : null}
      </div>
    </form>
  )
}
