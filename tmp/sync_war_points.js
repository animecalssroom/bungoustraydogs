const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yuvueewfzzbepsjfcvuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dnVlZXdmenpiZXBzamZjdnVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2MzI1MywiZXhwIjoyMDg4NzM5MjUzfQ.ZRpO6wBfVW_ohX51sLe_Q3L6C5G9OTrNiEy7f6N2a1Y';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

const WAR_ID = '33d463a3-50a4-42a0-8a8d-4d49570aba3a';
const WAR_START = '2026-03-15T15:58:00Z'; // Slightly before 15:58:33
const FACTION_A = 'special_div';
const FACTION_B = 'hunting_dogs';

async function sync() {
  console.log('--- SYNC START ---');

  // Find ALL duels since war start between these factions
  const { data: duels, error: duelErr } = await supabaseAdmin
    .from('duels')
    .select('*')
    .gte('created_at', WAR_START);

  if (duelErr) throw duelErr;

  console.log(`Found ${duels.length} duels since war start.`);

  for (const duel of duels) {
    const isSpecialDivVsDogs = 
      (duel.challenger_faction === FACTION_A && duel.defender_faction === FACTION_B) ||
      (duel.challenger_faction === FACTION_B && duel.defender_faction === FACTION_A);

    if (isSpecialDivVsDogs) {
      console.log(`Duel ${duel.id}: ${duel.challenger_character} vs ${duel.defender_character} | Status: ${duel.status} | WarDuel: ${duel.is_war_duel}`);

      // If it's not marked as war duel, fix it
      if (!duel.is_war_duel) {
        console.log(`  Flagging as War Duel...`);
        await supabaseAdmin
          .from('duels')
          .update({ is_war_duel: true, war_id: WAR_ID })
          .eq('id', duel.id);
      }

      // If it's complete/forfeit, ensure points are there
      if (['complete', 'forfeit'].includes(duel.status)) {
        const isDraw = !duel.winner_id;
        if (isDraw) {
          await addContribution(duel.challenger_id, 1, duel.id, duel.challenger_faction);
          await addContribution(duel.defender_id, 1, duel.id, duel.defender_faction);
        } else {
          const winnerFaction = duel.winner_id === duel.challenger_id ? duel.challenger_faction : duel.defender_faction;
          await addContribution(duel.winner_id, 3, duel.id, winnerFaction);
        }
      }
    }
  }

  console.log('--- SYNC END ---');
}

async function addContribution(userId, points, duelId, factionId) {
    if (!userId || !factionId) return;

    const { data: existing } = await supabaseAdmin
        .from('war_contributions')
        .select('id')
        .eq('war_id', WAR_ID)
        .eq('reference_id', duelId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing) return;

    console.log(`  Adding ${points} pts for Faction ${factionId} (User ${userId})`);
    
    await supabaseAdmin.from('war_contributions').insert({
        war_id: WAR_ID,
        user_id: userId,
        contribution_type: 'duel_win',
        points: points,
        reference_id: duelId
    });

    const { data: war } = await supabaseAdmin.from('faction_wars').select('*').eq('id', WAR_ID).single();
    if (war) {
        const updateData = war.faction_a_id === factionId 
            ? { faction_a_points: (war.faction_a_points || 0) + points }
            : { faction_b_points: (war.faction_b_points || 0) + points };
        
        await supabaseAdmin.from('faction_wars').update(updateData).eq('id', WAR_ID);
    }
}

sync().catch(console.error);
