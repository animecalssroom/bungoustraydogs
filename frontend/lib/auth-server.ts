import { createClient } from '@/frontend/lib/supabase/server'
import { UserModel } from '@/backend/models/user.model'
import type { Profile } from '@/backend/types'

export async function getViewerUserId(): Promise<string | null> {
  const supabase = createClient()
  const userResult = await supabase.auth.getUser().catch(() => null)
  return userResult?.data.user?.id ?? null
}

export async function getViewerProfile(): Promise<Profile | null> {
  const userId = await getViewerUserId()

  if (!userId) {
    return null
  }

  return UserModel.getById(userId)
}
