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
  // Fast-path: skip auth check entirely for public pages
  if (!needsAuth(request.nextUrl.pathname)) {
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
    const { error } = await supabase.auth.getUser()
    if (error?.code === 'refresh_token_not_found') {
      clearSupabaseAuthCookies(request, response)
    }
  } catch {
    clearSupabaseAuthCookies(request, response)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}