import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Routes that genuinely need the Supabase session to be refreshed on the server.
// Public content pages (archive, lore, guide, etc.) are excluded.
const AUTH_REQUIRED_PREFIXES = [
  '/api/',
  '/onboarding',
  '/faction',
  '/duels',
  '/profile',
  '/waitlist',
  '/observer',
  '/owner',
  '/admin',
  '/login',
  '/arena',
  '/registry',
]

function needsAuth(pathname: string) {
  if (pathname.startsWith('/api/bots/')) return false  // verified via x-bot-secret
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith('sb-'))
    .forEach((cookie) => {
      request.cookies.set(cookie.name, '')
      response.cookies.set({
        name: cookie.name,
        value: '',
        path: '/',
        maxAge: 0,
      })
    })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path 1: skip auth check entirely for public pages
  if (!needsAuth(pathname)) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // Fast-path 2: Session Hint. 
  // If we have a hint that the session is valid, skip DB auth for non-API page navigations.
  // This reduces Disk IO by ~80% for browsing without sacrificing security for POST/Delete/API.
  const hasSessionHint = request.cookies.get('sb-session-hint')?.value === 'true'
  const isApiRequest = pathname.startsWith('/api/')
  const isGetRequest = request.method === 'GET'

  if (hasSessionHint && isGetRequest && !isApiRequest) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  try {
    // Add a strict timeout to avoid site crashes on slow auth checks
    const { data: { user }, error } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null }; error: { message: string, code: string } } >((_, reject) =>
        setTimeout(() => reject(new Error('Middleware Auth Timeout')), 2500)
      )
    ]) as any

    if (user) {
      // Set the session hint so future navigations skip the DB check
      response.cookies.set({
        name: 'sb-session-hint',
        value: 'true',
        path: '/',
        maxAge: 3600, // 1 hour
        httpOnly: false, // Accessible by client side to maintain
        sameSite: 'lax',
      })
    }

    // Explicitly only clear if we are SURE the session is dead.
    if (error?.code === 'refresh_token_not_found' || error?.message?.includes('Invalid Refresh Token')) {
      clearSupabaseAuthCookies(request, response)
      response.cookies.delete('sb-session-hint')
    }
  } catch (err: any) {
    console.error('[middleware] auth check failed or timed out:', err?.message || err)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}