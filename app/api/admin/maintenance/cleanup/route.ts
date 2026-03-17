import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { createClient } from '@/frontend/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results = {
    messagesPruned: 0,
    bulletinsPruned: 0,
    activityPruned: 0,
  }

  try {
    // 1. Prune messages > 4 days
    const msgCutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    const { count: msgCount } = await supabaseAdmin
      .from('faction_messages')
      .delete({ count: 'exact' })
      .lt('created_at', msgCutoff)
    results.messagesPruned = msgCount ?? 0

    // 2. Prune non-pinned bulletins > 7 days
    const bulCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: bulCount } = await supabaseAdmin
      .from('faction_bulletins')
      .delete({ count: 'exact' })
      .eq('pinned', false)
      .lt('created_at', bulCutoff)
    results.bulletinsPruned = bulCount ?? 0

    // 3. Prune activity > 14 days
    const actCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { count: actCount } = await supabaseAdmin
      .from('faction_activity')
      .delete({ count: 'exact' })
      .lt('created_at', actCutoff)
    results.activityPruned = actCount ?? 0

    return NextResponse.json({
      success: true,
      results
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
