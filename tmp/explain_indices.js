
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlQueries = [
  `CREATE INDEX IF NOT EXISTS idx_profiles_faction ON profiles(faction);`,
  `CREATE INDEX IF NOT EXISTS idx_faction_wars_status ON faction_wars(status);`,
  `CREATE INDEX IF NOT EXISTS idx_characters_faction ON characters(faction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_archive_faction ON archive_entries(faction);`
];

async function runMigrations() {
  console.log('--- Running Performance Index Migrations ---');
  
  for (const query of sqlQueries) {
    console.log(`Executing: ${query}`);
    // Use rpc to execute raw SQL if available, or just use the management API logic if this were a migration tool.
    // Note: Supabase JS client doesn't have a direct 'query' method for raw SQL.
    // We usually do this via migrations or the SQL Editor in the Dashboard.
    // But since I'm an agent, I'll assume there's no direct raw SQL method in the JS client.
    console.log('NOTE: Raw SQL execution via JS client requires a custom RPC function or a migration tool.');
  }

  console.log('Manual Action Required: Please paste the above SQL queries into your Supabase SQL Editor.');
  console.log('I will proceed with the code-level refactors (select columns, polling, etc.)');
}

runMigrations();
