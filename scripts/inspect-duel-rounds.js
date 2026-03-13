const fs = require('fs')
const fetch = global.fetch || require('node-fetch')

function loadEnv(path = '.env.local') {
  if (!fs.existsSync(path)) return {}
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

  const url = `${SUPABASE_URL}/rest/v1/duel_rounds?select=id,duel_id,round_number,round_started_at,round_deadline,created_at&order=created_at.desc&limit=50`
  const res = await fetch(url, { headers })
  const rows = await res.json()
  if (!rows || !rows.length) {
    console.log('No duel_rounds found')
    return
  }

  for (const r of rows) {
    const started = r.round_started_at ? new Date(r.round_started_at).getTime() : null
    const deadline = r.round_deadline ? new Date(r.round_deadline).getTime() : null
    const diffMin = started && deadline ? Math.round((deadline - started) / 60000) : null
    console.log(r.id, r.duel_id, r.round_number, 'started:', r.round_started_at, 'deadline:', r.round_deadline, 'delta_min:', diffMin)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
