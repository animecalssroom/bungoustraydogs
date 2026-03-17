import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validate } from '@/backend/middleware/validate'
import { UserModel } from '@/backend/models/user.model'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
})

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRefreshLastSeen(value: string | null | undefined) {
  if (!value) {
    return true
  }

  return Date.now() - new Date(value).getTime() > 15 * 60 * 1000
}

export async function ensureProfile(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const fallbackUsername = String(
    user.user_metadata?.preferred_username ??
    user.user_metadata?.user_name ??
    user.user_metadata?.name ??
    (user.email ? user.email.split('@')[0] : `file_${user.id.slice(0, 8)}`),
  )
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 20) || `file_${user.id.slice(0, 8)}`
  const now = new Date().toISOString()

  const normalizeError = (message: string) => {
    if (message.includes('schema cache') || message.includes('column')) {
      console.error('ensureProfile schema error:', message)
      throw new Error(
        `Supabase profiles schema is out of date. Run backend/db/schema.sql in the SQL editor and try again. Underlying error: ${message}`,
      )
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, avatar_url, last_seen')
      .eq('id', user.id)
      .maybeSingle()

    if (existingError) {
      normalizeError(existingError.message)
      throw new Error(existingError.message)
    }

    if (existing) {
      console.log(`[ensureProfile] Found existing profile for ${user.id}`)
      const updatePayload: Record<string, string | null | any> = {}
      const nextEmail = user.email ?? ''
      const nextAvatar = (user.user_metadata?.avatar_url as string | undefined) ?? null

      if (!existing.username?.trim()) {
        updatePayload.username = fallbackUsername
      }
      if (existing.email !== nextEmail) {
        updatePayload.email = nextEmail
      }
      if ((existing.avatar_url ?? null) !== nextAvatar) {
        updatePayload.avatar_url = nextAvatar
      }
      if (shouldRefreshLastSeen(existing.last_seen)) {
        updatePayload.last_seen = now
      }

      if (Object.keys(updatePayload).length === 0) return

      updatePayload.updated_at = now

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)

      if (!updateError) {
        await UserModel.invalidateCache(user.id)
        return
      }

      normalizeError(updateError.message)
      throw new Error(updateError.message)
    }

    console.log(`[ensureProfile] Creating new profile for ${user.id}`)
    const { error } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      username: fallbackUsername,
      username_confirmed: false,
      email: user.email ?? '',
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      role: 'waitlist',
      theme: 'light',
      bio: null,
      faction: null,
      character_match_id: null,
      quiz_completed: false,
      quiz_locked: false,
      assignment_flag_used: false,
      ap_total: 0,
      rank: 1,
      login_streak: 0,
      last_seen: now,
      updated_at: now,
    })

    if (!error) {
      console.log(`[ensureProfile] Successfully created profile for ${user.id}`)
      await UserModel.invalidateCache(user.id)
      return
    }

    normalizeError(error.message)

    const isForeignKeyRace =
      error.code === '23503' ||
      error.message.includes('profiles_id_fkey') ||
      error.message.includes('violates foreign key constraint')

    if (isForeignKeyRace && attempt < 4) {
      await delay(250 * (attempt + 1))
      continue
    }

    throw new Error(error.message)
  }
}

export const AuthController = {
  async login(req: NextRequest) {
    const body = await req.json().catch(() => null)
    console.log('[AuthController] Login attempt for:', body?.email)
    const result = validate(LoginSchema, body)
    if (!result.success) {
      console.log('[AuthController] Validation failed')
      return result.response
    }

    const supabase = createClient()
    console.log('[AuthController] Signing in with password...')
    const { error } = await supabase.auth.signInWithPassword(result.data)

    if (error) {
      console.log('[AuthController] Sign in error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log('[AuthController] Sign in successful, fetching user...')
    const {
      data: { user },
    } = await supabase.auth.getUser()

    try {
      if (user) {
        console.log('[AuthController] Ensuring profile for user:', user.id)
        await ensureProfile(user)
        console.log('[AuthController] Profile ensured.')
      }
    } catch (profileError) {
      console.error('[AuthController] Profile ensure error:', profileError)
      return NextResponse.json(
        {
          error:
            profileError instanceof Error
              ? profileError.message
              : 'Failed to sync profile',
        },
        { status: 500 },
      )
    }

    console.log('[AuthController] Login sequence complete.')
    return NextResponse.json({ data: { success: true } })
  },

  async signup(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const result = validate(SignupSchema, body)
    if (!result.success) return result.response

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          preferred_username: result.data.username ?? null,
          name: result.data.username ?? result.data.email.split('@')[0],
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { success: true } })
  },

  async signout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ data: { success: true } })
  },

  async me() {
    const supabase = createClient()
    const start = Date.now()
    
    let userResult
    try {
      userResult = await supabase.auth.getUser()
    } catch (e: any) {
      console.error(`[auth:me] getUser CRITICAL ERROR:`, e)
      return NextResponse.json({ error: 'Connection failed', details: e.message }, { status: 503 })
    }

    const { data: { user }, error } = userResult

    console.log(`[auth:me] getUser took ${Date.now() - start}ms. User: ${user?.id || 'null'}, Error: ${error?.message || 'none'}`)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const profileStart = Date.now()
    try {
      const profile = await UserModel.getById(user.id)
      console.log(`[auth:me] getProfile took ${Date.now() - profileStart}ms`)

      if (!profile) {
        console.warn(`[auth:me] profile missing for user ${user.id}`)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      return NextResponse.json({ data: profile })
    } catch (e: any) {
      console.error(`[auth:me] Profile fetch error:`, e)
      return NextResponse.json({ error: 'Data fetch failed', details: e.message }, { status: 500 })
    }
  },
}
