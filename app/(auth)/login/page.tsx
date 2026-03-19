'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { resolvePostAuthPath } from '@/frontend/lib/launch'
import { getGoogleOAuthRedirectUrl } from '@/frontend/lib/supabase/googleOAuth'

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  padding: '3rem 2.5rem',
  border: '1px solid var(--border)',
  background: 'var(--card)',
  boxShadow: '0 24px 80px rgba(20, 8, 0, 0.08)',
}

async function loadProfileAndRoute(router: ReturnType<typeof useRouter>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch('/api/auth/me', { cache: 'no-store' })
    const json = await response.json().catch(() => ({}))

    if (response.ok && json.data) {
      router.replace(resolvePostAuthPath(json.data as Profile))
      return
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
  }

  router.push('/login?error=session_sync_failed')
}

function getEmailRedirectUrl() {
  return `${window.location.origin}/auth/callback`
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m = params.get('mode')
    if (m === 'signup' || m === 'login') setMode(m)
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('error')
    if (value) {
      setError(value)
    }
  }, [])

  const handleGoogleOAuth = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getGoogleOAuthRedirectUrl(),
        },
      })
      if (error) setError(error.message)
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleEmailSign = async () => {
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Failed to send link')
        setLoading(false)
        return
      }

      setNotice('Check your email for a sign-in link.')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Enter the email address first.')
      return
    }

    setResending(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getEmailRedirectUrl() },
    })

    if (authError) {
      setError(authError.message)
      setResending(false)
      return
    }

    setNotice('Sign-in link sent. Check inbox and spam.')
    setResending(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    if (!password) {
      await handleEmailSign()
      setLoading(false)
      return
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Login failed')
        setLoading(false)
        return
      }

      await loadProfileAndRoute(router)
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    if (password && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!password) {
      await handleEmailSign()
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Signup failed')
        setLoading(false)
        return
      }

      setNotice('Account created. Check your email for verification or sign-in link.')
      setMode('login')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top, rgba(212, 134, 31, 0.16), transparent 35%), var(--bg)',
        padding: '36px 24px 32px',
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
          <p style={{ marginTop: '0.6rem', color: 'var(--accent)', fontWeight: 600 }}>
            Sign in with Google or request a magic link to your email.
          </p>
        </div>


        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={googleLoading || loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: '#fff',
              border: '1px solid var(--border)',
              color: '#222',
              fontFamily: 'Space Mono, monospace',
              fontSize: '1rem',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.7em',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" style={{ verticalAlign: 'middle' }}><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.81.858 6.646 2.277l6.418-6.418C33.684 6.163 29.084 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z" /><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c2.507 0 4.81.858 6.646 2.277l6.418-6.418C33.684 6.163 29.084 4 24 4c-7.732 0-14.313 4.388-17.694 10.691z" /><path fill="#FBBC05" d="M24 44c5.356 0 10.207-1.843 13.994-4.994l-6.481-5.307C29.418 35 24 35 24 35c-5.418 0-9.962-2.917-11.303-7.083l-6.571 5.081C9.687 39.612 16.268 44 24 44z" /><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.62 32.254 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.81.858 6.646 2.277l6.418-6.418C33.684 6.163 29.084 4 24 4c-7.732 0-14.313 4.388-17.694 10.691z" /></g></svg>
            {googleLoading ? 'Redirecting...' : `Continue with Google`}
          </button>
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.9em', margin: '0.5em 0' }}>or</div>

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
            placeholder="Password (Optional)"
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
              marginTop: '0.5rem',
            }}
          />

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
                ? 'Sign In'
                : 'Create Account'}
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
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
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
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
