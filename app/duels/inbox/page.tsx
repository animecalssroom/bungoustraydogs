import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelInboxClient } from '@/components/duels/DuelInboxClient'
import { supabaseAdmin } from '@/backend/lib/supabase'

export default async function DuelInboxPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const inbox = await DuelModel.getInbox(user.id)

  await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('type', 'duel_challenge')
    .is('read_at', null)

  return (
    <div style={{ paddingTop: '36px' }}>
      <section className="section-wrap" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
        <DuelInboxClient initialIncoming={inbox.incoming} initialOutgoing={inbox.outgoing} />
      </section>
    </div>
  )
}
