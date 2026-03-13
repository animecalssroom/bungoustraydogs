'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/context/AuthContext'
import {
  resolvePostAuthPath,
} from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'

type ClientQuestion = {
  id: string
  question: string
  options: Array<{
    id: 'a' | 'b' | 'c' | 'd'
    text: string
  }>
}

const QUESTION_FLOW: ClientQuestion[] = [
  {
    id: '1',
    question: 'You have a rare and powerful ability. What is its purpose?',
    options: [
      { id: 'a', text: "To protect people who can't protect themselves" },
      { id: 'b', text: 'To establish your place. Power commands respect' },
      {
        id: 'c',
        text: "It's an asset. Assets generate leverage. Leverage generates everything",
      },
      {
        id: 'd',
        text: "To serve justice without exception. Your ability is the state's weapon",
      },
    ],
  },
  {
    id: '2',
    question:
      'Your closest ally has done something you believe is genuinely wrong. Not illegal - just wrong. What do you do?',
    options: [
      { id: 'a', text: 'Confront them directly. Loyalty means honesty not silence' },
      { id: 'b', text: 'Handle it internally. What happens inside stays inside' },
      {
        id: 'c',
        text: "Evaluate the damage. If it doesn't affect your position it doesn't affect you",
      },
      { id: 'd', text: 'Report it. Rules exist for everyone including allies' },
    ],
  },
  {
    id: '3',
    question:
      "You're hunting someone dangerous. An innocent person is caught in the middle - not hurt yet, but they'll slow you down. What do you do?",
    options: [
      {
        id: 'a',
        text: 'You stop. The mission exists to protect people. Abandoning one defeats the point',
      },
      { id: 'b', text: 'Someone else will handle them. Your job is the target' },
      { id: 'c', text: 'Calculate quickly. If helping costs less than not helping, help' },
      { id: 'd', text: 'The mission takes priority. Sentiment in the field gets people killed' },
    ],
  },
  {
    id: '4',
    question:
      'You just did something significant. Nobody saw it. Nobody will ever know it was you. How do you feel?',
    options: [
      { id: 'a', text: 'Fine. The outcome matters not the credit' },
      { id: 'b', text: 'Unsatisfied. Unwitnessed strength is wasted strength' },
      {
        id: 'c',
        text: "Annoyed. Unrecognized work is uncompensated work. You'll find a way to leverage it",
      },
      { id: 'd', text: "Fine. You did your duty. That's the entire point" },
    ],
  },
  {
    id: '5',
    question: "You're outnumbered, outpowered and losing. What do you do?",
    options: [
      { id: 'a', text: "Keep going. The mission doesn't end because it gets hard" },
      { id: 'b', text: "Fall back, regroup, return stronger. You can't win dead" },
      { id: 'c', text: 'Negotiate. There is always something the other side wants' },
      { id: 'd', text: 'Hold the line. Retreat is failure. You were given a duty' },
    ],
  },
  {
    id: '6',
    question:
      'You can achieve something genuinely good - but only by working with someone whose methods you find reprehensible. Do you?',
    options: [
      {
        id: 'a',
        text: "Yes - but you make clear it's temporary and you don't endorse them",
      },
      { id: 'b', text: 'Yes - sentiment about methods is a luxury. Outcomes are what matter' },
      { id: 'c', text: 'Yes - and you use the alliance to gain something extra on the side' },
      { id: 'd', text: "No. Working with them legitimizes them. Some lines don't get crossed" },
    ],
  },
  {
    id: '7',
    question: 'When this is all over - what do you want to be true?',
    options: [
      { id: 'a', text: 'That the people I protected are still standing' },
      { id: 'b', text: 'That nobody ever questioned my loyalty or my strength' },
      { id: 'c', text: 'That I built something that lasts and that I won' },
      { id: 'd', text: 'That I never compromised. Not even once' },
    ],
  },
]

const OPTION_DISPLAY_ORDER: Record<
  string,
  Array<'a' | 'b' | 'c' | 'd'>
> = {
  '1': ['b', 'd', 'a', 'c'],
  '2': ['c', 'a', 'd', 'b'],
  '3': ['d', 'b', 'c', 'a'],
  '4': ['b', 'c', 'a', 'd'],
  '5': ['c', 'd', 'a', 'b'],
  '6': ['d', 'a', 'b', 'c'],
  '7': ['b', 'c', 'd', 'a'],
}

const DISPLAY_LABELS = ['A', 'B', 'C', 'D'] as const

function buildPips(currentStep: number) {
  return Array.from(
    { length: QUESTION_FLOW.length },
    (_, index) => index + 1 <= currentStep,
  )
}

export default function QuizPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [started, setStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const currentQuestion = useMemo(
    () => QUESTION_FLOW[stepIndex] ?? null,
    [stepIndex],
  )
  const displayedOptions = useMemo(() => {
    if (!currentQuestion) {
      return []
    }

    const displayOrder = OPTION_DISPLAY_ORDER[currentQuestion.id]

    if (!displayOrder) {
      return currentQuestion.options
    }

    return displayOrder
      .map((optionId) =>
        currentQuestion.options.find((option) => option.id === optionId),
      )
      .filter(
        (
          option,
        ): option is {
          id: 'a' | 'b' | 'c' | 'd'
          text: string
        } => Boolean(option),
      )
  }, [currentQuestion])

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && !profile.username_confirmed) {
      router.replace('/onboarding/username')
      return
    }

    if (profile?.quiz_locked && profile.quiz_completed) {
      router.replace(resolvePostAuthPath(profile))
      return
    }

    if (profile?.quiz_completed && !profile.quiz_locked) {
      router.replace('/onboarding/result')
    }
  }, [loading, user, profile, router])

  const submitQuiz = async (nextAnswers: Record<string, 'a' | 'b' | 'c' | 'd'>) => {
    setSubmitting(true)
    setError('')

    const loadingDelay = new Promise((resolve) => window.setTimeout(resolve, 180))
    const request = fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers: nextAnswers }),
    })

    const [response] = await Promise.all([request, loadingDelay])
    const json = await response.json().catch(() => ({}))
    console.log('[quiz] submit response', { status: response.status, body: json })

    if (!response.ok) {
      setError(json.error ?? 'The registry could not record the final answer.')
      setSubmitting(false)
      return
    }

    // If server returned the updated profile, we can proceed immediately.
    if (json?.profile) {
      router.push('/onboarding/result')
      return
    }

    // Fallback: poll for updated profile (rare)
    let pollCount = 0
    const maxPolls = 18 // ~5 seconds
    let profileReady = false
    while (pollCount < maxPolls && !profileReady) {
      try {
        const resp = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await resp.json()
        if (data?.data?.quiz_completed && data?.data?.faction) {
          profileReady = true
          break
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 300))
      pollCount++
    }

    router.push('/onboarding/result')
  }

  const selectAnswer = async (optionId: 'a' | 'b' | 'c' | 'd') => {
    if (!currentQuestion || submitting) {
      return
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    }

    setAnswers(nextAnswers)
    setError('')

    if (stepIndex === QUESTION_FLOW.length - 1) {
      await submitQuiz(nextAnswers)
      return
    }

    setSubmitting(true)
    window.setTimeout(() => {
      setStepIndex((current) => current + 1)
      setSubmitting(false)
    }, 300)
  }

  if (loading || !currentQuestion) {
    return null
  }

  if (!started) {
    return (
      <>
        <Nav />
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background:
              'radial-gradient(circle at center, rgba(139, 37, 0, 0.10), transparent 40%), var(--bg)',
            padding: '96px 24px 32px',
          }}
        >
          <section
            className="paper-surface diagonal-card"
            style={{
              width: '100%',
              maxWidth: '760px',
              padding: '4rem 3rem',
              textAlign: 'center',
            }}
          >
          <div
            style={{
              fontFamily: 'Noto Serif JP, serif',
              fontSize: '9rem',
              color: 'var(--kanji)',
              lineHeight: 1,
            }}
          >
            判定
          </div>
          <h1
            style={{
              marginTop: '1rem',
              fontFamily: 'Cinzel, serif',
              fontSize: '2.4rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            Ability Registry
          </h1>
          <p
            style={{
              marginTop: '1.2rem',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.2rem',
              fontStyle: 'italic',
              color: 'var(--text2)',
              lineHeight: 1.8,
            }}
          >
            The city does not ask where you want to belong. It determines where you do.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="btn-primary"
            style={{ marginTop: '2.25rem' }}
          >
            Begin Registration
          </button>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
          padding: '96px 24px 32px',
        }}
      >
        <section
          className="paper-surface diagonal-card"
          style={{
            width: '100%',
            maxWidth: '760px',
            padding: '3.5rem 3rem',
          }}
        >
        <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem' }}>
          {buildPips(stepIndex + 1).map((filled, index) => (
            <span
              key={index}
              style={{
                flex: 1,
                height: '4px',
                background: filled ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.62rem',
            letterSpacing: '0.24em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            marginBottom: '1.4rem',
          }}
        >
          {String(stepIndex + 1).padStart(2, '0')} / {QUESTION_FLOW.length}
        </p>

        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.45rem',
            fontStyle: 'italic',
            color: 'var(--text)',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          {currentQuestion.question}
        </p>

        <div style={{ display: 'grid', gap: '10px' }}>
          {displayedOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              disabled={submitting}
              onClick={() => void selectAnswer(option.id)}
              className="exam-opt quiz-option-card diagonal-card"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--surface2)',
                border: '1px solid var(--border2)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1rem',
                color: 'var(--text)',
                opacity: submitting ? 0.72 : 1,
                animationDelay: `${index * 120}ms`,
              }}
            >
              <span
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.7rem',
                  color: 'var(--accent)',
                  minWidth: '18px',
                  marginTop: '2px',
                  textTransform: 'uppercase',
                }}
              >
                {option.id.toUpperCase()}
              </span>
              <span>{option.text}</span>
            </button>
          ))}
        </div>

        {submitting && (
          <p
            style={{
              marginTop: '1rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.58rem',
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {stepIndex === QUESTION_FLOW.length - 1
              ? 'Calculating ability signature...'
              : 'Recording response...'}
          </p>
        )}

        {error && (
          <p
            style={{
              marginTop: '1rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.58rem',
              color: 'var(--accent)',
            }}
          >
            {error}
          </p>
        )}
        </section>
      </main>
    </>
  )
}
