import { LoreModel } from '@/backend/models/lore.model'
import { RegistryModel } from '@/backend/models/registry.model'
import { ChronicleModel } from '@/backend/models/chronicle.model'
import RecordsPageClient from './RecordsPageClient'
import { getViewerProfile } from '@/frontend/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const [lorePosts, registryPosts, chronicleEntries, profile] = await Promise.all([
    LoreModel.getAll(),
    RegistryModel.getPublic(),
    ChronicleModel.getPublished(),
    getViewerProfile()
  ])

  return (
    <RecordsPageClient
      initialTab={searchParams.tab || 'lore'}
      lorePosts={lorePosts}
      registryPosts={registryPosts}
      chronicleEntries={chronicleEntries}
      profile={profile}
    />
  )
}
