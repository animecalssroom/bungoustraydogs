import { redirect } from 'next/navigation'
import type { FactionId } from '@/backend/types'
import { privateFactionPath } from '@/frontend/lib/launch'

export default async function FactionHubPage({
  params,
}: {
  params: { id: string }
}) {
  const factionId = params.id as FactionId
  redirect(privateFactionPath(factionId))
}
