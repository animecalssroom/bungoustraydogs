import { redirect } from 'next/navigation'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelInboxClient } from '@/components/duels/DuelInboxClient'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { getViewerUserId } from '@/frontend/lib/auth-server'

export default async function DuelInboxPage() {
  const userId = await getViewerUserId()

  if (!userId) {
    redirect('/login')
  }

  const inbox = await DuelModel.getInbox(userId)

  await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
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
