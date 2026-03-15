const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTachihara() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, is_bot, duel_wins, duel_losses')
    .eq('username', 'tachihara_m')
    .single()

  if (error) {
    console.error('Error fetching Tachihara:', error)
  } else {
    console.log('Tachihara Profile:', data)
  }
}

checkTachihara()
