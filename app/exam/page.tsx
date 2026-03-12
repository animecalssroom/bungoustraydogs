'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EXAM_RETAKE_COST, getExamRetakeStatus } from '@/backend/lib/exam-retake'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { useAuth } from '@/frontend/context/AuthContext'

export default function ExamPage() {
  const router = useRouter()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, router, user])

  if (!loading && !user) return null

  if (!loading && user && !profile) {
    return null
  }

  const retake = profile ? getExamRetakeStatus(profile) : null

  const beginRetake = async () => {
    setSubmitting(true)
    setError('')

    const response = await fetch('/api/exam/retake', {
      method: 'POST',
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to open the retake desk.')
      setSubmitting(false)
      return
    }

    await refreshProfile()
    window.location.assign(json.data?.redirectTo ?? '/onboarding/quiz?retake=1')
  }

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          paddingTop: '60px',
          background: 'var(--bg)',
          paddingInline: '24px',
        }}
      >
        <section
          className="paper-surface"
          style={{
            width: '100%',
            maxWidth: '760px',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            Examination Desk
          </div>
          <h1
            className="font-cinzel"
            style={{
              marginTop: '1rem',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.05,
            }}
          >
            Registry Retake
          </h1>
          <p
            className="font-cormorant"
            style={{
              marginTop: '1rem',
              fontSize: '1.15rem',
              lineHeight: 1.75,
              fontStyle: 'italic',
              color: 'var(--text2)',
            }}
          >
            {retake?.retakeInProgress
              ? 'A retake is already open for this file. Continue the quiz to finish the revised evaluation.'
              : retake?.canRetake
                ? `Opening the retake desk spends ${EXAM_RETAKE_COST} AP and sends you back through the seven-question exam. The city then averages the new result with your original record.`
                : retake?.alreadyUsed
                  ? 'This file has already used its one retake.'
                  : retake?.eligibleAt
                    ? `Retake access opens ${retake.eligibleAt.toLocaleString()}.`
                    : 'This file is not eligible for a retake right now.'}
          </p>

          {retake && !retake.canRetake && !retake.retakeInProgress && !retake.alreadyUsed ? (
            <p
              className="font-space-mono"
              style={{
                marginTop: '1rem',
                fontSize: '0.55rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text4)',
              }}
            >
              {retake.apShortfall > 0
                ? `${retake.apShortfall} AP still required.`
                : 'Thirty-day wait requirement still active.'}
            </p>
          ) : null}

          {error ? (
            <p
              className="font-space-mono"
              style={{
                marginTop: '1rem',
                fontSize: '0.55rem',
                color: 'var(--accent)',
              }}
            >
              {error}
            </p>
          ) : null}

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {retake?.retakeInProgress ? (
              <a href="/onboarding/quiz?retake=1" className="btn-primary">
                Continue Retake
              </a>
            ) : retake?.canRetake ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => void beginRetake()}
                disabled={submitting}
              >
                {submitting ? 'Opening...' : 'Spend 500 AP And Begin'}
              </button>
            ) : null}
            <a href="/" className="btn-secondary">
              Return To Archive
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
