'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/client'
import { useAuth } from '@/frontend/context/AuthContext'
import { navigateToResolvedPath, resolvePostAuthPath } from '@/frontend/lib/launch'

function humanizeSchemaError(message: string) {
  if (
    message.includes('schema cache') ||
    message.includes('username_confirmed') ||
    message.includes('column')
  ) {
    return 'Your Supabase profiles table is out of date. Run backend/db/schema.sql again in the SQL editor, then reload.'
  }

  return message
}

export default function UsernameSetupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user, profile, loading, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile?.username_confirmed) {
      navigateToResolvedPath(profile, { replace: true })
      return
    }

    setUsername(profile?.username ?? '')
  }, [loading, user, profile, router])

  const remaining = 20 - username.length

  const save = async () => {
    const next = username.trim()
    setError('')

    if (next.length < 3 || next.length > 20) {
      setError('Use 3 to 20 characters.')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(next)) {
      setError('Only letters, numbers, and underscores are allowed.')
      return
    }

    if (!user) {
      router.replace('/login')
      return
    }

    setSaving(true)

    const { data: duplicate } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', next)
      .neq('id', user.id)
      .maybeSingle()

    if (duplicate) {
      setError('That name is already recorded in Yokohama.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: next,
        username_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError(humanizeSchemaError(updateError.message))
      setSaving(false)
      return
    }

    await refreshProfile()
    router.replace('/onboarding/quiz')
  }

  if (loading) {
    return null
  }

  return (
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
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '3rem 2.5rem',
          border: '1px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        <p
          style={{
            fontFamily: 'Noto Serif JP, serif',
            fontSize: '0.62rem',
            letterSpacing: '0.36em',
            color: 'var(--accent)',
            marginBottom: '0.9rem',
            textAlign: 'center',
          }}
        >
          横浜登録
        </p>
        <h1
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--text)',
            textAlign: 'center',
            marginBottom: '0.8rem',
          }}
        >
          Choose your name in Yokohama.
        </h1>
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.05rem',
            fontStyle: 'italic',
            color: 'var(--text2)',
            textAlign: 'center',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          This is how the city will know you.
        </p>

        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          maxLength={20}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.05rem',
            outline: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.65rem',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            color: 'var(--text4)',
          }}
        >
          <span>Letters, numbers, underscores only.</span>
          <span>{remaining}</span>
        </div>

        {error && (
          <p
            style={{
              marginTop: '1rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.6rem',
              color: 'var(--accent)',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.5rem' }}
        >
          {saving ? 'Recording...' : 'Continue to Assignment'}
        </button>
      </section>
    </main>
  )
}
