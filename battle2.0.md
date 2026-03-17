BungouArchive: Tactical War System (v2.0 Master Blueprint)
1. The Core Vision
The war system is moving out of the chat box and into a High-Stakes Tactical Command Center.

Wars are no longer passive or constant. They are 72-hour Server Events manually declared by Faction Moderators.

The system uses an Asynchronous "Shadow Duel" mechanic so players don't have to be online at the exact same time to fight.

Victory relies on teamwork, lore-accurate character abilities, and strategy rather than just random dice rolls.

2. Technical Architecture (The Free-Tier Protection Plan)
To prevent the game from crashing your Supabase and Upstash free tiers during heavy combat:

Upstash Redis (The Shock Absorber): All "Hot" data—like the live Tug-of-War Integrity Bar, the 72-hour countdown timer, and the live combat logs—lives in Redis.

No WebSockets: The "Transmissions Feed" simulates a live terminal by having the frontend poll a Redis List every 15 seconds.

Supabase (Permanent State): Supabase is only used for permanent records: Faction ownership, base character stats, and a recovery_until timestamp for defeated players. Redis data is batch-synced to Supabase only periodically or when the war ends.

The Single RPC: All combat math happens in a single backend function to minimize database reads/writes.

3. Character Roles & The "Tag" System
Every player can participate, but their actions are restricted by the class_tag of the character they have equipped.

[INTEL] / [STRATEGIST] (e.g., Ranpo, Ango): * Role: The Scouts.

Mechanic: Enemy defenders are initially hidden/encrypted. Intel players must click [ RECON ] to decrypt the battlefield, revealing enemy stats and tags so their faction doesn't attack blind.

[SUPPORT] / [MEDIC] (e.g., Yosano, Mori): * Role: The Healers.

Mechanic: Defeated players get a 24-hour Recovery lockout. Medics access the [ FIELD HOSPITAL ] to instantly revive teammates and get them back in the fight.

[BRUTE] / [ANOMALY] (e.g., Chuuya, Atsushi, Dazai): * Role: The Combatants.

Mechanic: They use the [ STRIKE ] and [ COUNTER-STRIKE ] buttons to engage the enemy. Combat math is based on a Rock-Paper-Scissors style Tag matchup (e.g., Anomaly heavily counters Brute) plus base stats.

4. The War Room UI (/districts)
When a war is declared, clicking the contested district on the map opens the Sector Dashboard (a right-side slide-in drawer).

The Header: Shows the active conflict (e.g., Port Mafia vs. ADA) and the 72-hour ticking clock.

Structural Integrity Bar: A Tug-of-War progress bar (Left side = Attackers, Right side = Defenders).

The Operations Deck: Contains the [ RECON ] and [ FIELD HOSPITAL ] buttons (only glowing for the right character classes).

The Battlefield (Two Columns):

Left Column (The Vanguard): A list of the attacking faction's deployed players.

Right Column (The Guard): A list of the defending faction's deployed players.

Players click Strike/Counter-Strike on these specific user cards to initiate a duel.

Transmissions Terminal (Footer): A scrolling, typewriter-style log narrating the war (e.g., > [10:42] @rookie [BRUTE] struck @chuuya [BRUTE]. Result: Attacker incapacitated. Integrity +5%.).

5. The Combat Loop & Win Conditions
Deployment: Players from both factions "park" their characters in the contested district.

The Clash: Attackers hit [ STRIKE ] to push the Integrity Bar down. Defenders hit [ COUNTER-STRIKE ] on the attackers to push the Integrity Bar back up.

The Penalty: Whoever loses the math calculation gets a 24-hour recovery_until timestamp added to their profile, greying out their card until a Medic heals them or the timer expires.

How it Ends: * Wipeout: One side completely overwhelms the other and pushes the Integrity Bar to 100% or 0%.

Time-Out: The 72-hour timer ends, and the faction with the highest percentage on the bar wins.

The Spoils: The winning faction claims the district and receives a global buff (e.g., +10% Strike Power or exclusive lore access).