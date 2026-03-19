import { NextRequest, NextResponse } from 'next/server'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) return auth

  // 2. Must be a mod or owner
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, faction')
    .eq('id', auth.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  if (!['mod', 'owner'].includes(profile.role)) {
    return NextResponse.json(
      { error: 'Only faction mods and the owner can declare wars.' },
      { status: 403 }
    )
  }

  if (!profile.faction) {
    return NextResponse.json(
      { error: 'You must belong to a faction to declare war.' },
      { status: 403 }
    )
  }

  // 3. Parse body
  let body: { targetFactionId?: string; districtId?: string; warMessage?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { targetFactionId, districtId, warMessage } = body

  if (!targetFactionId || !districtId) {
    return NextResponse.json(
      { error: 'targetFactionId and districtId are required.' },
      { status: 400 }
    )
  }

  // 4. Can't declare war on yourself
  if (targetFactionId === profile.faction) {
    return NextResponse.json(
      { error: 'You cannot declare war on your own faction.' },
      { status: 400 }
    )
  }

  // 5. Check target faction exists
  const { data: targetFaction } = await supabaseAdmin
    .from('factions')
    .select('id, name')
    .eq('id', targetFactionId)
    .single()

  if (!targetFaction) {
    return NextResponse.json({ error: 'Target faction not found.' }, { status: 404 })
  }

  // 6. Check district exists and is owned by target
  const { data: district } = await supabaseAdmin
    .from('districts')
    .select('id, name, controlling_faction')
    .or(`id.eq.${districtId},slug.eq.${districtId}`)
    .maybeSingle()

  if (!district) {
    return NextResponse.json({ error: 'District not found.' }, { status: 404 })
  }

  if (district.controlling_faction !== targetFactionId) {
    return NextResponse.json(
      { error: `The target district (${district.name}) is not currently held by the target faction.` },
      { status: 400 }
    )
  }

  // 6.5 Check for existing war on this district (Concurrent Conflict Lock)
  const { data: existingWar } = await supabaseAdmin
    .from('faction_wars')
    .select('id')
    .eq('stakes', 'district')
    .contains('stakes_detail', { district_id: district.id })
    .neq('status', 'complete')
    .maybeSingle()

  if (existingWar) {
    return NextResponse.json(
      { error: `Conflict signature detected: ${district.name} is already a registered active warzone. Multi-front wars are restricted.` },
      { status: 403 }
    )
  }

  // 7. Declare the war
  try {
    const war = await FactionWarModel.startWar({
      factionA: profile.faction,
      factionB: targetFactionId,
      initiatorId: auth.user.id,
      stakes: 'district',
      stakesDetail: {
        district_id: district.id,
        description: `Control of ${district.name}`,
      },
      warMessage:
        warMessage?.trim() ||
        `${profile.faction.toUpperCase()} challenges ${targetFactionId.toUpperCase()} for control of ${district.name}.`,
    })

    return NextResponse.json({ success: true, war })
  } catch (err: any) {
    console.error('[API/War/Declare]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to declare war.' },
      { status: 500 }
    )
  }
}
