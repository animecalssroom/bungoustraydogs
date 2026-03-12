'use client'

import { useEffect, useState } from 'react'
import styles from './Archive.module.css'

interface ArchiveVisitNoteProps {
  slug: string
}

function buildVisitMessage(count: number) {
  if (count < 3) {
    return null
  }

  if (count < 5) {
    return 'You have returned to this case more than once. The archive keeps quiet count.'
  }

  if (count < 8) {
    return `This file has been reopened ${count} times. A pattern is beginning to form around it.`
  }

  return `The archive has logged ${count} returns to this case. Whatever you are looking for, you have not let it go.`
}

export function ArchiveVisitNote({ slug }: ArchiveVisitNoteProps) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const key = `bsd_archive_visits_${slug}`
    const count = Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) + 1
    window.localStorage.setItem(key, String(count))

    const nextMessage = buildVisitMessage(count)

    if (!nextMessage) {
      return
    }

    const timer = window.setTimeout(() => {
      setMessage(nextMessage)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [slug])

  if (!message) {
    return null
  }

  return <p className={styles.visitNote}>{message}</p>
}
