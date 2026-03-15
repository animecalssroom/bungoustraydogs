import { createClient } from '@/frontend/lib/supabase/server'
import type { Profile } from '@/backend/types'

export async function getViewerProfile(): Promise<Profile | null> {
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
