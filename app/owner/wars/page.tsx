import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { FactionModel } from '@/backend/models/faction.model'
import { OwnerWarsPanel } from '@/frontend/components/owner/OwnerWarsPanel'
import { revalidatePath } from 'next/cache'

export default async function OwnerWarsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/')

  const [activeWar, factions] = await Promise.all([
    FactionWarModel.getActiveWar(),
    FactionModel.getAll()
  ])

  async function declareWarAction(params: any) {
    'use server'
    await FactionWarModel.startWar({
      factionA: params.factionA,
      factionB: params.factionB,
      stakes: params.stakes,
      stakesDetail: { description: params.stakesDetail },
      warMessage: params.warMessage
    })
    revalidatePath('/owner/wars')
  }

  async function transitionDayAction(warId: string, day: 'day2' | 'day3') {
    'use server'
    await FactionWarModel.transitionToDay(warId, day)
    revalidatePath('/owner/wars')
  }

  async function resolveWarAction(warId: string) {
    'use server'
    await FactionWarModel.resolveWar(warId)
    revalidatePath('/owner/wars')
  }

  async function activateBossAction(warId: string) {
    'use server'
    await FactionWarModel.activateBoss(warId)
    revalidatePath('/owner/wars')
  }

  return (
    <div className="section-wrap" style={{ paddingTop: '8rem' }}>
      <OwnerWarsPanel 
        activeWar={activeWar}
        factions={factions}
        onDeclareWar={declareWarAction}
        onTransitionDay={transitionDayAction}
        onActivateBoss={activateBossAction}
        onResolveWar={resolveWarAction}
      />
    </div>
  )
}
