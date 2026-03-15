import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { ensureProfile } from '@/backend/controllers/auth.controller'
import { resolvePostAuthPath } from '@/frontend/lib/launch'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    // No OAuth code — likely a magic-link/email redirect. Return a minimal bridge
    // that ensures the Supabase client handles the hash fragment, persists the session,
    // and correctly redirects the user.
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Authorizing...</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; }
      .box { text-align: center; }
      .loader { border: 2px solid #eee; border-top: 2px solid #333; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="loader"></div>
      <div>Processing sign-in...</div>
    </div>

    <script type="module">
      import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
      const SUPABASE_URL = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL)}
      const SUPABASE_ANON = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
      const BASE = ${JSON.stringify(process.env.NEXT_PUBLIC_BASE_URL || '')}

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })

      async function processAuth() {
        try {
          // Poll up to 3 seconds for session hash detection
          let session = null
          for (let i = 0; i < 6; i++) {
            const res = await supabase.auth.getSession()
            if (res.data.session) {
              session = res.data.session
              break
            }
            await new Promise(r => setTimeout(r, 500))
          }

          if (!session) {
             window.location.replace(BASE || '/')
             return
          }

          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          const json = await res.json().catch(() => ({}))
          
          const profile = json.data
          const dest = profile && profile.username ? '/profile/' + profile.username : '/onboarding/username'
          window.location.replace((BASE || '') + dest)
          
        } catch (e) {
          console.error(e)
          window.location.replace(BASE || '/')
        }
      }

      processAuth()
    </script>
  </body>
</html>`

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  // OAuth Code Exchange
  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[oauth_callback] exchange error:', error)
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
