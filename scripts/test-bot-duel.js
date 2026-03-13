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
  const APP_URL = env.NEXT_PUBLIC_APP_URL
  const BOT_DUEL_SECRET = env.BOT_DUEL_SECRET

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing Supabase URL or service role key in .env.local')
    process.exit(1)
  }
  if (!APP_URL || !BOT_DUEL_SECRET) {
    console.error('Missing APP_URL or BOT_DUEL_SECRET in .env.local')
    process.exit(1)
  }

  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
  }

  console.log('Searching for a bot profile...')
  let res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?is_bot=eq.true&select=id,username,character_match_id,character_name,faction&limit=1`, { headers })
  const bots = await res.json()
  if (!bots || bots.length === 0) {
    console.error('No bot profiles found in Supabase.')
    process.exit(1)
  }
  const bot = bots[0]
  console.log('Found bot:', bot.username || bot.id)

  console.log('Searching for a non-bot human profile...')
  res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?is_bot=eq.false&select=id,username,character_match_id,character_name,faction&limit=1`, { headers })
  let humans = await res.json()
  if (!humans || humans.length === 0) {
    // try profiles without is_bot flag
    res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,character_match_id,character_name,faction&limit=1`, { headers })
    humans = await res.json()
  }
  if (!humans || humans.length === 0) {
    console.error('No human profiles found in Supabase to act as challenger.')
    process.exit(1)
  }
  const human = humans[0]
  console.log('Found human:', human.username || human.id)

  // Create duel record
  const now = new Date().toISOString()
  const duelPayload = {
    challenger_id: human.id,
    defender_id: bot.id,
    challenger_character: human.character_name || null,
    defender_character: bot.character_name || null,
    challenger_character_slug: human.character_match_id || null,
    defender_character_slug: bot.character_match_id || null,
    challenger_faction: human.faction || null,
    defender_faction: bot.faction || null,
    status: 'active',
    current_round: 1,
    challenger_max_hp: 100,
    defender_max_hp: 100,
    challenger_hp: 100,
    defender_hp: 100,
    accepted_at: now,
    created_at: now,
  }

  console.log('Inserting duel...')
  res = await fetch(`${SUPABASE_URL}/rest/v1/duels`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(duelPayload),
  })
  const duelInsert = await res.text()
  console.log('Duel insert response:', duelInsert)

  let duel
  try {
    duel = JSON.parse(duelInsert)[0]
  } catch (e) {
    console.error('Unable to parse duel insert response.')
    process.exit(1)
  }

  console.log('Creating initial round...')
  const roundPayload = {
    duel_id: duel.id,
    round_number: 1,
    round_started_at: now,
    round_deadline: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  }

  res = await fetch(`${SUPABASE_URL}/rest/v1/duel_rounds`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(roundPayload),
  })
  const roundInsert = await res.text()
  console.log('Round insert response:', roundInsert)

  console.log('Calling local bot submit endpoint to trigger bot move...')
  try {
    const botRes = await fetch(`${APP_URL}/api/bots/submit-duel-move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-duel-secret': BOT_DUEL_SECRET,
        'x-bot-secret': BOT_DUEL_SECRET,
      },
      body: JSON.stringify({ duel_id: duel.id }),
    })
    const botText = await botRes.text()
    console.log('Bot endpoint response status:', botRes.status)
    console.log('Bot endpoint response body:', botText)
  } catch (e) {
    console.error('Failed to call bot endpoint:', e.message)
    process.exit(1)
  }

  console.log('Done. Check the app logs and the duel state in Supabase to see bot moves.')
}

main().catch((err) => {
  console.error('Error running test script:', err)
  process.exit(1)
})
