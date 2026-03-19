import { unstable_noStore as noStore } from 'next/cache'
import { UserModel } from '@/backend/models/user.model'
import { AngoProfileAction } from '@/frontend/components/ango/AngoProfileAction'
import { ProfileExperience } from '@/frontend/components/profile/ProfileExperience'
import { ProfileViewPing } from '@/frontend/components/profile/ProfileViewPing'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'
import { getViewerUserId } from '@/frontend/lib/auth-server'

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  noStore()
  const profile = await UserModel.getByUsername(params.username)
  if (!profile) {
    return (
      <ErrorBoundary>
        <div
          style={{
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
        </div>
      </ErrorBoundary>
    )
  }
  const viewerUserId = await getViewerUserId()
  const initialEvents =
    viewerUserId === profile.id ? await UserModel.getRecentEvents(profile.id, 50) : []
  return (
    <ErrorBoundary>
      <ProfileViewPing
        username={profile.username}
        isOwnProfile={viewerUserId === profile.id}
      />
      <div
        className="section-wrap"
        style={{ paddingTop: 'clamp(2rem, 5vw, 4rem)', paddingBottom: '5rem' }}
      >
        <ProfileExperience
          initialProfile={profile}
          initialEvents={initialEvents}
          viewerUserId={viewerUserId}
        />
        <AngoProfileAction
          profile={profile}
          isOwnProfile={viewerUserId === profile.id}
        />
      </div>
    </ErrorBoundary>
  )
}
