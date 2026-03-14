import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { allowFixedWindow } from '@/backend/lib/upstash'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email || '').toString().trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'

    // Simple rate limits
    const perEmailKey = `magiclink:email:${email}`
    const okEmail = await allowFixedWindow(perEmailKey, 60, 1) // 1 per 60s

    const perIpKey = `magiclink:ip:${ip}`
    const okIp = await allowFixedWindow(perIpKey, 60, 10) // 10 per 60s

    if (!okEmail) return NextResponse.json({ error: 'rate_limited_email' }, { status: 429 })
    if (!okIp) return NextResponse.json({ error: 'rate_limited_ip' }, { status: 429 })

    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/auth/callback`

    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      return NextResponse.json({ error: error.message || 'supabase_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'server_error' }, { status: 500 })
  }
}
