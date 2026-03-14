'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './Registry.module.css'

export function RegistrySaveButton({
  caseNumber,
  initialSaveCount,
}: {
  caseNumber: string
  initialSaveCount: number
}) {
  const [saveCount, setSaveCount] = useState(initialSaveCount)
  const [message, setMessage] = useState<string | null>(null)
  const [isOptimisticPending, setIsOptimisticPending] = useState(false)

  const handleSave = async () => {
    if (isOptimisticPending) return

    // Optimistic UI update
    setIsOptimisticPending(true)
    setSaveCount(prev => prev + 1)
    setMessage(null)

    try {
      const response = await fetch(`/api/registry/${encodeURIComponent(caseNumber)}/save`, {
        method: 'POST',
      })
      const json = (await response.json().catch(() => ({}))) as {
        error?: string
        data?: { save_count?: number }
      }

      if (!response.ok || json.error) {
        // Rollback on error
        setSaveCount(prev => Math.max(initialSaveCount, prev - 1))
        setMessage(json.error ?? 'Unable to save file.')
        setIsOptimisticPending(false)
        return
      }

      // Re-sync with server count if provided
      if (json.data?.save_count !== undefined) {
        setSaveCount(json.data.save_count)
      }
      setMessage('Filed to your saved registry.')
    } catch (err) {
      setSaveCount(prev => Math.max(initialSaveCount, prev - 1))
      setMessage('Network error. Unable to save.')
    } finally {
      setIsOptimisticPending(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        className={styles.saveButton}
        disabled={isOptimisticPending}
        onClick={handleSave}
      >
        {isOptimisticPending ? 'Filing...' : `Save File · ${saveCount}`}
      </button>
      {message ? (
        <p className={styles.helper}>
          {message} <Link href="/registry/saved">Open saved files.</Link>
        </p>
      ) : null}
    </div>
  )
}
