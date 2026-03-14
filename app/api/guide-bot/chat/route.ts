import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { sanitizeMultilineText } from '@/backend/lib/input-safety'
import { supabaseAdmin } from '@/backend/lib/supabase'

import {
  CHARACTER_ASSIGNMENT_THRESHOLD,
  QUALIFYING_ASSIGNMENT_EVENTS,
  getRankTitle,
  type GuideBotMessage,
  type Profile,
} from '@/backend/types'
import { allowFixedWindow, userCommonAnswerKey } from '@/backend/lib/upstash'
import { redis } from '@/lib/redis'
import { loadKnowledgeFiles, getKnowledgeCache, searchKnowledge, searchRelationship } from '@/backend/lib/guidebot-knowledge'
import fs from 'fs/promises'
import path from 'path'


const GUIDE_BOT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const DAILY_QUERY_LIMIT = 10
const FALLBACK_TEXT = `Registry terminal is experiencing interference.
Open /tickets and file a registry ticket.`

// Load the full system prompt from guidebotcomplete.md (between === lines)
let SYSTEM_PROMPT = ''
async function loadSystemPrompt() {
  const filePath = path.join(process.cwd(), 'guidebotcomplete.md')
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const match = content.match(/={77,}[\r\n]+([\s\S]*?)[\r\n]+={77,}/)
    if (match) {
      SYSTEM_PROMPT = match[1].trim()
    }
  } catch (e) {
    SYSTEM_PROMPT = ''
  }
}
// Load at startup
loadSystemPrompt()
loadKnowledgeFiles()

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


// Build the system prompt with user data and optionally knowledge excerpts
function buildSystemPrompt(profile: Profile, eventCount: number, knowledgeExcerpts: string[] = []) {
  let prompt = SYSTEM_PROMPT
    .replace('[USERNAME]', profile.username)
    .replace('[FACTION]', profile.faction ?? 'Not yet assigned')
    .replace('[CHARACTER_NAME]', profile.character_name ?? 'Pending city assessment')
    .replace('[AP]', String(profile.ap_total ?? 0))
    .replace('[RANK_TITLE]', getFactionRankTitle(profile))
    .replace('[QUIZ_COMPLETED]', profile.exam_completed ? 'Yes' : 'No')
    .replace('[CHARACTER_ASSIGNED]', profile.character_name ? 'Yes' : 'No')
    .replace('[EVENT_COUNT]', String(eventCount))
  if (knowledgeExcerpts.length > 0) {
    prompt += '\n\nRelevant knowledge:\n' + knowledgeExcerpts.join('\n---\n')
  }
  return prompt
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
  const cacheKey = `event_summary:${userId}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) return cached as { totalCount: number; qualifyingCount: number }
  } catch (e) {
    // ignore redis failures
  }

  const [totalRes, qualifyingRes] = await Promise.all([
    supabaseAdmin
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('event_type', QUALIFYING_ASSIGNMENT_EVENTS),
  ])

  const result = { totalCount: totalRes.count ?? 0, qualifyingCount: qualifyingRes.count ?? 0 }
  try {
    await redis.set(cacheKey, result, { ex: 300 })
  } catch (e) {
    // ignore redis failures
  }

  return result
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
          ? `Character assignment occurs after ${CHARACTER_ASSIGNMENT_THRESHOLD} qualifying user events. Daily login, transmissions, archive reads, lore records, faction check-ins, and registry activity all count. The city assigns the character after enough behavior has been recorded.`
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
      `Your file records ${eventSummary.totalCount} total events, with ${eventSummary.qualifyingCount} qualifying interactions toward character assignment. The assignment threshold is ${CHARACTER_ASSIGNMENT_THRESHOLD} qualifying interactions.`,
      firstTurn,
    )
  }

  if (/(what counts as a user event|user events|qualifying events)/.test(normalized)) {
    return withActivation(
      `Qualifying events include daily login, transmissions, archive activity, lore records, faction check-ins, and registry filing. ${CHARACTER_ASSIGNMENT_THRESHOLD} qualifying events are required before character assignment is eligible.`,
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
  const eventCount = eventSummary?.qualifyingCount ?? 0
  // Quick-check for common/hardcoded answers before running an expensive count query.
  // This avoids a full table count on trivial requests and reduces disk/compute cost.
  const commonAnswerEarly = getCommonAnswer(message, profile, firstTurn, eventSummary)
  if (commonAnswerEarly) {
    // Rate-limit quick, hardcoded replies via Upstash (free tier).
    try {
      const allowed = await allowFixedWindow(userCommonAnswerKey(auth.user.id), 60, 5)
      if (allowed) {
        const repliesLeft = 'You have unlimited quick replies for this short window.'
        void supabaseAdmin.from('guide_bot_messages').insert([
          {
            user_id: auth.user.id,
            role: 'user',
            content: message,
          },
          {
            user_id: auth.user.id,
            role: 'assistant',
            content: `${commonAnswerEarly}\n\n${repliesLeft}`,
          },
        ])

        return new Response(streamText(`${commonAnswerEarly}\n\n${repliesLeft}`), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      // If not allowed, fall through to normal quota/count path.
    } catch (err) {
      // If Redis is unavailable or misconfigured, fall back to existing behavior.
      console.error('[guide-bot] Upstash rate limiter failed:', err)
    }
  }

  // QUOTA: use Redis-backed quota key to avoid repeated DB counts
  const today = new Date().toISOString().slice(0, 10)
  const quotaKey = `guide_bot_quota:${auth.user.id}:${today}`

  let dailyQueryCount = (await redis.get(quotaKey)) as number | null
  if (dailyQueryCount === null) {
    const { count, error: countError } = await supabaseAdmin
      .from('guide_bot_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .eq('role', 'user')
      .gte('created_at', startOfDayIso)

    if (countError) {
      console.error('[guide-bot] daily quota count failed:', countError)
    }

    dailyQueryCount = (count ?? 0) as number
    try {
      await redis.set(quotaKey, dailyQueryCount, { ex: 3600 })
    } catch (e) {
      // ignore redis failures
    }
  }

  if ((dailyQueryCount ?? 0) >= DAILY_QUERY_LIMIT) {
    return new Response(
      streamText(withActivation(`Daily terminal quota exhausted. Ten queries have already been filed today. Return after local midnight.`, firstTurn)),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )
  }

  const repliesLeft = DAILY_QUERY_LIMIT - (dailyQueryCount ?? 0)
  const replyNotice = `You have ${repliesLeft} guide bot replies left today.`

  // Improved relationship query detection and fuzzy matching
  let knowledgeExcerpts: string[] = []
  const relPattern = /relationship[s]?|bond|connection|rivalry|duo|pair|trio/i
  const namePattern = /([a-zA-Z]{3,})/g
  const lowerMsg = message.toLowerCase()
  if (relPattern.test(lowerMsg)) {
    // Extract all words with 3+ letters as possible names
    const nameCandidates = Array.from(message.matchAll(namePattern)).map(m => m[1].toLowerCase())
    // Remove duplicates and common words
    const blacklist = new Set(['relationship', 'relationships', 'between', 'with', 'and', 'of', 'the', 'what', 'is', 'are', 'to', 'a', 'in', 'vs', 'bond', 'connection', 'duo', 'pair', 'trio'])
    const names = nameCandidates.filter(n => !blacklist.has(n))
    // Try all pairs
    let found = false
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const relResults = searchRelationship(names[i], names[j], 2)
        if (relResults.length > 0) {
          // Concatenate all relevant excerpts for a fuller answer
          knowledgeExcerpts = [relResults.map(r => `From ${r.file}:\n${r.excerpt.trim()}`).join('\n---\n')]
          found = true
          break
        }
      }
      if (found) break
    }
    if (!found) {
      knowledgeExcerpts = [`No direct relationship found between ${names.slice(0, 2).join(' and ') || 'the specified characters'} in the database.`]
    }
  } else {
    const knowledgeResults = searchKnowledge(message, 2)
    knowledgeExcerpts = knowledgeResults.map(r => `From ${r.file}:\n${r.excerpt.trim()}`)
  }

  const systemInstruction = buildSystemPrompt(profile, eventCount, knowledgeExcerpts) + `\n\n${replyNotice}`
  let assistantText = FALLBACK_TEXT
  let exactError: string | null = null

  if (apiKey) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GUIDE_BOT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
              maxOutputTokens: 512,
            },
          }),
        },
      )

      if (response.ok && response.body) {
        clearTimeout(timeoutId)

        let sentActivation = false
        let fullText = ''
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        const textStream = new ReadableStream({
          async start(controller) {
            let buffer = ''
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''
                for (const line of lines) {
                  const trimmed = line.trim()
                  if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.slice(6)
                    if (dataStr === '[DONE]') continue
                    try {
                      const json = JSON.parse(dataStr)
                      const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
                      if (textChunk) {
                        let toSend = textChunk
                        if (firstTurn && !sentActivation) {
                          if (!toSend.startsWith('Registry terminal active.')) {
                            toSend = `Registry terminal active.\n${toSend}`
                          }
                          sentActivation = true
                        }
                        fullText += textChunk
                        controller.enqueue(new TextEncoder().encode(toSend))
                      }
                    } catch (e) { }
                  }
                }
              }
              controller.close()

              const finalAssistantText = firstTurn && !fullText.startsWith('Registry terminal active.')
                ? `Registry terminal active.\n${fullText}`
                : fullText

              void supabaseAdmin.from('guide_bot_messages').insert([
                { user_id: auth.user.id, role: 'user', content: message },
                { user_id: auth.user.id, role: 'assistant', content: finalAssistantText },
              ])
            } catch (e) {
              controller.error(e)
            }
          }
        })

        return new Response(textStream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
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
