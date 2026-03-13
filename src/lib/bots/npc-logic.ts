const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

export async function generateBotPost(systemPrompt: string, contextSummary: string, apiKey: string) {
  const prompt = `${systemPrompt}

Recent faction activity for context (do not directly quote or reference):
${contextSummary}

Write one short faction post as this character. Max 3 sentences. No hashtags. No emojis.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('').trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateBotReply(systemPrompt: string, mentionContent: string, apiKey: string) {
  const prompt = `${systemPrompt}

Someone just wrote this in your faction channel:
"${mentionContent}"

They mentioned you (@). Write a short reply in character. 1-2 sentences maximum. No emojis.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('').trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
