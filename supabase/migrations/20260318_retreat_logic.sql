-- Migration: Retreat Logic & War Resolution
-- Allows a faction to yield and ensures ownership sync

CREATE OR REPLACE FUNCTION retreat_from_war(
    p_war_id UUID,
    p_retreating_faction TEXT
)
RETURNS VOID AS $$
DECLARE
    v_opposing_faction TEXT;
    v_stakes_detail JSONB;
    v_district_id TEXT;
BEGIN
    -- 1. Identify the opposing faction
    SELECT 
        CASE 
            WHEN faction_a_id = p_retreating_faction THEN faction_b_id 
            ELSE faction_a_id 
        END,
        stakes_detail
    INTO v_opposing_faction, v_stakes_detail
    FROM faction_wars
    WHERE id = p_war_id;

    -- 2. Close the war
    UPDATE faction_wars
    SET 
        status = 'complete',
        winner_id = v_opposing_faction,
        resolved_at = NOW(),
        war_message = war_message || E'\n\n[RECONNAISSANCE REPORT]: ' || p_retreating_faction || ' has yielded the field. ' || v_opposing_faction || ' claims victory.'
    WHERE id = p_war_id;

    -- 3. If stakes were district control, update ownership
    IF v_stakes_detail->>'type' = 'district' THEN
        v_district_id := v_stakes_detail->>'district_id';
        
        UPDATE districts
        SET 
            controlling_faction = v_opposing_faction,
            last_flip_at = NOW()
        WHERE id = v_district_id;
    END IF;

    -- 4. Log the activity
    INSERT INTO faction_activity (faction_id, event_type, description, created_at)
    VALUES 
    (p_retreating_faction, 'war_retreat', 'Tactical withdrawal initiated. Command has ordered a retreat.', NOW()),
    (v_opposing_faction, 'war_victory', 'Enemy forces have retreated. Victory secured.', NOW());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
