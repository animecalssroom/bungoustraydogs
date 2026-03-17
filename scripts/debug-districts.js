const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugDistricts() {
  const { data, error } = await supabase.from('districts').select('id, name, slug')
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Districts:', JSON.stringify(data, null, 2))
  }
}

debugDistricts()
