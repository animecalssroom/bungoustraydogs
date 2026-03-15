const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yuvueewfzzbepsjfcvuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dnVlZXdmenpiZXBzamZjdnVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2MzI1MywiZXhwIjoyMDg4NzM5MjUzfQ.ZRpO6wBfVW_ohX51sLe_Q3L6C5G9OTrNiEy7f6N2a1Y';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  const { data: user } = await supabaseAdmin.from('profiles').select('id').eq('username', 'ango_sakaguchi').single();
  if (!user) return console.log('User not found');

  const { data: duels } = await supabaseAdmin
    .from('duels')
    .select('id, challenger_character, defender_character, status, is_war_duel, war_id, created_at, winner_id')
    .or(`challenger_id.eq.${user.id},defender_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20);
  
  console.log('--- DUELS START ---');
  duels.forEach(d => {
    console.log(`${d.created_at} | ${d.challenger_character} vs ${d.defender_character} | Status: ${d.status} | WarDuel: ${d.is_war_duel} | Winner: ${d.winner_id}`);
  });
  console.log('--- DUELS END ---');
}

diagnose().catch(console.error);
