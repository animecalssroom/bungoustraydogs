BungouArchive-Phase2Plus-CompletionDoc.docx
82.92 KB •1,456 lines
•
Formatting may be inconsistent from source

**文豪アーカイブ**

**BungouArchive**

*Phase 2+ Complete Design Document*

Gaps Filled + Duel System + Faction Wars + Reserved Characters

*横浜は、いつも雨が降っている。*

**Section 1 --- What Was Missing**

Phase 1 (Prompts 1--5) and the existing Phase 2 design (Prompts 6--12)
are strong but have eight gaps that need resolution before the game is
complete. This document fills all of them with full production-ready
specs.

  -----------------------------------------------------------------------
  **Gap**                 **Severity**            **Fix Location**
  ----------------------- ----------------------- -----------------------
  Chronicle page never    HIGH --- it\'s in the   Section 2
  specced                 main nav                

  Sakunosuke Oda missing  HIGH --- Bar Lupin      Section 3
  from roster             easter egg is broken    
                          without him             

  Reserved characters     HIGH --- Mori,          Section 4
  have no in-game         Fukuzawa, Fitzgerald,   
  presence                Fukuchi have nothing to 
                          do                      

  Observer pool UX is     MEDIUM --- players      Section 5
  empty                   stuck with no content   

  No duel discovery       HIGH --- players can\'t Section 6 (Duel System)
  mechanic                find opponents          

  Duel system needs full  HIGH --- Prompt 6       Section 6
  code spec               detail was thin         

  Faction Wars needs      HIGH --- Prompt 7       Section 7
  complete spec           detail was thin         

  Long-term progression   MEDIUM --- endgame has  Section 8
  undefined at Rank 6     no answer               

  Faction transfer UI     MEDIUM --- rule exists  Section 9
  never specced           but no flow             

  No cross-faction        LOW --- nice to have    Section 10
  individual leaderboard                          

  Chat moderation tools   MEDIUM --- mods can\'t  Section 11
  thin                    manage Transmission     
                          Logs                    
  -----------------------------------------------------------------------

**Section 2 --- The Chronicle (Missing Page Spec)**

*The Chronicle is referenced everywhere in the game --- Ango posts
there, war outcomes archive there, The Book chapters live there --- but
no prompt ever built it. This is the full spec.*

**What the Chronicle Is**

The Chronicle is Yokohama\'s permanent public record. Every major event
that happens in the game is filed here by Ango. It is read-only for all
players --- nobody submits to the Chronicle directly except Chronicle
Submissions (rank 5+) which go through mod approval. Fully public, no
login required.

**Database --- New Table**

+-----------------------------------------------------------------------+
| **SQL --- Run in Supabase editor**                                    |
|                                                                       |
| CREATE TABLE IF NOT EXISTS chronicle_entries ( id uuid PRIMARY KEY    |
| DEFAULT gen_random_uuid(), entry_number integer UNIQUE NOT NULL,      |
| title text NOT NULL, content text NOT NULL, entry_type text DEFAULT   |
| \'chapter\', \-- types: chapter \| war_record \| duel_record \|       |
| character_event \| scenario_outcome \| player_submission              |
| faction_focus text, author_id uuid REFERENCES profiles(id),           |
| is_featured boolean DEFAULT false, created_at timestamptz DEFAULT     |
| now(), published_at timestamptz ); ALTER TABLE chronicle_entries      |
| ENABLE ROW LEVEL SECURITY; CREATE POLICY \"chronicle_public_read\" ON |
| chronicle_entries FOR SELECT USING (published_at IS NOT NULL); CREATE |
| POLICY \"chronicle_owner_write\" ON chronicle_entries FOR ALL USING ( |
| EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN      |
| (\'owner\',\'mod\')) ); \-- Auto entry number CREATE SEQUENCE IF NOT  |
| EXISTS chronicle_seq START 1;                                         |
+-----------------------------------------------------------------------+

**Page Layout --- app/chronicle/page.tsx**

Fully public. No login required. Static feel --- this is a physical
archive, not a social feed.

+-----------------------------------------------------------------------+
| **Left sidebar (240px fixed):**                                       |
|                                                                       |
| -   CHRONICLE header in Space Mono                                    |
|                                                                       |
| -   THE BOOK CHAPTERS --- filtered list                               |
|                                                                       |
| -   WAR RECORDS --- filtered list                                     |
|                                                                       |
| -   CHARACTER EVENTS --- filtered list                                |
|                                                                       |
| -   DUEL RECORDS --- filtered list                                    |
|                                                                       |
| -   SCENARIO OUTCOMES --- filtered list                               |
|                                                                       |
| -   PLAYER SUBMISSIONS --- filtered list                              |
|                                                                       |
| **Main content:**                                                     |
|                                                                       |
| -   Entries in reverse chronological order                            |
|                                                                       |
| -   Each entry shows: entry number, type badge, title, date, first    |
|     120 chars                                                         |
|                                                                       |
| -   Click → full entry view                                           |
|                                                                       |
| -   Featured entries get a red left border + FEATURED stamp           |
+-----------------------------------------------------------------------+

**Full Entry View --- app/chronicle/\[entryNumber\]/page.tsx**

+-----------------------------------------------------------------------+
| **CHRONICLE ENTRY --- #\[N\]**                                        |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                             |
|                                                                       |
| *\[ENTRY TYPE BADGE\] \[FACTION FOCUS if applicable\]*                |
|                                                                       |
| **\[Title --- large Cinzel\]**                                        |
|                                                                       |
| *Filed by: Ango Sakaguchi --- Special Division Registry*              |
|                                                                       |
| \[Date in Japanese format\]                                           |
|                                                                       |
| \[Full content --- Cormorant 16px, line height 1.8\]                  |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                             |
|                                                                       |
| *This record is permanent. The city does not revise its history.*     |
+-----------------------------------------------------------------------+

**Auto-Generated Chronicle Entries**

These fire automatically and create pending Chronicle entries that Ango
reviews and approves before publishing:

  -----------------------------------------------------------------------
  **Trigger**             **Entry Type**          **Content Generated
                                                  By**
  ----------------------- ----------------------- -----------------------
  War resolves            war_record              Gemini drafts 3
                                                  sentences --- you edit
                                                  as Ango

  Character assigned      character_event         Gemini drafts 2
  (reserved only)                                 sentences about the
                                                  designation

  Duel between reserved   duel_record             Gemini drafts 4
  characters                                      sentences --- you
                                                  approve

  Scenario resolves       scenario_outcome        Gemini drafts outcome
                                                  --- you approve

  Player Chronicle        player_submission       Player\'s own writing
  Submission approved                             --- filed as-is

  Book holder changes     chapter                 Gemini drafts based on
                                                  faction activity ---
                                                  you edit
  -----------------------------------------------------------------------

**Chronicle Critical Rules**

-   All entries require Ango approval before publishing --- nothing
    auto-publishes

-   Entry numbers never reused --- even deleted drafts consume their
    number

-   Player Chronicle Submissions (rank 5+) become permanent once
    approved --- they cannot be removed

-   War records always name the winning and losing faction --- no
    neutral language

-   Entry #001 written by you manually as Ango --- it sets the tone for
    everything that follows

**Section 3 --- Sakunosuke Oda (Missing Character)**

*Oda is required for the Bar Lupin easter egg --- the deepest secret in
the game. Without him, Dazai + Ango + Oda can never simultaneously exist
and Bar Lupin never unlocks. Add him to the Agency roster now.*

**Character Profile**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                sakunosuke-oda

  Name                                Sakunosuke Oda

  Japanese                            織田作之助

  Faction                             agency

  Ability Name                        Flare

  Ability JP                          フレア

  Ability Type                        counter

  Trait Power                         3

  Trait Intel                         4

  Trait Loyalty                       5

  Trait Control                       3

  Reserved                            YES --- owner assigns manually only

  Reserved Reason                     Bar Lupin easter egg --- never
                                      auto-assigned
  -----------------------------------------------------------------------

**Duel Mechanics**

+-----------------------------------------------------------------------+
| **Passive --- Flare**                                                 |
|                                                                       |
| At the end of every round, if Oda took more damage than he dealt this |
| round, he heals 8 HP automatically. This reflects his role as someone |
| who endures --- the city\'s quiet operative who keeps going.          |
|                                                                       |
| **Special --- Flare**                                                 |
|                                                                       |
| Oda does not attack this round. Instead he observes --- predicting    |
| the opponent\'s next move type with 100% accuracy (revealed to him    |
| before the next round begins). Cooldown: once every 2 rounds.         |
|                                                                       |
| **Canon Rule --- Oda vs Dazai**                                       |
|                                                                       |
| When Oda and Dazai fight on the same team (team fights only), all of  |
| Oda\'s healing effects increase by 50%. They fought alongside each    |
| other. The registry notes this alignment.                             |
|                                                                       |
| **Canon Rule --- Oda vs Akutagawa**                                   |
|                                                                       |
| Oda deals +8 damage to Akutagawa every round. This is canon ---       |
| Oda\'s death shaped Dazai, and Akutagawa carries the consequence.     |
+-----------------------------------------------------------------------+

**SQL --- Add to Database**

  -----------------------------------------------------------------------
  \-- Add to character_profiles: INSERT INTO character_profiles
  (slug,name,faction,ability_name,ability_name_jp,ability_type,
  trait_power,trait_intel,trait_loyalty,trait_control) VALUES
  (\'sakunosuke-oda\',\'Sakunosuke Oda\',\'agency\',
  \'Flare\',\'フレア\',\'counter\',3,4,5,3) ON CONFLICT DO NOTHING; \--
  Add to reserved_characters: INSERT INTO reserved_characters (slug,
  character_name, faction, reserved_reason) VALUES
  (\'sakunosuke-oda\',\'Sakunosuke Oda\',\'agency\', \'Bar Lupin easter
  egg --- owner assigns manually only\') ON CONFLICT DO NOTHING;

  -----------------------------------------------------------------------

**Bar Lupin Unlock Logic**

Add this check to the Supabase Realtime subscription on profiles. When
all three accounts exist simultaneously with these characters assigned,
create the Bar Lupin channel.

  -----------------------------------------------------------------------
  \-- Check in Edge Function or DB trigger: \-- Fires whenever
  character_name updates on any profile CREATE OR REPLACE FUNCTION
  check_bar_lupin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS
  \$\$ DECLARE dazai_exists boolean; ango_exists boolean; oda_exists
  boolean; channel_exists boolean; BEGIN SELECT EXISTS(SELECT 1 FROM
  profiles WHERE character_match_id = \'osamu-dazai\') INTO dazai_exists;
  SELECT EXISTS(SELECT 1 FROM profiles WHERE character_match_id =
  \'ango-sakaguchi\') INTO ango_exists; SELECT EXISTS(SELECT 1 FROM
  profiles WHERE character_match_id = \'sakunosuke-oda\') INTO
  oda_exists; SELECT EXISTS(SELECT 1 FROM faction_channels WHERE slug =
  \'bar-lupin\') INTO channel_exists; IF dazai_exists AND ango_exists AND
  oda_exists AND NOT channel_exists THEN INSERT INTO faction_channels
  (slug, name, access_type) VALUES (\'bar-lupin\', \'Bar Lupin ---
  酒場ルパン\', \'buraiha_only\'); \-- Notify all three users silently
  END IF; RETURN NEW; END; \$\$; CREATE TRIGGER on_character_assign AFTER
  UPDATE OF character_name ON profiles FOR EACH ROW EXECUTE FUNCTION
  check_bar_lupin();

  -----------------------------------------------------------------------

**Section 4 --- Reserved Characters (Complete In-Game Presence)**

*Mori, Fukuzawa, Fitzgerald, Fukuchi, Fyodor, and Gogol are reserved for
owner assignment --- but right now they have no in-game presence, no
duel mechanics, and no content. This section defines everything they
need.*

**4.1 --- Ogai Mori (Port Mafia Boss)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                ogai-mori

  Ability                             Vita Sexualis

  Ability JP                          ヰタ・セクスアリス

  Type                                manipulation

  Traits                              Power 2 / Intel 5 / Loyalty 3 /
                                      Control 5
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Vita Sexualis**                                         |
|                                                                       |
| At the start of each round, Mori sees the opponent\'s current         |
| cooldown status for all abilities. He knows exactly what they can and |
| cannot use before submitting his move.                                |
|                                                                       |
| **Special --- Elise\'s Command**                                      |
|                                                                       |
| Summons Elise for one round. All incoming damage is redirected to     |
| Elise --- Mori takes 0 damage. Elise has 30 HP. If Elise\'s HP is     |
| exceeded, overflow damage hits Mori. Cooldown: once every 3 rounds.   |
|                                                                       |
| **Role in Faction Wars**                                              |
|                                                                       |
| When Mori is active in a Faction War and Mafia wins, the Mafia        |
| faction earns an additional +30 AP per member on top of the standard  |
| war reward. The boss on the battlefield changes the math.             |
|                                                                       |
| **NPC Logic (when used as a Scenario boss)**                          |
|                                                                       |
| -   Round 1: Always observes --- uses Stance to gather info           |
|                                                                       |
| -   Round 2+: Uses Elise\'s Command if HP drops below 60              |
|                                                                       |
| -   Never uses Gambit --- too calculating                             |
|                                                                       |
| -   Uses Strike when opponent is on cooldown (he always knows)        |
+-----------------------------------------------------------------------+

**4.2 --- Yukichi Fukuzawa (Agency Founder)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                yukichi-fukuzawa

  Ability                             All Men Are Equal

  Ability JP                          人の上に人を造らず

  Type                                counter

  Traits                              Power 4 / Intel 4 / Loyalty 5 /
                                      Control 4
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- All Men Are Equal**                                     |
|                                                                       |
| Fukuzawa cannot be debuffed, stunned, frozen, or have his max HP      |
| reduced by any ability. All status effects are nullified              |
| automatically. This is not a cooldown ability --- it is always        |
| active.                                                               |
|                                                                       |
| **Special --- Agency Directive**                                      |
|                                                                       |
| All Agency members in a team fight receive +10 HP heal this round. In |
| a 1v1 duel, Fukuzawa instead deals 30 damage that ignores all         |
| defense. Cooldown: once every 2 rounds.                               |
|                                                                       |
| **Role in Faction Wars**                                              |
|                                                                       |
| When Fukuzawa is active in a war, all Agency faction members earn +5% |
| bonus AP from every action taken during the war (duels, posts,        |
| logins). The founder\'s presence elevates the entire faction.         |
+-----------------------------------------------------------------------+

**4.3 --- Francis Scott Fitzgerald (Guild Boss)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                francis-fitzgerald

  Ability                             The Great Fitzgerald

  Ability JP                          グレート・フィッツジェラルド

  Type                                destruction

  Traits                              Power 5 / Intel 3 / Loyalty 2 /
                                      Control 4
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Great Fitzgerald**                                      |
|                                                                       |
| Fitzgerald starts every duel with 130 HP instead of 100. In addition, |
| every 20 HP he loses permanently grants him +3 damage on all attacks  |
| for the rest of the duel. The lower his HP, the more dangerous he     |
| becomes.                                                              |
|                                                                       |
| **Special --- Dollar Conversion**                                     |
|                                                                       |
| Fitzgerald sacrifices 20 HP to deal 65 damage --- the highest         |
| single-hit damage in the entire game. Can only be used while above 30 |
| HP. Cooldown: once every 2 rounds.                                    |
|                                                                       |
| **Role in Faction Wars**                                              |
|                                                                       |
| When Fitzgerald is active and the Guild wins a war, the Guild may     |
| claim two districts instead of one --- if the owner permits.          |
| Fitzgerald\'s resources always buy more.                              |
+-----------------------------------------------------------------------+

**4.4 --- Fukuchi Ouchi (Hunting Dogs Commander)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                fukuchi-ouchi

  Ability                             One Sword Style --- Amenogozen

  Ability JP                          一刀流天之御前

  Type                                analysis

  Traits                              Power 5 / Intel 5 / Loyalty 4 /
                                      Control 5
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Amenogozen**                                            |
|                                                                       |
| Fukuchi exists in two time states simultaneously. Once per duel, he   |
| can reverse the outcome of the last round --- changing both players\' |
| moves to Recover retroactively. This can only be used immediately     |
| after a round resolves, before the next begins.                       |
|                                                                       |
| **Special --- Time Slash**                                            |
|                                                                       |
| 45 damage. If the opponent used Strike this round, the damage becomes |
| 70 instead --- the slash arrives before they can complete their       |
| attack. Cooldown: once every 2 rounds.                                |
|                                                                       |
| **Note**                                                              |
|                                                                       |
| Fukuchi is the most mechanically complex character in the game. His   |
| time reversal passive requires careful UI implementation --- a        |
| 30-second window after round resolution where the reversal option     |
| appears on screen.                                                    |
+-----------------------------------------------------------------------+

**4.5 --- Fyodor Dostoevsky (Rats Leader)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                fyodor-dostoevsky

  Faction                             rats (hidden)

  Ability                             The Demon Descends

  Ability JP                          悪魔が降りてくる

  Type                                manipulation

  Traits                              Power 2 / Intel 5 / Loyalty 1 /
                                      Control 5
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Crime and Punishment**                                  |
|                                                                       |
| Once per war (not per duel --- per entire war), Fyodor can corrupt    |
| one enemy\'s special ability. The corrupted special fires against its |
| own user instead of their opponent. The corrupted player has no       |
| warning. This fires silently --- there is no animation, no            |
| announcement. It simply happens.                                      |
|                                                                       |
| **Duel Passive --- The Demon**                                        |
|                                                                       |
| Fyodor cannot be targeted by any ability that requires physical       |
| contact. Abilities that affect the environment (Steinbeck\'s plants,  |
| Poe\'s trap) still work. Direct damage and specials do not --- they   |
| miss by 15 HP always.                                                 |
|                                                                       |
| **Special --- The Demon Descends**                                    |
|                                                                       |
| Fyodor deals 0 damage this round but reduces the opponent\'s maximum  |
| HP by 30 for the rest of the duel. Their ceiling goes from 100 to 70  |
| (or lower if stacked with Teruko). Once per duel.                     |
|                                                                       |
| **Arena Appearance Rule**                                             |
|                                                                       |
| When Fyodor appears in Arena: players who vote FOR him lose 10 AP.    |
| Players who vote AGAINST him receive a private notification from Ango |
| reading only: \'You voted against him. The registry notes your        |
| position.\' This runs once. It has no winner.                         |
+-----------------------------------------------------------------------+

**4.6 --- Nikolai Gogol (Decay of the Angel)**

  -----------------------------------------------------------------------
  **Field**                           **Value**
  ----------------------------------- -----------------------------------
  Slug                                nikolai-gogol

  Faction                             decay (hidden)

  Ability                             The Overcoat

  Ability JP                          外套

  Type                                manipulation

  Traits                              Power 3 / Intel 4 / Loyalty 1 /
                                      Control 2
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Always Watching**                                       |
|                                                                       |
| Gogol sees the opponent\'s full move history for the entire duel from |
| round 1. Every move they have ever made in any previous duel is       |
| visible to him. This is not per-round --- it is a permanent           |
| information advantage built from the duel database.                   |
|                                                                       |
| **Special --- The Overcoat**                                          |
|                                                                       |
| Once per duel, Gogol disguises as any other character for exactly one |
| round. He selects a character from the full roster. That character\'s |
| passive and special both activate as if Gogol were them. The opponent |
| sees only a question mark where Gogol\'s character art normally is.   |
| Gogol\'s identity is revealed at round end with a Gemini-written      |
| flourish. Cooldown: once per duel.                                    |
|                                                                       |
| **Implementation Note**                                               |
|                                                                       |
| The Overcoat requires the duel resolver to accept a                   |
| character_override parameter for Gogol\'s round. This overrides       |
| passive and special resolution entirely for that round only. The UI   |
| shows \'???\' to the opponent during move submission, reveals on      |
| resolution.                                                           |
+-----------------------------------------------------------------------+

**Section 5 --- Observer Pool UX (Empty State Fixed)**

*Players whose quiz scores split evenly with no dominant faction end up
in the observer pool. Right now they see nothing and have no direction.
This defines their complete experience.*

**What Observer Pool Players See**

+-----------------------------------------------------------------------+
| **Profile page --- observer state:**                                  |
|                                                                       |
| Instead of the faction identity plate, they see:                      |
|                                                                       |
| +------------------------------------------------------------------+  |
| | **CLASSIFICATION PENDING**                                       |  |
| |                                                                  |  |
| | *Your ability signature does not conform to existing faction     |  |
| | parameters.*                                                     |  |
| |                                                                  |  |
| | *The Special Division has been notified. You are being           |  |
| | observed.*                                                       |  |
| |                                                                  |  |
| | Continue using the site. The city is still gathering data.       |  |
| +------------------------------------------------------------------+  |
|                                                                       |
| **What they CAN do while waiting:**                                   |
|                                                                       |
| -   Read the Archive --- fully accessible                             |
|                                                                       |
| -   Read approved Registry posts --- fully accessible                 |
|                                                                       |
| -   Browse the Chronicle --- fully accessible                         |
|                                                                       |
| -   View other players\' profiles --- fully accessible                |
|                                                                       |
| -   View the Yokohama Map --- fully accessible                        |
|                                                                       |
| **What they CANNOT do while waiting:**                                |
|                                                                       |
| -   Post in any faction Transmission Log --- no faction assigned      |
|                                                                       |
| -   Submit Registry posts --- requires faction assignment             |
|                                                                       |
| -   Challenge players to duels --- no character                       |
|                                                                       |
| -   Participate in wars --- no faction                                |
|                                                                       |
| **Special page --- /observer:**                                       |
|                                                                       |
| A private page only observer pool members can access. Shows:          |
|                                                                       |
| -   A single atmospheric paragraph about what the Special Division    |
|     does                                                              |
|                                                                       |
| -   \'You have been noticed. The city is patient.\' --- always this,  |
|     nothing else                                                      |
|                                                                       |
| -   A countdown showing how long they have been in the pool (days     |
|     only, no hours)                                                   |
|                                                                       |
| -   No other information --- the mystery is the content               |
+-----------------------------------------------------------------------+

**Owner Panel --- Observer Pool Management**

In /owner panel, add an Observer Pool section showing:

-   All users currently in observer pool with join date and days waiting

-   \'Assign to Faction\' button --- forces faction assignment bypassing
    quiz

-   \'Invite to Special Division\' button --- sends the Special Division
    bypass notification

-   Notes field --- owner can write private notes about each observer
    (never shown to user)

**Section 6 --- Duel System --- Complete Production Spec**

*This is the full Prompt 6 spec with all gaps filled, including duel
discovery, pre-assignment duels (Option B), the complete resolver, and
every character ability correctly implemented.*

**6.1 --- Database Schema**

  -----------------------------------------------------------------------
  \-- Duels table CREATE TABLE IF NOT EXISTS duels ( id uuid PRIMARY KEY
  DEFAULT gen_random_uuid(), challenger_id uuid REFERENCES profiles(id),
  defender_id uuid REFERENCES profiles(id), challenger_character text,
  defender_character text, challenger_faction text, defender_faction
  text, status text DEFAULT \'pending\', \-- pending \| active \|
  complete \| forfeit \| cancelled current_round integer DEFAULT 0,
  challenger_hp integer DEFAULT 100, defender_hp integer DEFAULT 100,
  challenger_max_hp integer DEFAULT 100, defender_max_hp integer DEFAULT
  100, winner_id uuid REFERENCES profiles(id), ap_awarded boolean DEFAULT
  false, is_ranked boolean DEFAULT false, is_war_duel boolean DEFAULT
  false, war_id uuid, created_at timestamptz DEFAULT now(), accepted_at
  timestamptz, completed_at timestamptz ); \-- Duel rounds table CREATE
  TABLE IF NOT EXISTS duel_rounds ( id uuid PRIMARY KEY DEFAULT
  gen_random_uuid(), duel_id uuid REFERENCES duels(id) ON DELETE CASCADE,
  round_number integer NOT NULL, challenger_move text, defender_move
  text, challenger_override_character text, \-- for Gogol Overcoat
  challenger_move_submitted_at timestamptz, defender_move_submitted_at
  timestamptz, challenger_damage_dealt integer DEFAULT 0,
  defender_damage_dealt integer DEFAULT 0, challenger_hp_after integer,
  defender_hp_after integer, special_events jsonb DEFAULT \'\[\]\', \--
  array of {type, description, value} narrative text, narrative_fallback
  boolean DEFAULT false, created_at timestamptz DEFAULT now(),
  resolved_at timestamptz, UNIQUE(duel_id, round_number) ); \-- Indexes
  CREATE INDEX idx_duels_challenger ON duels(challenger_id, status);
  CREATE INDEX idx_duels_defender ON duels(defender_id, status); CREATE
  INDEX idx_duel_rounds_duel ON duel_rounds(duel_id, round_number); \--
  RLS ALTER TABLE duels ENABLE ROW LEVEL SECURITY; ALTER TABLE
  duel_rounds ENABLE ROW LEVEL SECURITY; CREATE POLICY
  \"duels_participants\" ON duels FOR SELECT USING (auth.uid() =
  challenger_id OR auth.uid() = defender_id); CREATE POLICY
  \"duels_ranked_public\" ON duels FOR SELECT USING (is_ranked = true AND
  status = \'active\'); CREATE POLICY \"duels_insert_member\" ON duels
  FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM profiles WHERE id =
  auth.uid() AND role IN (\'member\',\'mod\',\'owner\') )); CREATE POLICY
  \"duels_update_participants\" ON duels FOR UPDATE USING (auth.uid() =
  challenger_id OR auth.uid() = defender_id); CREATE POLICY
  \"rounds_read_participants\" ON duel_rounds FOR SELECT USING (EXISTS (
  SELECT 1 FROM duels WHERE id = duel_rounds.duel_id AND (challenger_id =
  auth.uid() OR defender_id = auth.uid()) )); CREATE POLICY
  \"rounds_read_ranked\" ON duel_rounds FOR SELECT USING (EXISTS ( SELECT
  1 FROM duels WHERE id = duel_rounds.duel_id AND is_ranked = true ));

  -----------------------------------------------------------------------

**6.2 --- Duel Discovery (Missing Mechanic)**

Without a way to find opponents, nobody can duel. This is the full duel
discovery flow.

+-----------------------------------------------------------------------+
| **Page: app/duels/page.tsx**                                          |
|                                                                       |
| Three sections on this page:                                          |
|                                                                       |
| **Section A --- Your Active Duels**                                   |
|                                                                       |
| Shows all your current duels with status indicator.                   |
| Challenger/defender avatar, character name, faction, current round,   |
| whose turn it is. Direct link into each duel.                         |
|                                                                       |
| **Section B --- Challenge a Player**                                  |
|                                                                       |
| Search bar: type any username. Live search queries profiles table.    |
| Results show: username, faction kanji, character name, rank, win/loss |
| record. \'CHALLENGE\' button on each result.                          |
|                                                                       |
| Constraint: Cannot challenge someone in your own faction. Cannot      |
| challenge someone you already have an active duel with. Cannot        |
| challenge more than 3 people simultaneously.                          |
|                                                                       |
| **Section C --- Open Challenges Board**                               |
|                                                                       |
| Players can post an open challenge --- visible to all other factions. |
| Shows: challenger name, character, faction, text field for optional   |
| trash talk (50 chars max, stays in-universe). Any eligible player can |
| accept.                                                               |
|                                                                       |
| Open challenge expires after 24 hours if not accepted. Shows time     |
| remaining.                                                            |
+-----------------------------------------------------------------------+

**6.3 --- Pre-Assignment Duel State (Option B)**

+-----------------------------------------------------------------------+
| **Moveset for unassigned players:**                                   |
|                                                                       |
| -   STRIKE, STANCE, GAMBIT, RECOVER only                              |
|                                                                       |
| -   SPECIAL button renders as \'ABILITY UNREGISTERED\' --- greyed,    |
|     unclickable                                                       |
|                                                                       |
| -   No passives apply --- clean base stats only                       |
|                                                                       |
| -   Canon rivalry bonuses do not apply --- no character to trigger    |
|     them                                                              |
|                                                                       |
| **Identity in duel UI:**                                              |
|                                                                       |
| Instead of character art and name: faction crest + faction            |
| designation + rank title. Example: \'探 --- FIELD OPERATIVE\'.        |
| Intentional, not broken.                                              |
|                                                                       |
| **One-time message before first pre-assignment duel:**                |
|                                                                       |
| +------------------------------------------------------------------+  |
| | *Ability signature not yet confirmed.*                           |  |
| |                                                                  |  |
| | *Combat data will be recorded by the registry.*                  |  |
| +------------------------------------------------------------------+  |
|                                                                       |
| Shows once. Stored in localStorage. Never appears again.              |
|                                                                       |
| **Server-side enforcement:**                                          |
|                                                                       |
| Move submission endpoint checks character_name on profile. If null,   |
| rejects SPECIAL move type with 400 error. UI blocking is not enough   |
| --- enforce server-side.                                              |
|                                                                       |
| **What feeds back into assignment:**                                  |
|                                                                       |
| duel_style scores update normally from pre-assignment duels. Gambit   |
| usage, Strike usage, Stance usage all recorded. These become          |
| meaningful input to Gemini when assignment fires at 20 events.        |
+-----------------------------------------------------------------------+

**6.4 --- The Duel Resolver (Edge Function)**

Create: supabase/functions/resolve-duel-round/index.ts

CRITICAL: Gemini narrates. Code resolves. These two jobs never mix.

+-----------------------------------------------------------------------+
| **Resolution Order (server-side, every round):**                      |
|                                                                       |
| 1\. Validate both moves submitted (or apply auto-Stance if timer      |
| expired)                                                              |
|                                                                       |
| 2\. Check Gogol Overcoat --- if active, resolve as override character |
|                                                                       |
| 3\. Apply ability type modifiers (Counter 150%, Manipulation 20%      |
| peek, Analysis 30% predict)                                           |
|                                                                       |
| 4\. Apply character passives (in this order: pre-round, on-damage,    |
| post-round)                                                           |
|                                                                       |
| 5\. Apply canon rivalry bonuses if applicable matchup                 |
|                                                                       |
| 6\. Calculate final damage both directions                            |
|                                                                       |
| 7\. Apply HP changes, update cooldowns, record special_events         |
|                                                                       |
| 8\. Check win condition (HP \<= 0 or round 5 complete)                |
|                                                                       |
| 9\. THEN call Gemini for narrative (never before step 8)              |
|                                                                       |
| 10\. Write round record to duel_rounds table                          |
|                                                                       |
| 11\. Broadcast Realtime update to both players                        |
+-----------------------------------------------------------------------+

**6.5 --- Damage Calculation Reference**

  -----------------------------------------------------------------------
  **Move**          **Damage Dealt**  **Damage          **Notes**
                                      Received**        
  ----------------- ----------------- ----------------- -----------------
  STRIKE            25-35 (random     Full incoming     Most common. No
                    roll)                               modifiers from
                                                        move alone.

  STANCE            10-15 (random     60% of incoming   Counter types get
                    roll)             (40% reduction)   150% counter-dmg
                                                        vs Strike

  GAMBIT            0 or 50 (coin     Full incoming     Tachihara
                    flip)                               passive: 60% win
                                                        instead of 50%

  SPECIAL           Varies per        Varies per        Blocked if on
                    character         character         cooldown --- 400
                                                        error server-side

  RECOVER           0                 Full incoming     Heals +20 HP.
                                                        Cannot use two
                                                        rounds in a row.
  -----------------------------------------------------------------------

**6.6 --- Timer and Auto-Resolution**

+-----------------------------------------------------------------------+
| **30-minute round timer:**                                            |
|                                                                       |
| -   Timer starts when BOTH players have seen the current round state  |
|     (Realtime confirmed)                                              |
|                                                                       |
| -   If timer expires: auto-Stance fires for the player who did not    |
|     submit                                                            |
|                                                                       |
| -   Three consecutive auto-Stances from the same player: auto-forfeit |
|                                                                       |
| -   Auto-forfeit: forfeiter -20 AP, opponent +50 AP, duel marked      |
|     forfeit                                                           |
|                                                                       |
| **Timer implementation:**                                             |
|                                                                       |
| Store round_deadline timestamptz in duel_rounds when round starts.    |
| Cron job runs every 5 minutes checking for expired rounds. Do not     |
| rely on client-side timers for resolution --- server always           |
| authoritative.                                                        |
+-----------------------------------------------------------------------+

**6.7 --- AP Resolution on Duel End**

  -----------------------------------------------------------------------
  **Outcome**             **Winner AP**           **Loser AP**
  ----------------------- ----------------------- -----------------------
  Standard win            +50 AP                  -20 AP (min 0)

  Comeback win (won from  +75 AP                  -20 AP (min 0)
  below 20 HP at any                              
  point)                                          

  Draw (equal HP after    +5 AP (consolation)     +5 AP (consolation)
  round 5)                                        

  Forfeit/timeout win     +50 AP                  -20 AP (min 0)

  War duel win (during    +50 AP + 3 war points   -20 AP (min 0)
  active war)                                     
  -----------------------------------------------------------------------

**6.8 --- Gemini Narrative Integration**

+-----------------------------------------------------------------------+
| **Gemini Prompt Structure for Round Narrative:**                      |
|                                                                       |
| You are the Yokohama ability registry\'s combat recorder. Write       |
| exactly 2 sentences describing this round of combat. Do not mention   |
| HP numbers, damage values, or AP. Write in the present tense.         |
| Literary, cold, precise. Match the tone of Bungo Stray Dogs anime.    |
| FIGHTER A: \[character_name\] --- \[ability_type\] type FIGHTER B:    |
| \[character_name\] --- \[ability_type\] type WHAT HAPPENED THIS       |
| ROUND: Fighter A used: \[move\] --- \[damage_dealt\] damage dealt     |
| Fighter B used: \[move\] --- \[damage_dealt\] damage dealt Special    |
| events: \[list any passive triggers, special fires, canon bonuses\]   |
| Round winner (more damage): \[A/B/tied\] SETTING: \[district if war   |
| duel, otherwise \'Yokohama\'\] Return only the 2-sentence narrative.  |
| No preamble. No explanation.                                          |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Gemini failure handling --- ALWAYS define fallback before           |
| calling:**                                                            |
|                                                                       |
|   ------------------------------------------------------------------  |
|   const fallback = \`\${charA} and \${charB} exchanged blows. The     |
|   registry notes this outcome.\` try { const narrative = await        |
|   callGemini(prompt) // use narrative } catch { // use fallback ---   |
|   game always continues }                                             |
|                                                                       |
|   ------------------------------------------------------------------  |
|                                                                       |
| Gemini has a 5000ms timeout maximum. If it does not respond in 5      |
| seconds, use the fallback. Never block the client waiting for Gemini. |
+-----------------------------------------------------------------------+

**6.9 --- Duel Page UI Layout**

+-----------------------------------------------------------------------+
| **app/duels/\[duelId\]/page.tsx --- Layout:**                         |
|                                                                       |
| TOP ROW: \[Challenger art/crest \| faction\] vs \[Defender art/crest  |
| \| faction\]                                                          |
|                                                                       |
| HP BARS: Both visible at all times. No numbers --- just bars. Colors: |
| faction color.                                                        |
|                                                                       |
| ROUND INDICATOR: Round 1/5 --- center top                             |
|                                                                       |
| MOVE BUTTONS: 5 buttons. SPECIAL greyed if on cooldown or unassigned. |
| RECOVER greyed if used last round. GAMBIT shows 50% or Tachihara\'s   |
| 60%.                                                                  |
|                                                                       |
| WAITING STATE: After submitting, show \'Move submitted. Awaiting      |
| opponent.\' Do not reveal what was submitted.                         |
|                                                                       |
| ROUND HISTORY: Accordion below. Each round collapsible. Shows: both   |
| moves, damage, narrative. Opens automatically after each round        |
| resolves.                                                             |
|                                                                       |
| NARRATIVE CENTER: Between HP bars. Cormorant italic. 2 sentences.     |
| Fades in after round resolves.                                        |
|                                                                       |
| **Realtime subscription:**                                            |
|                                                                       |
| Subscribe to duel_rounds INSERT for this duel_id. When new round      |
| record appears: animate HP bars, fade in narrative, unlock move       |
| buttons for next round. Unsubscribe on unmount.                       |
+-----------------------------------------------------------------------+

**Section 7 --- Faction Wars --- Complete Production Spec**

*Full Prompt 7 spec with complete database schema, war resolution logic,
point calculation, and owner panel controls.*

**7.1 --- Database Schema**

  -----------------------------------------------------------------------
  CREATE TABLE IF NOT EXISTS faction_wars ( id uuid PRIMARY KEY DEFAULT
  gen_random_uuid(), faction_a text NOT NULL, faction_b text NOT NULL,
  status text DEFAULT \'pending\', \-- pending \| active \| day2 \| day3
  \| complete stakes text NOT NULL, \-- district \| ap_multiplier \|
  registry_priority \| narrative stakes_detail jsonb, \-- {district:
  \'chinatown\'} or {multiplier: 20, days: 3} etc faction_a_points
  integer DEFAULT 0, faction_b_points integer DEFAULT 0, winner text,
  triggered_by uuid REFERENCES profiles(id), war_message text, \--
  Ango\'s declaration text starts_at timestamptz NOT NULL, day2_at
  timestamptz, day3_at timestamptz, ends_at timestamptz NOT NULL,
  resolved_at timestamptz, chronicle_entry_id uuid, created_at
  timestamptz DEFAULT now() ); CREATE TABLE IF NOT EXISTS
  war_contributions ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid REFERENCES faction_wars(id) ON DELETE CASCADE, user_id uuid
  REFERENCES profiles(id), faction text NOT NULL, contribution_type text
  NOT NULL, \-- duel_win \| registry_post \| daily_login \| team_fight \|
  boss_fight points_awarded integer DEFAULT 0, reference_id uuid, \--
  duel_id or registry_post_id for tracking created_at timestamptz DEFAULT
  now() ); CREATE INDEX idx_war_contributions_war ON
  war_contributions(war_id, faction); CREATE INDEX
  idx_war_contributions_user ON war_contributions(user_id, war_id); ALTER
  TABLE faction_wars ENABLE ROW LEVEL SECURITY; ALTER TABLE
  war_contributions ENABLE ROW LEVEL SECURITY; CREATE POLICY
  \"wars_public_read\" ON faction_wars FOR SELECT USING (true); CREATE
  POLICY \"wars_owner_write\" ON faction_wars FOR ALL USING ( EXISTS
  (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = \'owner\') );
  CREATE POLICY \"contributions_own_read\" ON war_contributions FOR
  SELECT USING (auth.uid() = user_id); CREATE POLICY
  \"contributions_public_aggregate\" ON war_contributions FOR SELECT
  USING (true); \-- individual contributions are public --- total points
  are public

  -----------------------------------------------------------------------

**7.2 --- War Point System (Complete)**

  -----------------------------------------------------------------------
  **Action**        **Points**        **Limit**         **Notes**
  ----------------- ----------------- ----------------- -----------------
  Win a duel vs     3 pts             No limit          Duel must be
  enemy faction                                         flagged
  member                                                is_war_duel =
                                                        true

  Approved Registry 2 pts             2 posts per       Mod marks post as
  post                                player per war    war-related on
  (war-related)                                         approval

  Daily login       1 pt              Once per day per  Auto-awards via
  during active war                   player            login event

  Win a Tag Team    5 pts             No limit          Unlocks Day 2
  fight vs enemy                                        

  Win a Faction     5 pts             No limit          Unlocks Day 2,
  Raid vs enemy                                         requires 3+
                                                        members

  Win the Boss      Auto war win      Once per war      Overrides all
  Fight on Day 3                                        point standings
  -----------------------------------------------------------------------

**7.3 --- War Timeline and Day Transitions**

+-----------------------------------------------------------------------+
| **Day 1 (Hours 0--24):**                                              |
|                                                                       |
| -   Individual duels earn war points                                  |
|                                                                       |
| -   Registry posts about the conflict open for submission (mod marks  |
|     war-related on approval)                                          |
|                                                                       |
| -   Ango posts the war declaration in Chronicle                       |
|                                                                       |
| -   War strip in each faction\'s space shows live points via Realtime |
|                                                                       |
| -   Players from non-warring factions can spectate but earn nothing   |
|                                                                       |
| **Day 2 (Hours 24--48):**                                             |
|                                                                       |
| -   Tag Team (2v2) fights unlock --- worth 5 points each              |
|                                                                       |
| -   Faction Raid (3v3) unlocks if both factions have 3+ members       |
|                                                                       |
| -   Arena matchup can run simultaneously if owner schedules one       |
|                                                                       |
| -   Point gap starts mattering --- faction trailing needs team fights |
|     to catch up                                                       |
|                                                                       |
| **Day 3 (Hours 48--72):**                                             |
|                                                                       |
| -   Boss Fight unlocks --- faction leaders (highest AP in faction)    |
|     challenge the boss                                                |
|                                                                       |
| -   Boss Fight win = automatic war victory regardless of points       |
|                                                                       |
| -   If no Boss Fight triggered: highest points at 72hr wins           |
|                                                                       |
| -   War auto-resolves via cron job at the 72-hour mark                |
|                                                                       |
| **Cron job schedule:**                                                |
|                                                                       |
| Run every 30 minutes. Checks: any war with ends_at in the past and    |
| status != complete. Resolve it. Award AP. Update map districts.       |
| Create Chronicle entry draft for Ango.                                |
+-----------------------------------------------------------------------+

**7.4 --- War Resolution Logic**

+-----------------------------------------------------------------------+
| **Edge Function: resolve-war/index.ts**                               |
|                                                                       |
| 1\. Determine winner (boss_fight_win flag OR higher points) 2. If     |
| tied: defending faction wins (they held the territory) 3. Award AP: - |
| Winner faction: +100 AP each member - Loser faction: +20 AP           |
| consolation each member - Top contributor each side: +50 AP bonus 4.  |
| Update district ownership if stakes = \'district\' 5. Apply AP        |
| multiplier if stakes = \'ap_multiplier\' 6. Log faction_activity for  |
| both factions 7. Generate Chronicle entry draft (Gemini) --- status = |
| \'draft\' 8. Notify all participants via notifications table 9. Post  |
| Ango notification to owner: \'War resolved. Chronicle draft ready.\'  |
| 10. Mark war status = \'complete\', set resolved_at                   |
+-----------------------------------------------------------------------+

**7.5 --- Owner Panel --- War Controls**

+-----------------------------------------------------------------------+
| **app/owner/wars/page.tsx --- what the owner sees:**                  |
|                                                                       |
| **Start New War form:**                                               |
|                                                                       |
| -   Faction A dropdown (all 4 main factions)                          |
|                                                                       |
| -   Faction B dropdown (cannot select same as A, cannot select last   |
|     war pairing)                                                      |
|                                                                       |
| -   Stakes selector: District \| AP Multiplier \| Registry Priority   |
|     \| Narrative Consequence                                          |
|                                                                       |
| -   Stakes detail: e.g. district name dropdown, multiplier percentage |
|     input                                                             |
|                                                                       |
| -   War declaration text (pre-fills with Ango template, editable)     |
|                                                                       |
| -   Start immediately OR schedule for specific time                   |
|                                                                       |
| -   \[DECLARE WAR\] button --- triggers war, posts Ango declaration,  |
|     notifies both factions                                            |
|                                                                       |
| **Active War panel:**                                                 |
|                                                                       |
| -   Live points display with faction colors                           |
|                                                                       |
| -   Contribution breakdown --- who earned what                        |
|                                                                       |
| -   \[TRIGGER DAY 2\] manual override if needed                       |
|                                                                       |
| -   \[TRIGGER BOSS FIGHT\] button on Day 3                            |
|                                                                       |
| -   \[END WAR EARLY\] emergency option --- auto-resolves by current   |
|     points                                                            |
|                                                                       |
| **Boss Fight setup:**                                                 |
|                                                                       |
| -   NPC Character selector (any reserved character)                   |
|                                                                       |
| -   Difficulty: Easy (80HP) \| Normal (100HP) \| Hard (130HP) \|      |
|     Extreme (150HP)                                                   |
|                                                                       |
| -   Available to: Faction A \| Faction B \| Both                      |
|                                                                       |
| -   \[ACTIVATE BOSS FIGHT\] --- posts Ango notification, opens boss   |
|     fight duel flow                                                   |
+-----------------------------------------------------------------------+

**7.6 --- War Strip Component**

+-----------------------------------------------------------------------+
| **components/war/WarStrip.tsx --- shown in faction space during       |
| active war:**                                                         |
|                                                                       |
| Sits above the faction bulletin. Red background. Compact. Always      |
| visible during war.                                                   |
|                                                                       |
| +------------------------------------------------------------------+  |
| | **WAR ACTIVE --- Agency vs Mafia --- 31:24:07 remaining**        |  |
| |                                                                  |  |
| | 探 Agency 47 pts \|\|\|\|\|\|\|\|\|\|\| 39 pts Mafia 港          |  |
| |                                                                  |  |
| | *Stakes: Harbor District control*                                |  |
| +------------------------------------------------------------------+  |
|                                                                       |
| -   Updates via Realtime subscription to faction_wars and             |
|     war_contributions                                                 |
|                                                                       |
| -   Countdown timer client-side (cosmetic only --- server resolves at |
|     correct time)                                                     |
|                                                                       |
| -   Hidden for non-warring factions --- shows only to faction_a and   |
|     faction_b members                                                 |
|                                                                       |
| -   Shows Day 2 / Day 3 unlock countdown once war passes 24hrs        |
+-----------------------------------------------------------------------+

**Section 8 --- Long-Term Progression (Endgame)**

*What happens when a player reaches Rank 6 and 10,000 AP? Right now
there is no answer. This defines the endgame.*

**Prestige System --- City Veteran**

+-----------------------------------------------------------------------+
| **At 10,000 AP (Rank 6), players unlock:**                            |
|                                                                       |
| -   A special designation appended to their rank title. Example:      |
|     \'Executive Agent --- Yokohama Veteran\'                          |
|                                                                       |
| -   A unique profile badge visible to all --- a city seal in their    |
|     faction color                                                     |
|                                                                       |
| -   Access to submit Chronicle Submissions (if not already at rank 5  |
|     --- this also unlocks at rank 5)                                  |
|                                                                       |
| -   Their profile gets a subtle gold border in the roster view        |
|                                                                       |
| -   Ango sends a private notification: \'The city has recorded your   |
|     tenure. Very few reach this point.\'                              |
|                                                                       |
| **After 10,000 AP --- AP keeps accumulating but with a new purpose:** |
|                                                                       |
| -   Every 1,000 AP above 10,000 earns one \'City Token\'              |
|                                                                       |
| -   City Tokens can be spent once per month to: name a Yokohama       |
|     district event (Ango posts it as canon), request a specific Arena |
|     matchup, or nominate a Registry post for featured status          |
|                                                                       |
| -   City Tokens do not roll over --- spend them or lose them monthly  |
|                                                                       |
| -   This gives endgame players agency over the world\'s story without |
|     breaking game balance                                             |
+-----------------------------------------------------------------------+

**Seasonal Resets --- Optional**

After the first 3 months of operation, consider a soft seasonal reset:

-   AP resets to 500 (keeps Rank 2 so nobody loses faction transfer
    eligibility)

-   Rank titles reset but a \'Season 1\' badge is permanently added to
    profiles that hit Rank 4+

-   District control resets to default positions --- new wars decide
    everything again

-   Characters stay assigned --- no reset on character identity

This is optional and should only happen if the game has been active for
3+ months. Do not reset early.

**Section 9 --- Faction Transfer UI**

*The rule is locked: 30 days active + 500 AP + one lifetime transfer.
But no page exists to execute it.*

**Transfer Flow**

+-----------------------------------------------------------------------+
| **Entry point: Settings page → \'Request Faction Transfer\' (only     |
| visible if eligible)**                                                |
|                                                                       |
| **Eligibility check (all must be true):**                             |
|                                                                       |
| -   profile.created_at is more than 30 days ago                       |
|                                                                       |
| -   profile.ap_total \>= 500                                          |
|                                                                       |
| -   profile.transfer_used = false                                     |
|                                                                       |
| -   No active war involving current faction                           |
|                                                                       |
| **Transfer page --- app/settings/transfer/page.tsx:**                 |
|                                                                       |
| +------------------------------------------------------------------+  |
| | **FACTION TRANSFER REQUEST**                                     |  |
| |                                                                  |  |
| | ━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                     |  |
| |                                                                  |  |
| | **This transfer is permanent and irreversible.**                 |  |
| |                                                                  |  |
| | You have one lifetime transfer. This is it.                      |  |
| |                                                                  |  |
| | Current faction: \[faction name\]                                |  |
| |                                                                  |  |
| | Current character: \[character name\] --- will be released back  |  |
| | to the pool                                                      |  |
| |                                                                  |  |
| | AP: \[current AP\] --- will not reset                            |  |
| |                                                                  |  |
| | Select new faction: \[dropdown --- all 4 main factions except    |  |
| | current\]                                                        |  |
| |                                                                  |  |
| | Type your username to confirm: \[text input\]                    |  |
| |                                                                  |  |
| | **\[TRANSFER FACTION\]**                                         |  |
| +------------------------------------------------------------------+  |
|                                                                       |
| **On confirmation:**                                                  |
|                                                                       |
| 1.  Verify username matches --- reject if not                         |
|                                                                       |
| 2.  Set transfer_used = true, old_faction = current faction           |
|                                                                       |
| 3.  Set faction = new faction, character_name = null (released)       |
|                                                                       |
| 4.  Reset behavior_scores to new baseline (keep quiz scores, zero out |
|     post-quiz deltas)                                                 |
|                                                                       |
| 5.  Redirect to new faction space                                     |
|                                                                       |
| 6.  Notify user: \'Transfer confirmed. Your character has been        |
|     released. The city will observe you again.\'                      |
|                                                                       |
| 7.  Ango gets owner notification with transfer details                |
+-----------------------------------------------------------------------+

**Section 10 --- Cross-Faction Leaderboard**

**Page: app/leaderboard/page.tsx**

Public. No login required. Three tabs:

+-----------------------------------------------------------------------+
| **Tab 1 --- AP Rankings:**                                            |
|                                                                       |
| Top 20 players by total AP across all factions. Shows: rank number,   |
| username, faction kanji, character name, rank title, AP total.        |
| Updates daily (not real-time --- no need for live updates here).      |
|                                                                       |
| **Tab 2 --- Duel Records:**                                           |
|                                                                       |
| Top 20 players by duel win rate (minimum 5 duels played to qualify).  |
| Shows: rank, username, faction kanji, character, W/L record, win rate |
| percentage.                                                           |
|                                                                       |
| **Tab 3 --- Faction Standings:**                                      |
|                                                                       |
| Not individual --- faction totals. Shows: faction name, kanji, total  |
| AP across all members, district count, war record (W/L). This is the  |
| macro-level view of who is dominating.                                |
|                                                                       |
| **What is NOT shown:**                                                |
|                                                                       |
| -   Individual behavior scores --- always private                     |
|                                                                       |
| -   Registry post count --- creates incentive to spam low-quality     |
|     posts                                                             |
|                                                                       |
| -   Observer pool members --- they have no faction, exclude from all  |
|     tabs                                                              |
+-----------------------------------------------------------------------+

**Section 11 --- Chat Moderation Tools**

*The Registry mod queue is solid. Transmission Logs have no tools. This
fills the gap.*

**Transmission Log Moderation**

+-----------------------------------------------------------------------+
| **Mod controls (visible only to mod/owner in the faction\'s           |
| Transmission Log):**                                                  |
|                                                                       |
| -   Every message has a \[⋯\] menu visible only to mods --- not to    |
|     regular members                                                   |
|                                                                       |
| -   \[DELETE MESSAGE\] --- soft deletes, message shows as \'This      |
|     transmission has been redacted.\' in italic                       |
|                                                                       |
| -   \[WARN USER\] --- sends private notification to user: \'The       |
|     registry has flagged a transmission. Exercise judgment.\'         |
|                                                                       |
| -   \[MUTE USER\] --- prevents user from posting in Transmission Log  |
|     for 24 hours. Stored as profile flag.                             |
|                                                                       |
| -   \[ESCALATE TO OWNER\] --- sends owner a notification with the     |
|     message content and a link                                        |
|                                                                       |
| **Database additions:**                                               |
|                                                                       |
|   ------------------------------------------------------------------  |
|   ALTER TABLE faction_messages ADD COLUMN IF NOT EXISTS deleted       |
|   boolean DEFAULT false, ADD COLUMN IF NOT EXISTS deleted_by uuid     |
|   REFERENCES profiles(id), ADD COLUMN IF NOT EXISTS deleted_at        |
|   timestamptz; CREATE TABLE IF NOT EXISTS chat_mutes ( id uuid        |
|   PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES      |
|   profiles(id), faction text, muted_by uuid REFERENCES profiles(id),  |
|   muted_until timestamptz NOT NULL, reason text, created_at           |
|   timestamptz DEFAULT now() );                                        |
|                                                                       |
|   ------------------------------------------------------------------  |
|                                                                       |
| **Realtime update on delete:**                                        |
|                                                                       |
| When a message is deleted, the Realtime subscription triggers a UI    |
| update replacing the message content with the redacted line. No full  |
| page reload needed.                                                   |
+-----------------------------------------------------------------------+

**Section 12 --- Updated Complete Build Order**

*All Phase 2 prompts with gaps filled in, in the correct sequence.*

  -----------------------------------------------------------------------
  **Priority**      **Build Item**    **Depends On**    **Estimated Codex
                                                        Prompts**
  ----------------- ----------------- ----------------- -----------------
  1                 Character         Prompts 1-5       1 prompt
                    Assignment        complete          
                    Enrichment (quiz                    
                    scores,                             
                    lore_topics,                        
                    Gemini rewrite,                     
                    20-event                            
                    threshold)                          

  2                 Sakunosuke Oda    Assignment        Part of prompt
                    --- add to DB +   enrichment        above
                    Bar Lupin trigger                   

  3                 Duel System       Assignment done   2 prompts
                    (Section 6 full                     
                    spec + Option B +                   
                    duel discovery)                     

  4                 Chronicle Page    Duels done        1 prompt
                    (Section 2)                         

  5                 Faction Wars      Duels done        1 prompt
                    (Section 7 full                     
                    spec)                               

  6                 Observer Pool UX  Wars done         Part of another
                    (Section 5)                         prompt

  7                 Arena (existing   Wars done         1 prompt
                    Prompt 8 spec)                      

  8                 Scenario Engine   Arena done        1 prompt
                    (existing Prompt                    
                    9 spec)                             

  9                 Yokohama Map      Scenarios done    1 prompt
                    (existing Prompt                    
                    10 spec)                            

  10                The Book          Map done          1 prompt
                    (existing Prompt                    
                    11 spec)                            

  11                Faction Transfer  Any point after   Part of settings
                    UI (Section 9)    duels             prompt

  12                Leaderboard       Duels done        1 prompt
                    (Section 10)                        

  13                Chat Moderation   Any point         Part of faction
                    Tools (Section                      space update
                    11)                                 

  14                Long-term         Rank 6 reached by Add when needed
                    Progression /     a player          
                    Prestige (Section                   
                    8)                                  

  15                Hidden Faction    Everything done   1 prompt
                    Triggers                            
                    (existing Prompt                    
                    12 spec)                            

  16                Reserved          Hidden factions   Part of Prompt 12
                    Character duel    done              
                    mechanics                           
                    (Section 4)                         
  -----------------------------------------------------------------------

*横浜は、いつも雨が降っている。*

BungouArchive --- 文豪アーカイブ

*Phase 2+ Complete Design Document*