/**
 * Register QStash schedules for bot endpoints.
 * Requires: QSTASH_TOKEN, QSTASH_URL environment variables and BOT_SECRET present.
 */
// Use global fetch available in Node 18+
export {}

async function register(target: any, cron: string, name?: string) {
  const token = process.env.QSTASH_TOKEN
  if (!token) throw new Error('Missing QSTASH_TOKEN')
  const body: any = { name: name ?? `bot-schedule-${target.url}`, cron, target }

  const maxAttempts = 3
  let lastErr: any = null
  // Use the region-aware QStash endpoint if provided, otherwise global
  const schedulesUrl = (process.env.QSTASH_URL || 'https://qstash.upstash.io').replace(/\/$/, '') + '/v2/schedules'
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const resp = await fetch(schedulesUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        throw new Error(`QStash ${resp.status} ${resp.statusText} ${txt}`)
      }
      return resp.json()
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, i)))
    }
  }

  throw lastErr
}

async function main() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
  if (!base) {
    console.error('Set NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_VERCEL_URL')
    process.exit(1)
  }

  console.log('Registering bot schedules (example):')
  console.log('QStash base:', base)
  console.log('QStash schedules endpoint:', (process.env.QSTASH_URL || 'https://qstash.upstash.io') + '/v2/schedules')
  const dailyUrl = `${base}/api/bots/daily-login`
  const repliesUrl = `${base}/api/bots/check-replies`
  const botSubmitUrl = `${base}/api/bots/submit-duel-move`

  // Supabase edge function resolves duel rounds; prefer using SUPABASE_URL so it targets the project's functions endpoint
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const resolveFunctionUrl = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/resolve-duel-round` : null

  // daily-login
  const dailyTarget = {
    url: dailyUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOT_SECRET ? { 'x-bot-secret': process.env.BOT_SECRET } : {}),
    },
  }
  console.log('Registering (daily-login):', dailyUrl)
  console.log(await register(dailyTarget, '0 9 * * *', 'bot-daily-login'))

  // check-replies
  const repliesTarget = {
    url: repliesUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOT_SECRET ? { 'x-bot-secret': process.env.BOT_SECRET } : {}),
    },
  }
  console.log('Registering (check-replies):', repliesUrl)
  console.log(await register(repliesTarget, '*/5 * * * *', 'bot-check-replies'))

  // resolve-duel-round (Supabase Edge Function) — requires service role auth and a cron trigger body
  if (resolveFunctionUrl) {
    const resolveTarget = {
      url: resolveFunctionUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SUPABASE_SERVICE_ROLE_KEY ? { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } : {}),
      },
      body: JSON.stringify({ trigger: 'cron' }),
    }
    console.log('Registering (resolve-duel-round):', resolveFunctionUrl)
    console.log(await register(resolveTarget, '* * * * *', 'resolve-duel-round'))
  } else {
    console.warn('Skipping resolve-duel-round: SUPABASE_URL not set')
  }

  // bot-submit-moves — uses BOT_DUEL_SECRET
  const submitTarget = {
    url: botSubmitUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOT_DUEL_SECRET ? { 'x-bot-duel-secret': process.env.BOT_DUEL_SECRET } : {}),
    },
  }
  console.log('Registering (bot-submit-moves):', botSubmitUrl)
  console.log(await register(submitTarget, '* * * * *', 'bot-submit-moves'))
}

void main()
