// @ts-nocheck
const geminiKey = Deno.env.get('GEMINI_API_KEY')
const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const body = await request.json().catch(() => null)

  if (!geminiKey || !body?.content || !body?.title) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const prompt = [
    'You are reviewing a Bungou Stray Dogs incident report for canon consistency.',
    'Return JSON only with these keys:',
    'canon_consistent, canon_notes, character_accurate, character_notes, quality_score, recommendation, recommendation_reason.',
    `Faction: ${body.authorFaction ?? 'unknown'}`,
    `Word count: ${body.wordCount ?? 0}`,
    `Title: ${body.title}`,
    'Content:',
    body.content,
  ].join('\n')

  const response = await fetch(
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

  if (!response.ok) {
    return Response.json({ error: 'Gemini review failed.' }, { status: 500 })
  }

  const json = await response.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  return Response.json(JSON.parse(text.replace(/```json|```/g, '').trim()))
})
