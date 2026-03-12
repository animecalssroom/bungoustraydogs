import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { ensureProfile } from '@/backend/controllers/auth.controller'
import { resolvePostAuthPath } from '@/frontend/lib/launch'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  await ensureProfile(user)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.redirect(`${origin}${resolvePostAuthPath(profile)}`)
}
