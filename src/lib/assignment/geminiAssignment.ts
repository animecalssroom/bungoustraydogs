const RESERVED_SLUGS = new Set([
  'mori-ogai', 'yukichi-fukuzawa', 'francis-fitzgerald',
  'fukuchi-ouchi', 'fyodor-dostoevsky', 'nikolai-gogol',
  'ango-sakaguchi', 'sakunosuke-oda',
])

export async function assignCharacterWithGemini(data: {
  compositeVector: Record<string, number>
  loreTopics: string[]
  duelStyle: { gambit: number; strike: number; stance: number }
  avgMoveSpeed: number | null
  writingSample: string | null
  recentEvents: string[]
  quizDominantTrait: string | null
  faction: string | null
}): Promise<{ slug: string; name: string; ability?: string; ability_jp?: string; description?: string; type?: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const speedLabel =
    data.avgMoveSpeed === null ? 'unknown' :
    data.avgMoveSpeed < 3  ? 'fast/impulsive' :
    data.avgMoveSpeed > 15 ? 'slow/deliberate' : 'measured'

  const prompt = `You are the Yokohama Ability Registry character matching system.

A user in faction "${data.faction}" has reached the event threshold. Match them to a character.

USER TRAIT VECTOR (1–10 scale):
Justice: ${data.compositeVector.justice?.toFixed(1)}
Power Style: ${data.compositeVector.power?.toFixed(1)}
Social Role: ${data.compositeVector.social?.toFixed(1)}
Emotional Drive: ${data.compositeVector.emotion?.toFixed(1)}
World View: ${data.compositeVector.world?.toFixed(1)}
Identity: ${data.compositeVector.identity?.toFixed(1)}
Method: ${data.compositeVector.method?.toFixed(1)}
Loyalty: ${data.compositeVector.loyalty?.toFixed(1)}

BEHAVIORAL DATA:
- Most read characters: ${data.loreTopics.join(', ') || 'none'}
- Duel style: gambit=${data.duelStyle.gambit}, strike=${data.duelStyle.strike}, stance=${data.duelStyle.stance}
- Move speed: ${speedLabel}
- Writing sample: ${data.writingSample ?? 'none available'}
- Recent activity: ${data.recentEvents.join(', ')}
- Dominant quiz trait: ${data.quizDominantTrait ?? 'none'}

AVAILABLE CHARACTERS (slugs only — match to one of these):
nakajima-atsushi, osamu-dazai, doppo-kunikida, ranpo-edogawa, akiko-yosano,
junichiro-tanizaki, kyouka-izumi, kenji-miyazawa, edgar-allan-poe,
nakahara-chuuya, ryunosuke-akutagawa, kouyou-ozaki, gin-akutagawa,
ichiyo-higuchi, michizou-tachihara, lucy-montgomery, john-steinbeck,
herman-melville, mark-twain, louisa-may-alcott, teruko-okura,
tetchou-suehiro, saigiku-jouno, minoura-motoji, alexander-pushkin,
ivan-goncharov, sigma, bram-stoker, agatha-christie, rudyard-kipling, oscar-wilde

RULES:
- You MUST choose a character from the faction "${data.faction}" unless no good match exists there
- NEVER return: mori-ogai, yukichi-fukuzawa, francis-fitzgerald, fukuchi-ouchi, fyodor-dostoevsky, nikolai-gogol, ango-sakaguchi, sakunosuke-oda
- Return ONLY valid JSON. No markdown. No explanation.

Return exactly this JSON:
{"slug": "character-slug-here"}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      },
    )

    if (!res.ok) return null

    const json = await res.json()
    const raw = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '').join('').trim()
    if (!raw) return null

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { slug: string }
    const slug = parsed.slug?.toLowerCase().trim()

    if (!slug || RESERVED_SLUGS.has(slug)) return null

    // Fetch character details from DB
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    const { data: charData } = await supabaseAdmin
      .from('character_profiles')
      .select('slug, name, ability_name, ability_name_jp, ability_desc, ability_type')
      .eq('slug', slug)
      .maybeSingle()

    if (!charData) return null

    return {
      slug: charData.slug,
      name: charData.name,
      ability: charData.ability_name ?? undefined,
      ability_jp: charData.ability_name_jp ?? undefined,
      description: charData.ability_desc ?? undefined,
      type: charData.ability_type ?? undefined,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
