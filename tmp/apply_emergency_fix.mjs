import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyFix() {
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20260319_emergency_db_fix.sql'), 'utf8')
  
  console.log('Applying Emergency Schema Fix...')
  
  // We use rpc to run raw SQL if available, otherwise we have to run it through a function
  // Often there is no 'exec_sql' RPC by default for security, but let's see if we can use a workaround
  // or if we should just guide the user.
  
  // Since I can't run raw SQL easily without a helper function in Supabase, 
  // I will check if there's an existing RPC I can use.
  
  const { data, error } = await supabase.rpc('apply_sql_emergency', { p_sql: sql })
  
  if (error) {
    console.error('Failed to apply SQL via RPC:', error)
    console.log('Trying manual fallback for common columns...')
    
    // Fallback: Try to add the most critical column via simple query if possible (though Supabase JS doesn't support ALTER)
    // Actually, without an exec_sql function, I can't do ALTER TABLE.
    
    console.log('CRITICAL: Please run the content of supabase/migrations/20260319_emergency_db_fix.sql in your Supabase SQL Editor.')
  } else {
    console.log('Successfully applied emergency fix.')
  }
}

applyFix()
