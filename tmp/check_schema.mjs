import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { p_table_name: 'faction_wars' })
  if (error) {
    // If RPC doesn't exist, try a simple query to see if the column exists
    const { error: queryError } = await supabase.from('faction_wars').select('resolved_at').limit(1)
    if (queryError) {
      console.log('COLUMN_MISSING: resolved_at')
      console.error(queryError)
    } else {
      console.log('COLUMN_EXISTS: resolved_at')
    }
  } else {
    console.log('Columns:', data)
  }
}

checkSchema()
