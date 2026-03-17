import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Routes that genuinely need the Supabase session to be refreshed on the server.
// Public content pages (archive, lore, guide, etc.) are excluded.
const AUTH_REQUIRED_PREFIXES = [
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
  if (pathname.startsWith('/api/')) return false      // APIs handle their own requireAuth
  if (pathname.startsWith('/_next/')) return false     // next.js internals
  if (pathname === '/login') return false              // login page is entry point
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
  // If we have a hint that the session is valid, skip DB auth for GET requests.
  // This drastically reduces latency for data-heavy pages and APIs.
  const hasSessionHint = request.cookies.get('sb-session-hint')?.value === 'true'
  const isGetRequest = request.method === 'GET'

  if (hasSessionHint && isGetRequest) {
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

  /* 
   * RELIANCE: We skip the active getUser() check in the middleware. 
   * The API routes (requireAuth) and Server Components handle their own auth.
   * This middleware still ensures cookies are synced if those routes trigger a refresh.
   */
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}