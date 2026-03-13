const fs = require('fs')
const fetch = global.fetch || require('node-fetch')

function loadEnv(path = '.env.local') {
  const txt = fs.readFileSync(path, 'utf8')
  const env = {}
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([^#=\s]+)=?(.*)$/)
    if (m) {
      const k = m[1].trim()
      let v = m[2] ?? ''
      v = v.replace(/^"/, '').replace(/"$/, '')
      env[k] = v
    }
  }
  return env
}

async function main() {
  const env = loadEnv()
  const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const BOT_DUEL_SECRET = env.BOT_DUEL_SECRET

  if (!BOT_DUEL_SECRET) {
    console.error('BOT_DUEL_SECRET not set in .env.local')
    process.exit(1)
  }

  // Retry a few times for transient network/DNS issues
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(`${APP_URL}/api/bots/submit-duel-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-duel-secret': BOT_DUEL_SECRET,
          'x-bot-secret': BOT_DUEL_SECRET,
        },
        body: JSON.stringify({}),
      })
      const text = await res.text()
      console.log(`Attempt ${attempt} — Status:`, res.status)
      console.log(`Attempt ${attempt} — Body:`, text)
      lastErr = null
      break
    } catch (e) {
      lastErr = e
      console.error(`Attempt ${attempt} failed:`, e && e.message ? e.message : e)
      // backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  if (lastErr) {
    console.error('Bot trigger failed after retries:', lastErr)
    // don't exit with non-zero so CI or manual runs continue; just report
  }
}

main()
