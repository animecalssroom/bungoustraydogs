'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { resolvePostAuthPath } from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  padding: '3rem 2.5rem',
  border: '1px solid var(--border)',
  background: 'var(--card)',
  boxShadow: '0 24px 80px rgba(20, 8, 0, 0.08)',
}

async function loadProfileAndRoute(router: ReturnType<typeof useRouter>) {
  const supabase = createClient()
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      continue
    }

    const response = await fetch('/api/auth/me', { cache: 'no-store' })
    const json = await response.json().catch(() => ({}))

    if (response.ok && json.data) {
      router.replace(resolvePostAuthPath(json.data as Profile))
      return
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
  }

  router.push('/onboarding/username')
}

function getEmailRedirectUrl() {
  return `${window.location.origin}/auth/callback`
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('error')
    if (value) {
      setError(value)
    }
  }, [])


  // Google OAuth removed

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    setNotice('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    await loadProfileAndRoute(router)
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    setNotice('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
        data: {
          name: email.split('@')[0],
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setNotice(
        'Your file was created, but Supabase is waiting on email confirmation. Check your inbox, verify the address, then sign in.',
      )
      setLoading(false)
      return
    }

    await loadProfileAndRoute(router)
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Enter the email address you signed up with first.')
      return
    }

    setResending(true)
    setError('')

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
      },
    })

    if (resendError) {
      setError(resendError.message)
      setResending(false)
      return
    }

    setNotice('Confirmation mail sent again. Check inbox, spam, and promotions.')
    setResending(false)
  }

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background:
            'radial-gradient(circle at top, rgba(212, 134, 31, 0.16), transparent 35%), var(--bg)',
          padding: '96px 24px 32px',
        }}
      >
        <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p
            style={{
              fontFamily: 'Noto Serif JP, serif',
              fontSize: '0.62rem',
              letterSpacing: '0.38em',
              color: 'var(--accent)',
              marginBottom: '0.9rem',
            }}
          >
            文豪アーカイブ
          </p>
          <h1
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '0.8rem',
              lineHeight: 1.1,
            }}
          >
            The city of Yokohama requires identification.
          </h1>
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            横浜は、いつも雨が降っている。
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.9rem' }}>

          {/* Google OAuth button and divider removed */}

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1rem',
              outline: 'none',
            }}
          />

          {mode === 'signup' && (
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              type="password"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          )}

          {error && (
            <p
              style={{
                color: 'var(--accent)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.06em',
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <p
                style={{
                  color: 'var(--text2)',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                {notice}
              </p>
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => void handleResendConfirmation()}
                  disabled={resending || loading}
                  className="btn-secondary"
                  style={{ width: '100%' }}
                >
                  {resending ? 'Resending...' : 'Resend Confirmation Email'}
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => void (mode === 'login' ? handleLogin() : handleSignup())}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
                ? 'Enter the Archive'
                : 'Create Your File'}
          </button>
        </div>

        <p
          style={{
            marginTop: '1.4rem',
            textAlign: 'center',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1rem',
            color: 'var(--text3)',
          }}
        >
          {mode === 'login' ? 'No file yet?' : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setNotice('')
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>

        <p
          style={{
            marginTop: '0.85rem',
            textAlign: 'center',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.08em',
            color: 'var(--text4)',
          }}
        >
          Public browsing is always open. Your Yokohama name is chosen on the next step.
        </p>

        <p
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.95rem',
            color: 'var(--text3)',
          }}
        >
          Or keep reading the file walls from the{' '}
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            public archive
          </Link>
          .
        </p>
        </div>
      </main>
    </>
  )
}
