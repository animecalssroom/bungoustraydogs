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
  const [isForceMinimized, setIsForceMinimized] = useState(false)
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

  // Minimize/hide the widget on specific pages for mobile viewports
  useEffect(() => {
    const HIDE_BOT_PAGES = ['/faction', '/registry/submit', '/duels/']
    const shouldHide = HIDE_BOT_PAGES.some((p) => pathname?.startsWith(p))
    if (shouldHide && typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsForceMinimized(true)
      setIsOpen(false)
    } else {
      setIsForceMinimized(false)
    }
  }, [pathname, setIsOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [awaitingDismissConfirm, dismissStatus, isLoading, isOpen, messages])

  const suggestions = useMemo(() => getSuggestions(profile), [profile])
  const introMessage = useMemo(
    () => ({
      id: 'guide-bot-intro',
      role: 'assistant' as const,
      content: FIRST_MESSAGE,
      created_at: 'guide-bot-intro',
    }),
    [],
  )
  const displayedMessages = messages.length ? messages : [introMessage]

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
      {isOpen && !isForceMinimized ? (
        <aside
          className={styles.panel}
          style={{
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.55)',
            borderRadius: '1.1rem',
            background: 'linear-gradient(135deg, #18181b 80%, #23232b 100%)',
            border: '2px solid #3f3f46',
            maxWidth: '95vw',
            width: 'min(420px, 95vw)',
            height: 'min(600px, 80vh)',
          }}
        >
          <header
            className={styles.header}
            style={{
              borderRadius: '1.1rem 1.1rem 0 0',
              background: 'rgba(24,24,27,0.96)',
              borderBottom: '1.5px solid #27272a',
              padding: '1.1rem 1.2rem',
            }}
          >
            <div>
              <div className={styles.title} style={{ fontSize: '0.82rem', color: '#e4e4e7' }}>
                YOKOHAMA REGISTRY TERMINAL
              </div>
              <div className={styles.subtitle} style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>
                Yokohama Ability Registry Terminal
              </div>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setIsOpen(false)}
              style={{ fontSize: '1.2rem', color: '#a1a1aa' }}
            >
              X
            </button>
          </header>

          <div className={styles.messages} ref={scrollRef} style={{ padding: '1.2rem', fontSize: '1.04rem' }}>
            {displayedMessages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? styles.messageUser : styles.messageBot}
                style={
                  message.role === 'user'
                    ? {
                        background: 'linear-gradient(90deg, #23232b 60%, #18181b 100%)',
                        color: '#fafafc',
                        border: '1.5px solid #3f3f46',
                        marginLeft: '2.5rem',
                      }
                    : {
                        background: 'linear-gradient(90deg, #18181b 80%, #23232b 100%)',
                        color: '#d4d4d8',
                        border: '1.5px solid #27272a',
                        marginRight: '2.5rem',
                      }
                }
              >
                {message.role === 'assistant' ? <span className={styles.prefix}>{'>'}</span> : null}
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

            {isLoading ? <div className={styles.loading}>{'> ...'}</div> : null}
            {awaitingDismissConfirm ? (
              <div className={styles.messageBot}>
                <span className={styles.prefix}>{'>'}</span>
                Confirming dismissal. This terminal will not appear again. Type CONFIRM to proceed.
              </div>
            ) : null}
            {dismissStatus ? (
              <div className={styles.messageBot}>
                <span className={styles.prefix}>{'>'}</span>
                {dismissStatus}
              </div>
            ) : null}
          </div>

          <div
            className={styles.composer}
            style={{ background: '#23232b', borderTop: '1.5px solid #27272a', borderRadius: '0 0 1.1rem 1.1rem' }}
          >
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
              style={{
                fontSize: '1.04rem',
                background: '#18181b',
                color: '#fafafc',
                borderRadius: '0.5rem',
                border: '1.5px solid #27272a',
                padding: '0.7rem 1rem',
              }}
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
          onClick={() => {
            if (isForceMinimized) {
              // only show toggle button
              return
            }
            setIsOpen(true)
          }}
          aria-label="City Registry Terminal"
        >
          <span className={styles.triggerLabel}>City Registry Terminal</span>
          <span className={styles.triggerGlyph}>{'>_'}</span>
          {pulse || subtleIndicator ? (
            <span className={`${styles.indicator} ${pulse ? styles.indicatorAlert : ''}`} />
          ) : null}
        </button>
      </div>
    </>
  )
}
