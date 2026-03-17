import { DistrictModel } from '@/backend/models/district.model'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { DistrictsClient } from './DistrictsClient'

export const dynamic = 'force-dynamic'

export default async function DistrictsPage() {
  const [districts, activeWar] = await Promise.all([
    DistrictModel.getAll(),
    FactionWarModel.getActiveWar()
  ])

  let topContributors: { user_id: string; username: string; rank: number; points: number; faction: string }[] = []
  if (activeWar) {
    topContributors = await FactionWarModel.getTopContributorsDetailed(activeWar.id)
  }

  return (
    <DistrictsClient 
      initialDistricts={districts} 
      activeWar={activeWar} 
      topContributors={topContributors}
    />
  )
}
