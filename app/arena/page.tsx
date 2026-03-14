import { ArenaPageGrid } from '@/frontend/components/arena/ArenaCard'
import { createClient } from '@/frontend/lib/supabase/server'
import { ArenaModel } from '@/backend/models/arena.model'

export default async function ArenaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const initialPayload = await ArenaModel.getPayload(user?.id ?? null)

  return (
    <div style={{ paddingTop: '36px' }}>
      <div className="section-head">
        <p className="section-eyebrow">一騎打ち · 1v1 Arena</p>
        <h1 className="section-title">The <em>Reckoning</em></h1>
        <div className="ink-divider" />
        <p className="section-sub">
          Weekly matchups stay public. Only cleared faction files can vote or
          file arguments into the permanent record.
        </p>
      </div>
      <ArenaPageGrid initialPayload={initialPayload} />
    </div>
  )
}
