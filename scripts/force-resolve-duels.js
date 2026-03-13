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
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing Supabase URL or service role key in .env.local')
    process.exit(1)
  }

  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
  }

  // Find active duels vs the Tachihara bot
  const slug = 'tachihara-michizou'
  const duelsRes = await fetch(`${SUPABASE_URL}/rest/v1/duels?defender_character_slug=eq.${slug}&status=eq.active&select=id, current_round&order=created_at.desc&limit=10`, { headers })
  const duels = await duelsRes.json()
  if (!duels || duels.length === 0) {
    console.log('No active duels vs', slug)
    return
  }

  for (const d of duels) {
    console.log('Resolving duel', d.id)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/resolve-duel-round`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ duel_id: d.id }),
    })
    const text = await res.text()
    console.log('Function response for', d.id, res.status, text)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
