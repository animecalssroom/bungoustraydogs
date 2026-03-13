import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Duel } from '@/backend/types'

export default async function OwnerDuelsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'owner') {
    redirect('/')
  }

  const { data } = await supabaseAdmin
    .from('duels')
    .select('id, challenger_character, defender_character, status, current_round, accepted_at, completed_at, created_at')
    .in('status', ['pending', 'active', 'complete', 'forfeit'])
    .order('created_at', { ascending: false })
    .limit(50)

  const duels = (data as Array<
    Pick<Duel, 'id' | 'challenger_character' | 'defender_character' | 'status' | 'current_round' | 'accepted_at' | 'completed_at' | 'created_at'>
  > | null) ?? []

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <section className="section-wrap" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <div className="paper-surface" style={{ padding: '1.5rem' }}>
            <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
              Owner Duel Monitor
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              {duels.map((duel) => (
                <div key={duel.id} className="paper-surface" style={{ padding: '0.95rem 1rem', display: 'grid', gap: '0.45rem' }}>
                  <div className="font-cinzel" style={{ fontSize: '1.1rem' }}>
                    {duel.challenger_character ?? 'Operative'} vs {duel.defender_character ?? 'Operative'}
                  </div>
                  <div className="font-space-mono" style={{ fontSize: '0.55rem', color: 'var(--text3)' }}>
                    {duel.status} · round {Math.max(duel.current_round, 1)} · opened {new Date(duel.created_at).toLocaleString()}
                  </div>
                  <Link href={`/duels/${duel.id}`} className="btn-secondary" style={{ width: 'fit-content' }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
