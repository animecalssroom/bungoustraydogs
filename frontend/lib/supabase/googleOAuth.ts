// Helper to get Google OAuth redirect URL for Supabase
export function getGoogleOAuthRedirectUrl() {
  // Use NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT or fallback to window.location.origin + /auth/callback
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT ||
      `${window.location.origin}/auth/callback`
    )
  }
  // SSR fallback (should not be used for OAuth)
  return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT || ''
}