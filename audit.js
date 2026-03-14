const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runQueries() {
    console.log('--- Query 1: event_type counts ---');
    const { data: q1, error: e1 } = await supabase.rpc('execute_sql', { sql: "SELECT event_type, COUNT(*), SUM(ap_awarded) FROM user_events GROUP BY event_type ORDER BY COUNT(*) DESC;" });
    if (e1) console.error(e1); else console.log(q1);

    console.log('\n--- Query 2: last 20 events ---');
    const { data: q2, error: e2 } = await supabase.rpc('execute_sql', { sql: "SELECT u.username, e.event_type, e.ap_awarded, e.created_at, p.ap_total FROM user_events e JOIN profiles p ON p.id = e.user_id JOIN profiles u ON u.id = e.user_id ORDER BY e.created_at DESC LIMIT 20;" });
    if (e2) console.error(e2); else console.log(q2);

    console.log('\n--- Query 3: duel complete events ---');
    const { data: q3, error: e3 } = await supabase.rpc('execute_sql', { sql: "SELECT COUNT(*) as duel_complete_events FROM user_events WHERE event_type = 'duel_complete';" });
    if (e3) console.error(e3); else console.log(q3);

    console.log('\n--- Query 4: duels without AP ---');
    const { data: q4, error: e4 } = await supabase.rpc('execute_sql', { sql: "SELECT id, status, winner_id, loser_id, ap_awarded, completed_at FROM duels WHERE status = 'complete' AND ap_awarded = false LIMIT 20;" });
    if (e4) console.error(e4); else console.log(q4);

    console.log('\n--- Query 5: registry approved without AP ---');
    const { data: q5, error: e5 } = await supabase.rpc('execute_sql', { sql: "SELECT rp.id, rp.status, rp.author_id, (SELECT SUM(ap_awarded) FROM user_events WHERE user_id = rp.author_id AND event_type = 'registry_post') as ap_from_registry FROM registry_posts rp WHERE rp.status = 'approved' LIMIT 20;" });
    if (e5) console.error(e5); else console.log(q5);
}

runQueries();
