import { DistrictModel } from '@/backend/models/district.model'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { DistrictsClient } from './DistrictsClient'

export const dynamic = 'force-dynamic'

export default async function DistrictsPage() {
  const [districts, activeWars] = await Promise.all([
    DistrictModel.getAll(),
    FactionWarModel.getActiveWars()
  ])

  return (
    <DistrictsClient 
      initialDistricts={districts} 
      activeWars={activeWars} 
    />
  )
}
