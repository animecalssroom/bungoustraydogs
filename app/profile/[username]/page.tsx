import { Footer } from '@/frontend/components/ui/Footer'
import { Nav } from '@/frontend/components/ui/Nav'
import { UserModel } from '@/backend/models/user.model'
import { createClient } from '@/frontend/lib/supabase/server'
import { ProfileExperience } from '@/frontend/components/profile/ProfileExperience'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const profile = await UserModel.getByUsername(params.username)
  if (!profile) {
    return (
      <ErrorBoundary>
        <Nav />
        <main
          style={{
            paddingTop: '60px',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            className="font-cormorant"
            style={{
              fontStyle: 'italic',
              color: 'var(--text3)',
              fontSize: '1.1rem',
            }}
          >
            No record found for this user.
          </p>
        </main>
        <Footer />
      </ErrorBoundary>
    )
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const initialEvents =
    user?.id === profile.id ? await UserModel.getRecentEvents(profile.id, 50) : []
  return (
    <ErrorBoundary>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <div
          className="section-wrap"
          style={{ paddingTop: 'clamp(2rem, 5vw, 4rem)', paddingBottom: '5rem' }}
        >
          <ProfileExperience
            initialProfile={profile}
            initialEvents={initialEvents}
            viewerUserId={user?.id ?? null}
          />
        </div>
      </main>
      <Footer />
    </ErrorBoundary>
  )
}
