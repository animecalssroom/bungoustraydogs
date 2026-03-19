import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { FactionModel } from '@/backend/models/faction.model'
import { FactionSpaceModel } from '@/backend/models/faction-space.model'
import { RegistryModel } from '@/backend/models/registry.model'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { FactionPrivateSpace } from '@/frontend/components/faction/FactionPrivateSpace'
import {
  normalizePrivateFactionRouteId,
  privateFactionPath,
} from '@/frontend/lib/launch'
import { DistrictModel, type District } from '@/backend/models/district.model'
import { getViewerProfile } from '@/frontend/lib/auth-server'


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

  // Owners might not be in a faction, but can still access for moderation/testing
  if (!profile.faction && profile.role !== 'owner') {
    redirect('/login')
  }

  const canAccess =
    profile.role === 'owner' ||
    ((profile.role === 'member' || profile.role === 'mod') && profile.faction === factionId)

  if (!canAccess) {
    redirect('/')
  }

  const [space, bulletins, activity, messages, warFactions, pendingRegistryPosts, activeWars, districts] = await Promise.all([
    FactionSpaceModel.getSpace(factionId),
    FactionSpaceModel.getBulletins(factionId),
    FactionSpaceModel.getActivity(factionId),
    FactionSpaceModel.getMessages(factionId),
    FactionModel.getAll(),
    RegistryModel.getPendingForFaction(factionId, profile),
    FactionWarModel.getActiveWars(),
    DistrictModel.getAll()
  ])

  const activeWar =
    activeWars.find(
      (war) => war.faction_a_id === factionId || war.faction_b_id === factionId,
    ) ?? null

  if (!space) {
    redirect(privateFactionPath(profile.faction ?? factionId))
  }

  async function retreatWarAction(warId: string) {
    'use server'
    if (!warId) return
    const { FactionWarModel } = await import('@/backend/models/faction-war.model')
    await FactionWarModel.retreat(warId, factionId as string)
    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/faction/${params.factionId}`)
  }
  return (
    <div style={{ paddingTop: '36px' }}>
      <FactionPrivateSpace
        factionId={factionId}
        profile={profile}
        initialBulletins={bulletins}
        initialActivity={activity}
        initialRoster={space.members}
        initialMessages={messages}
        initialWarFactions={warFactions}
        initialPendingRegistryPosts={pendingRegistryPosts}
        activeWar={activeWar}
        onRetreatWar={retreatWarAction}
        districts={districts}
      />
    </div>
  )
}

