'use client'

import { useState, useTransition } from 'react'
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
  const [pending, startTransition] = useTransition()

  return (
    <div>
      <button
        type="button"
        className={styles.saveButton}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null)
            const response = await fetch(`/api/registry/${encodeURIComponent(caseNumber)}/save`, {
              method: 'POST',
            })
            const json = (await response.json().catch(() => ({}))) as {
              error?: string
              data?: { save_count?: number }
            }

            if (!response.ok || json.error) {
              setMessage(json.error ?? 'Unable to save file.')
              return
            }

            setSaveCount(json.data?.save_count ?? saveCount + 1)
            setMessage('Filed to your saved registry.')
          })
        }
      >
        {pending ? 'Filing...' : `Save File · ${saveCount}`}
      </button>
      {message ? <p className={styles.helper}>{message}</p> : null}
    </div>
  )
}
