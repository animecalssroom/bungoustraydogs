'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/frontend/context/AuthContext'
import { useGuideBot } from '@/frontend/lib/hooks/useGuideBot'
import styles from './GuideBotWidget.module.css'

const FIRST_MESSAGE = `Registry terminal active.
New ability signature detected.
The city has noted your arrival.
What do you need to know.`

function getSuggestions(profile: ReturnType<typeof useAuth>['profile']) {
  if (!profile?.exam_completed || !profile.faction) {
    return [
      'How do I get assigned to a faction?',
      'What do the factions do?',
      'What happens after the quiz?',
      'What is AP?',
    ]
  }

  if (!profile.character_match_id && !profile.character_name) {
    return [
      'When do I get my character?',
      'What counts as a user event?',
      'What can I do while I wait?',
      'How does AP work?',
    ]
  }

  return [
    'How do I challenge someone to a duel?',
    'What does my special ability do?',
    'How do Registry posts work?',
    'What is The Book?',
  ]
}

export function GuideBotWidget() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const {
    messages,
    input,
    setInput,
    isLoading,
    isDismissed,
    sendMessage,
    dismissBot,
    isOpen,
    setIsOpen,
  } = useGuideBot(profile)
  const [visitCount, setVisitCount] = useState(0)
  const [awaitingDismissConfirm, setAwaitingDismissConfirm] = useState(false)
  const [dismissStatus, setDismissStatus] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const key = `bsd_guide_visits_${user.id}`
    const nextCount = Number(window.localStorage.getItem(key) ?? '0') + 1
    window.localStorage.setItem(key, String(nextCount))
    setVisitCount(nextCount)
  }, [pathname, user?.id])

  useEffect(() => {
    if (!profile || isDismissed) return

    if (!profile.exam_completed || !profile.faction) {
      setIsOpen(true)
    }
  }, [isDismissed, profile, setIsOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [awaitingDismissConfirm, dismissStatus, isLoading, isOpen, messages])

  const suggestions = useMemo(() => getSuggestions(profile), [profile])
  const displayedMessages = messages.length
    ? messages
    : [
        {
          id: 'guide-bot-intro',
          role: 'assistant' as const,
          content: FIRST_MESSAGE,
          created_at: new Date().toISOString(),
        },
      ]

  const showSuggestions = messages.length === 0
  const pulse = !profile?.exam_completed || !profile?.faction
  const subtleIndicator = !pulse && profile && !profile.character_match_id && !profile.character_name
  const prominentDismiss =
    Boolean(profile?.character_match_id || profile?.character_name) && visitCount >= 3

  if (!user || !profile || isDismissed) {
    return null
  }

  return (
    <>
      {isOpen ? (
        <aside className={styles.panel}>
          <header className={styles.header}>
            <div>
              <div className={styles.title}>YOKOHAMA REGISTRY TERMINAL</div>
              <div className={styles.subtitle}>Yokohama Ability Registry Terminal</div>
            </div>
            <button type="button" className={styles.close} onClick={() => setIsOpen(false)}>
              X
            </button>
          </header>

          <div className={styles.messages} ref={scrollRef}>
            {displayedMessages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? styles.messageUser : styles.messageBot}
              >
                {message.role === 'assistant' ? <span className={styles.prefix}>▸</span> : null}
                {message.content}
              </div>
            ))}

            {showSuggestions ? (
              <div className={styles.suggestions}>
                {suggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => void sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}

            {isLoading ? <div className={styles.loading}>▸ . . .</div> : null}
            {awaitingDismissConfirm ? (
              <div className={styles.messageBot}>
                <span className={styles.prefix}>▸</span>
                Confirming dismissal. This terminal will not appear again. Type CONFIRM to proceed.
              </div>
            ) : null}
            {dismissStatus ? (
              <div className={styles.messageBot}>
                <span className={styles.prefix}>▸</span>
                {dismissStatus}
              </div>
            ) : null}
          </div>

          <div className={styles.composer}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  const nextInput = input.trim()
                  if (!nextInput || isLoading) return

                  if (awaitingDismissConfirm) {
                    if (nextInput === 'CONFIRM') {
                      void dismissBot()
                    } else {
                      setAwaitingDismissConfirm(false)
                      setDismissStatus('Dismissal cancelled. Terminal remains active.')
                      setInput('')
                    }
                    return
                  }

                  setDismissStatus(null)
                  void sendMessage(nextInput)
                }
              }}
              placeholder="Query the registry..."
              className={styles.input}
            />
            <div className={styles.hintRow}>
              <span className={styles.hint}>Enter to transmit</span>
              <button
                type="button"
                className={`${styles.dismiss} ${prominentDismiss ? styles.dismissProminent : ''}`}
                onClick={() => {
                  setAwaitingDismissConfirm(true)
                  setDismissStatus(null)
                  setInput('')
                }}
              >
                Dismiss terminal permanently
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      <div className={styles.triggerWrap}>
        <button
          type="button"
          className={`${styles.trigger} ${pulse ? styles.triggerPulse : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label="City Registry Terminal"
        >
          <span className={styles.triggerLabel}>City Registry Terminal</span>
          {'>_'}
          {pulse || subtleIndicator ? (
            <span className={`${styles.indicator} ${pulse ? styles.indicatorAlert : ''}`} />
          ) : null}
        </button>
      </div>
    </>
  )
}
