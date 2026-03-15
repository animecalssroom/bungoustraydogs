import { RegistryModel } from '@/backend/models/registry.model'
import RegistryPageClient from './RegistryPageClient'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const posts = await RegistryModel.getPublic()
  return <RegistryPageClient posts={posts} />
}
