// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type CharacterProfile = {
  slug: string
  name: string
  faction: string
  ability_name: string | null
  ability_name_jp: string | null
  ability_type: string | null
  trait_power: number
  trait_intel: number
  trait_loyalty: number
  trait_control: number
}

function distance(
  scores: { power: number; intel: number; loyalty: number; control: number },
  character: CharacterProfile,
) {
  return (
    Math.abs(scores.power - character.trait_power) +
    Math.abs(scores.intel - character.trait_intel) +
    Math.abs(scores.loyalty - character.trait_loyalty) +
    Math.abs(scores.control - character.trait_control)
  )
}

function parseJson(text: string) {
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as {
    character_slug?: string
    confidence?: number
    reasoning?: string
    registry_note?: string
  }
}

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash'

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase secrets are missing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { user_id, faction } = await req.json()
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  if (faction === 'special_div') {
    return new Response(
      JSON.stringify({ error: 'Special Division is assigned by owner only.' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const [profile] = await (
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}&select=id,character_name,behavior_scores`,
      { headers },
    )
  ).json()

  if (!profile || profile.character_name) {
    return new Response(JSON.stringify({ error: 'Profile missing or already assigned.' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const reserved = await (
    await fetch(`${supabaseUrl}/rest/v1/reserved_characters?select=slug`, { headers })
  ).json()
  const reservedSlugs = new Set((reserved ?? []).map((row: { slug: string }) => row.slug))

  const rawCharacters = await (
    await fetch(
      `${supabaseUrl}/rest/v1/character_profiles?faction=eq.${faction}&select=*`,
      { headers },
    )
  ).json()

  const characters = (rawCharacters as CharacterProfile[]).filter(
    (character) => !reservedSlugs.has(character.slug),
  )

  if (!characters.length) {
    return new Response(JSON.stringify({ error: 'No assignable characters found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const scores = {
    power: profile.behavior_scores?.power ?? 0,
    intel: profile.behavior_scores?.intel ?? 0,
    loyalty: profile.behavior_scores?.loyalty ?? 0,
    control: profile.behavior_scores?.control ?? 0,
  }

  let selected = characters.sort((left, right) => distance(scores, left) - distance(scores, right))[0]
  let confidence = 0.5
  let reasoning = 'Assigned by trait-distance fallback.'
  let registryNote =
    `Ability signature confirms designation as ${selected.name}. The city registry has sealed the behavioral match.`

  if (geminiKey) {
    try {
      const prompt = [
        'You are the Yokohama ability registry for Bungou Stray Dogs.',
        `Select the best character match for a ${faction} user.`,
        `Behavior scores: power ${scores.power}, intel ${scores.intel}, loyalty ${scores.loyalty}, control ${scores.control}.`,
        ...characters.map(
          (character) =>
            `- ${character.slug}: ${character.name} | ${character.ability_type} | power ${character.trait_power} | intel ${character.trait_intel} | loyalty ${character.trait_loyalty} | control ${character.trait_control}`,
        ),
        'Return strict JSON only:',
        '{"character_slug":"slug","confidence":0.0,"reasoning":"one sentence","registry_note":"two short sentences"}',
      ].join('\n')

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      )

      if (geminiResponse.ok) {
        const json = await geminiResponse.json()
        const text = json?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('')
          .trim()

        if (text) {
          const parsed = parseJson(text)
          const matched = characters.find((character) => character.slug === parsed.character_slug)

          if (matched) {
            selected = matched
            confidence = typeof parsed.confidence === 'number' ? parsed.confidence : confidence
            reasoning = parsed.reasoning ?? reasoning
            registryNote = parsed.registry_note ?? registryNote
          }
        }
      }
    } catch {
      // Fall back to distance selection when Gemini is unavailable.
    }
  }

  const assignedAt = new Date().toISOString()

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      character_name: selected.name,
      character_match_id: selected.slug,
      character_ability: selected.ability_name,
      character_ability_jp: selected.ability_name_jp,
      character_type: selected.ability_type,
      character_description: registryNote,
      character_assigned_at: assignedAt,
    }),
  })

  // NEW: Register character in user_characters for War System tactical features
  await fetch(`${supabaseUrl}/rest/v1/user_characters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id,
      character_id: selected.slug,
      is_equipped: true
    }),
  })

  await fetch(`${supabaseUrl}/rest/v1/notifications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id,
      type: 'character_assigned',
      message: 'The city has updated your registry file.',
      payload: {
        character_slug: selected.slug,
        source: geminiKey ? 'gemini' : 'distance',
      },
    }),
  })

  await fetch(`${supabaseUrl}/rest/v1/user_events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id,
      event_type: 'character_assigned',
      ap_awarded: 0,
      faction,
      metadata: {
        character_slug: selected.slug,
        source: geminiKey ? 'gemini' : 'distance',
      },
    }),
  })

  return new Response(
    JSON.stringify({
      success: true,
      character_slug: selected.slug,
      confidence,
      reasoning,
      registry_note: registryNote,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
