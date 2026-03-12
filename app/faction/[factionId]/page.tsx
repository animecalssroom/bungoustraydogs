import { redirect } from 'next/navigation'
import type { Profile } from '@/backend/types'
import { FactionModel } from '@/backend/models/faction.model'
import { FactionSpaceModel } from '@/backend/models/faction-space.model'
import { RegistryModel } from '@/backend/models/registry.model'
import { Footer } from '@/frontend/components/ui/Footer'
import { Nav } from '@/frontend/components/ui/Nav'
import { FactionCheckIn } from '@/frontend/components/ui/FactionCheckIn'
import { FactionPrivateSpace } from '@/frontend/components/faction/FactionPrivateSpace'
import {
  normalizePrivateFactionRouteId,
  privateFactionPath,
} from '@/frontend/lib/launch'
import { createClient } from '@/frontend/lib/supabase/server'

async function getViewerProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile | null) ?? null
}

export default async function FactionPrivateSpacePage({
  params,
}: {
  params: { factionId: string }
}) {
  const factionId = normalizePrivateFactionRouteId(params.factionId)

  if (!factionId) {
    redirect('/')
  }

  const profile = await getViewerProfile()

  if (!profile) {
    redirect('/login')
  }

  const canAccess =
    profile.role === 'owner' ||
    ((profile.role === 'member' || profile.role === 'mod') && profile.faction === factionId)

  if (!canAccess) {
    redirect('/')
  }

  const [space, bulletins, activity, messages, warFactions, pendingRegistryPosts] = await Promise.all([
    FactionSpaceModel.getSpace(factionId),
    FactionSpaceModel.getBulletins(factionId),
    FactionSpaceModel.getActivity(factionId),
    FactionSpaceModel.getMessages(factionId),
    FactionModel.getAll(),
    RegistryModel.getPendingForFaction(factionId, profile),
  ])

  if (!space) {
    redirect(privateFactionPath(profile.faction ?? factionId))
  }

  return (
    <>
      <Nav />
      <FactionCheckIn factionId={factionId} />
      <FactionPrivateSpace
        factionId={factionId}
        profile={profile}
        initialBulletins={bulletins}
        initialActivity={activity}
        initialRoster={space.members}
        initialMessages={messages}
        initialWarFactions={warFactions}
        initialPendingRegistryPosts={pendingRegistryPosts}
      />
      <Footer />
    </>
  )
}
