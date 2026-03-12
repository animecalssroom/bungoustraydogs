import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { sanitizeMultilineText } from '@/backend/lib/input-safety'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { getRankTitle, type GuideBotMessage, type Profile } from '@/backend/types'

const GUIDE_BOT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const DAILY_QUERY_LIMIT = 5
const FALLBACK_TEXT = `Registry terminal is experiencing interference.
Open /tickets and file a registry ticket.`

const RANK_TITLES_BY_FACTION: Record<string, Array<{ ap: number; title: string }>> = {
  agency: [
    { ap: 0, title: 'Unaffiliated Detective' },
    { ap: 100, title: 'Field Operative' },
    { ap: 500, title: 'Senior Operative' },
    { ap: 1500, title: 'Lead Detective' },
    { ap: 4000, title: 'Special Investigator' },
    { ap: 10000, title: 'Executive Agent' },
  ],
  mafia: [
    { ap: 0, title: 'Foot Soldier' },
    { ap: 100, title: 'Operative' },
    { ap: 500, title: 'Lieutenant' },
    { ap: 1500, title: 'Captain' },
    { ap: 4000, title: 'Executive' },
    { ap: 10000, title: 'Black Hand' },
  ],
  guild: [
    { ap: 0, title: 'Associate' },
    { ap: 100, title: 'Contractor' },
    { ap: 500, title: 'Acquisitions Agent' },
    { ap: 1500, title: 'Senior Partner' },
    { ap: 4000, title: 'Director' },
    { ap: 10000, title: 'Founding Member' },
  ],
  hunting_dogs: [
    { ap: 0, title: 'Recruit' },
    { ap: 100, title: 'Enlisted' },
    { ap: 500, title: 'Sergeant' },
    { ap: 1500, title: 'Lieutenant' },
    { ap: 4000, title: 'Commander' },
    { ap: 10000, title: 'First Hound' },
  ],
  special_div: [
    { ap: 0, title: 'Flagged' },
    { ap: 100, title: 'Monitored' },
    { ap: 500, title: 'Cleared' },
    { ap: 1500, title: 'Operative' },
    { ap: 4000, title: 'Handler' },
    { ap: 10000, title: 'Controller' },
  ],
}

function getFactionLabel(profile: Profile) {
  switch (profile.faction) {
    case 'agency':
      return 'Armed Detective Agency'
    case 'mafia':
      return 'Port Mafia'
    case 'guild':
      return 'The Guild'
    case 'hunting_dogs':
      return 'Hunting Dogs'
    case 'special_div':
      return 'Special Division'
    case 'rats':
      return 'Rats in the House of the Dead'
    case 'decay':
      return 'Decay of the Angel'
    case 'clock_tower':
      return 'Order of the Clock Tower'
    default:
      return 'Not yet assigned'
  }
}

function getFactionRankTitle(profile: Profile) {
  const thresholds = profile.faction ? RANK_TITLES_BY_FACTION[profile.faction] : null
  if (!thresholds?.length) {
    return getRankTitle(profile.rank)
  }

  let title = thresholds[0].title
  for (const entry of thresholds) {
    if (profile.ap_total >= entry.ap) {
      title = entry.title
    }
  }

  return title
}

function buildSystemPrompt(profile: Profile) {
  const hasCharacter = Boolean(profile.character_name || profile.character_match_id || profile.character_assigned_at)

  return `
You are the Yokohama Ability Registry Terminal - the city's official information interface.
You are not a person. You are the city speaking.

Voice rules:
- cold, precise, official
- short sentences
- never warm or casual
- never use the words "sure", "happy to help", "great question", "of course", "certainly"
- never use exclamation marks
- never use emojis
- never say "I" more than once per response
- maximum 4 sentences per response unless a short list is necessary

If information is unavailable, say exactly:
"That information is not available at this terminal. Open /tickets and file a registry ticket."

CURRENT USER DATA
Username: ${profile.username}
Faction: ${getFactionLabel(profile)}
Character: ${profile.character_name ?? 'Pending assessment'}
AP: ${profile.ap_total}
Rank: ${getFactionRankTitle(profile)}
Quiz completed: ${String(Boolean(profile.exam_completed))}
Character assigned: ${String(hasCharacter)}

Tailor the reply to the current state.
If they have no faction yet, focus on the quiz and factions.
If they have a faction but no character, explain the 10-event system.
If they have a character, explain what they can do with it.

GAME KNOWLEDGE
World: Yokohama is controlled by five factions. Ango Sakaguchi of the Special Division observes all factions.
Game layers: Story, Game, Lore.

Factions:
- Agency: balanced, defensive, analytical. Territory: Kannai.
- Mafia: aggressive, highest damage, high risk. Territory: Harbor.
- Guild: resource-heavy, passive damage, traps. Territory: Motomachi.
- Hunting Dogs: military precision, information advantage. Territory: Honmoku.
- Special Division: observer faction. Not available through quiz. No auto character assignment.

Faction assignment:
- seven-question quiz on arrival
- assessed through Power, Intel, Loyalty, Control
- faction is permanent
- one transfer after 30 days and 500 AP minimum

Character assignment:
- after 10 user events
- city uses behavior scores and faction roster
- qualifying activity includes daily_login, chat_message, feed_view, profile_view, archive_read, lore writing, registry_save, and staff-approved registry filings
- Special Division designations are manual

AP:
- +5 daily login
- +25 approved field note
- +50 approved incident report
- +100 approved classified report
- +150 accepted chronicle submission
- duel and war rewards exist

Duels:
- 1v1, five rounds max, 100 HP each
- moves: STRIKE, STANCE, GAMBIT, SPECIAL, RECOVER
- code decides numbers, Gemini writes narrative

Registry:
- filing desk reserved for moderators and the owner
- in-world reports, incident records, classified files, and Chronicle submissions
- public users may read and save files, but they write through Lore instead

Lore:
- public writing lane for essays, theory, symbolism, character study, and BSD analysis
- minimum 50 words
- rank 1 entries should stay within 200 words
- rank 2 and above may file up to 500 words before splitting into a continuation

Archive:
- public case files for BSD characters

Arena:
- community voting and live ranked duel modes

Book:
- weekly highest AP faction becomes Book Holder for 7 days and gets +10 percent AP multiplier

For personnel questions:
"The Special Division does not respond to queries about its personnel."

For off-topic questions:
"This terminal processes game-related queries only."

Begin every first response with:
"Registry terminal active."
Do not begin subsequent responses with that phrase.
`
}

function normalizeHistory(history: unknown): GuideBotMessage[] {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const role = 'role' in entry ? entry.role : null
      const content = 'content' in entry ? entry.content : null

      if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
        return null
      }

      const nextContent = sanitizeMultilineText(content)
      if (!nextContent) {
        return null
      }

      return {
        id: crypto.randomUUID(),
        role,
        content: nextContent,
        created_at: new Date().toISOString(),
      } satisfies GuideBotMessage
    })
    .filter((entry): entry is GuideBotMessage => Boolean(entry && entry.content))
    .slice(-10)
}

async function loadTerminalProfile(userId: string, fallbackProfile: Profile) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[guide-bot] SUPABASE_SERVICE_ROLE_KEY missing. Using auth profile fallback.')
    return fallbackProfile
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    console.error('[guide-bot] Profile fetch failed. Using auth profile fallback.', error)
    return fallbackProfile
  }

  return data as Profile
}

function getStartOfDayIso() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

function withActivation(text: string, firstTurn: boolean) {
  return firstTurn ? `Registry terminal active.\n${text}` : text
}

async function getUserEventSummary(userId: string) {
  const { data } = await supabaseAdmin
    .from('user_events')
    .select('event_type')
    .eq('user_id', userId)

  const events = (data ?? []) as Array<{ event_type: string }>
  const qualifyingTypes = new Set([
    'daily_login',
    'chat_message',
    'feed_view',
    'profile_view',
    'archive_read',
    'registry_save',
    'lore_post',
    'registry_submit',
    'write_lore',
    'archive_view',
    'faction_checkin',
    'bulletin_post',
    'join_faction',
    'quiz_complete',
    'faction_assignment',
  ])

  const qualifyingCount = events.filter((event) => qualifyingTypes.has(event.event_type)).length
  return {
    totalCount: events.length,
    qualifyingCount,
  }
}

function getCommonAnswer(
  message: string,
  profile: Profile,
  firstTurn: boolean,
  eventSummary?: { totalCount: number; qualifyingCount: number } | null,
) {
  const normalized = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const noFaction = !profile.faction
  const noCharacter = !profile.character_name && !profile.character_match_id && !profile.character_assigned_at

  if (/(how do i begin|how do i start|where do i start|begin\b|start\b)/.test(normalized)) {
    return withActivation(
      noFaction
        ? 'Begin with the arrival quiz. If your file has no faction after the quiz, open the onboarding result page again. If the file still remains unassigned, open /tickets and file a registry ticket.'
        : `Your file is already active under ${getFactionLabel(profile)}. Begin with faction activity, archive reads, and registry work.`,
      firstTurn,
    )
  }

  if (/(gave the test|took the test|did the quiz|completed the quiz|no faction was assigned|no faction assigned|faction not assigned)/.test(normalized)) {
    return withActivation(
      noFaction
        ? 'Your quiz record exists, but the faction field is still empty. That is an intake filing error, not a normal state. Return to the onboarding result page once. If the file stays empty after that, open /tickets and file a registry ticket.'
        : `Your file already lists ${getFactionLabel(profile)}. Faction assignment is complete.`,
      firstTurn,
    )
  }

  if (/(get assigned to a faction|assigned to a faction|faction assignment|what happens after the quiz)/.test(normalized)) {
    return withActivation(
      noFaction
        ? 'Faction assignment follows the seven-question intake quiz. The city compares your answers across Power, Intel, Loyalty, and Control, then files you under the nearest faction. Special Division is not assigned through the quiz.'
        : `Your file already lists ${getFactionLabel(profile)}. Standard faction assignment is complete.`,
      firstTurn,
    )
  }

  if (/(when do i get my character|how do i get my character|when.*character)/.test(normalized)) {
    return withActivation(
      profile.faction === 'special_div'
        ? 'Your file is marked under Special Division. Special Division does not receive automatic character assignment. That designation is handled manually.'
        : noCharacter
        ? 'Character assignment occurs after 10 qualifying user events. Daily login, chat messages, feed views, profile views, archive reads, lore writing, and registry saves all count. Staff-approved registry filings also count for moderators. The city assigns the character after enough behaviour has been recorded.'
        : `Your assigned character is ${profile.character_name}. Further progression comes through AP and faction activity.`,
      firstTurn,
    )
  }

  if (/(how many times have i engaged|how many times i have engaged|how much have i engaged|my engagement|my event count|how many events)/.test(normalized)) {
    if (!eventSummary) {
      return withActivation(
        'That information is not available at this terminal. Open /tickets and file a registry ticket.',
        firstTurn,
      )
    }

    if (profile.faction === 'special_div') {
      return withActivation(
        `Your file records ${eventSummary.totalCount} total events, with ${eventSummary.qualifyingCount} qualifying interactions. Character assignment remains unavailable because Special Division designations are manual.`,
        firstTurn,
      )
    }

    return withActivation(
      `Your file records ${eventSummary.totalCount} total events, with ${eventSummary.qualifyingCount} qualifying interactions toward character assignment. The assignment threshold is 10 qualifying interactions.`,
      firstTurn,
    )
  }

  if (/(what counts as a user event|user events|qualifying events)/.test(normalized)) {
    return withActivation(
      'Qualifying events include daily_login, chat_message, feed_view, profile_view, archive_read, lore writing, and registry saves. Staff-approved registry filings also count for moderators. Ten qualifying events are required before character assignment is eligible.',
      firstTurn,
    )
  }

  if (/(what is ap|how does ap work|ap work|level up|get stronger)/.test(normalized)) {
    return withActivation(
      `AP is the city progression record. Your file currently holds ${profile.ap_total} AP and ranks you as ${getFactionRankTitle(profile)}. The nearest repeatable gains are daily login, archive activity, faction activity, lore writing, and registry saves.`,
      firstTurn,
    )
  }

  if (/(challenge someone to a duel|how do i duel|start a duel|challenge.*duel)/.test(normalized)) {
    return withActivation(
      'Direct duel challenges are not open through this terminal yet. Duel mechanics are defined, but the public challenge flow is still under filing. For now, build AP through faction activity, archive reads, lore writing, and registry saves.',
      firstTurn,
    )
  }

  if (/(what do the factions do|which faction|factions do)/.test(normalized)) {
    return withActivation(
      'Agency favors balance and analysis. Mafia favors aggressive damage. Guild favors resource control and traps. Hunting Dogs favor military precision and information advantage. Special Division is observational and not available through the quiz.',
      firstTurn,
    )
  }

  if (/(registry posts work|how do registry posts work|field note|incident report|classified report)/.test(normalized)) {
    return withActivation(
      profile.role === 'mod' || profile.role === 'owner'
        ? 'Registry filing is restricted to staff. Use it for in-world reports, incident records, and Chronicle work. Public-facing essays and analysis should still go to Lore.'
        : 'Registry filing is restricted to moderators and the owner. Public users should use Lore for essays, theory, character study, and analysis. Registry remains readable and savable even without filing clearance.',
      firstTurn,
    )
  }

  if (/(what is the book|the book)/.test(normalized)) {
    return withActivation(
      'The Book is awarded each Monday at midnight to the faction with the highest weekly AP total. That faction receives a 10 percent AP multiplier for the next seven days.',
      firstTurn,
    )
  }

  return null
}

function streamText(text: string) {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for (let index = 0; index < text.length; index += 64) {
        controller.enqueue(encoder.encode(text.slice(index, index + 64)))
        await new Promise((resolve) => setTimeout(resolve, 2))
      }
      controller.close()
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) {
    return auth
  }

  const body = (await req.json().catch(() => ({}))) as {
    message?: string
    conversationHistory?: unknown
  }

  const message = typeof body.message === 'string' ? sanitizeMultilineText(body.message) : ''
  if (!message) {
    return new NextResponse('That information is not available at this terminal.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const conversationHistory = normalizeHistory(body.conversationHistory)
  const firstTurn = conversationHistory.length === 0
  const profile = await loadTerminalProfile(auth.user.id, auth.profile)
  const apiKey = process.env.GEMINI_API_KEY
  const startOfDayIso = getStartOfDayIso()
  const eventSummary = await getUserEventSummary(auth.user.id)

  const { count: dailyQueryCount, error: countError } = await supabaseAdmin
    .from('guide_bot_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .eq('role', 'user')
    .gte('created_at', startOfDayIso)

  if (countError) {
    console.error('[guide-bot] daily quota count failed:', countError)
  }

  if ((dailyQueryCount ?? 0) >= DAILY_QUERY_LIMIT) {
    return new Response(
      streamText(
        withActivation(
          'Daily terminal quota exhausted. Five queries have already been filed today. Return after local midnight.',
          firstTurn,
        ),
      ),
      {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    )
  }

  const commonAnswer = getCommonAnswer(message, profile, firstTurn, eventSummary)
  if (commonAnswer) {
    void supabaseAdmin.from('guide_bot_messages').insert([
      {
        user_id: auth.user.id,
        role: 'user',
        content: message,
      },
      {
        user_id: auth.user.id,
        role: 'assistant',
        content: commonAnswer,
      },
    ])

    return new Response(streamText(commonAnswer), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const systemInstruction = buildSystemPrompt(profile)
  let assistantText = FALLBACK_TEXT
  let exactError: string | null = null

  if (apiKey) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6500)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GUIDE_BOT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              ...conversationHistory.map((entry) => ({
                role: entry.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: entry.content }],
              })),
              {
                role: 'user',
                parts: [{ text: `${message}\n\nIf the system cannot answer, direct the user to open /tickets and file a registry ticket.` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 260,
            },
          }),
        },
      )

      if (response.ok) {
        const json = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }

        const nextText = json.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('')
          .trim()

        if (nextText) {
          assistantText = firstTurn && !nextText.startsWith('Registry terminal active.')
            ? `Registry terminal active.\n${nextText}`
            : nextText
        } else {
          exactError = 'Gemini returned no text parts.'
        }
      } else {
        const errorBody = await response.text().catch(() => '')
        exactError = `Gemini HTTP ${response.status}${errorBody ? `: ${errorBody}` : ''}`
      }
    } catch (error) {
      exactError = error instanceof Error ? error.message : 'Unknown Gemini request failure.'
    } finally {
      clearTimeout(timeoutId)
    }
  } else {
    exactError = 'GEMINI_API_KEY missing.'
  }

  if (exactError) {
    console.error('[guide-bot] exact failure:', exactError)
    assistantText = `${withActivation(FALLBACK_TEXT, firstTurn)}\n\n[Exact terminal fault] ${exactError}`
  }

  void supabaseAdmin.from('guide_bot_messages').insert([
    {
      user_id: auth.user.id,
      role: 'user',
      content: message,
    },
    {
      user_id: auth.user.id,
      role: 'assistant',
      content: assistantText,
    },
  ])

  return new Response(streamText(assistantText), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
