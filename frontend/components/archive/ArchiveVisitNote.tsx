'use client'

import { useEffect, useState } from 'react'
import styles from './Archive.module.css'

interface ArchiveVisitNoteProps {
  slug: string
}

export function ArchiveVisitNote({ slug }: ArchiveVisitNoteProps) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const key = `bsd_archive_visits_${slug}`
    const count = Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) + 1
    window.localStorage.setItem(key, String(count))

    if (count < 3) {
      return
    }

    const timer = window.setTimeout(() => {
      setMessage(`You have accessed this file ${count} times. The registry notes your interest.`)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [slug])

  if (!message) {
    return null
  }

  return <p className={styles.visitNote}>{message}</p>
}
