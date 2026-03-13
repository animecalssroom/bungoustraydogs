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

  // Find recent active duels involving Tachihara Michizou
  const slug = 'tachihara-michizou'
  const duelsRes = await fetch(`${SUPABASE_URL}/rest/v1/duels?defender_character_slug=eq.${slug}&status=eq.active&select=*&order=created_at.desc&limit=5`, { headers })
  const duels = await duelsRes.json()
  if (!duels || duels.length === 0) {
    console.log('No recent active duels found for', slug)
    return
  }

  for (const duel of duels) {
    console.log('\n=== Duel:', duel.id, '===')
    console.log('challenger_id:', duel.challenger_id, 'defender_id:', duel.defender_id, 'current_round:', duel.current_round)

    const roundsRes = await fetch(`${SUPABASE_URL}/rest/v1/duel_rounds?duel_id=eq.${duel.id}&select=*&order=round_number.asc`, { headers })
    const rounds = await roundsRes.json()
    console.log('Rounds:')
    for (const r of rounds) {
      console.log(`- round ${r.round_number}: challenger_move=${r.challenger_move}, defender_move=${r.defender_move}, challenger_move_submitted_at=${r.challenger_move_submitted_at}, defender_move_submitted_at=${r.defender_move_submitted_at}, resolved_at=${r.resolved_at}, round_deadline=${r.round_deadline}`)
    }
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
