**文豪アーカイブ**

**BungouArchive**

*Master Game Bible --- Complete Build Guide v2*

+-----------------------------------------------------------------------+
| **SINGLE SOURCE OF TRUTH**                                            |
|                                                                       |
| Prompts 1-5 complete · All gaps filled · Prompts 6-12 full spec ·     |
| Reserved characters · DO / DON\'T rules                               |
+-----------------------------------------------------------------------+

*横浜は、いつも雨が降っている。*

**Contents**

**Part One --- Context & Current Status**

*Paste this entire block at the start of every new Codex / Claude
conversation to give full context instantly.*

+-----------------------------------------------------------------------+
| **CONTEXT BLOCK --- PASTE AT START OF EVERY NEW CHAT**                |
|                                                                       |
| I am building BungouArchive (文豪アーカイブ) --- a private BSD fan    |
| game for 12-13 friends.                                               |
|                                                                       |
| Tech: Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel, Gemini  |
| API.                                                                  |
|                                                                       |
| Auth: Google OAuth + Email/Password. No Discord.                      |
|                                                                       |
| AI: Gemini API server-side only. Never client-side.                   |
|                                                                       |
| Animations: Framer Motion + GSAP.                                     |
|                                                                       |
| WHAT IS BUILT --- Prompts 1-5 COMPLETE:                               |
|                                                                       |
| \- Prompt 1: Atmosphere (CSS tokens, fonts, RainLayer, InkTransition, |
| KanjiReveal, SoundToggle, time-based theme)                           |
|                                                                       |
| \- Prompt 2: Faction private space (bulletin, live feed, roster,      |
| transmission log, war strip, RLS confirmed)                           |
|                                                                       |
| \- Prompt 3: Profile page + character assignment system (behavior     |
| scores, Gemini + distance fallback, CharacterReveal, RankUpFlash,     |
| ObservationMeter, DailyLoginRitual, FloatingAP, NotificationBell)     |
|                                                                       |
| \- Prompt 4: Archive (public character encyclopedia, case file        |
| format, hidden visit tracking)                                        |
|                                                                       |
| \- Prompt 5: Registry (incident reports, Gemini review, mod queue, AP |
| rewards, thread system)                                               |
|                                                                       |
| \- Owner setup page (/setup/owner --- permanently closed after first  |
| use)                                                                  |
|                                                                       |
| \- Special Division direct access flow                                |
|                                                                       |
| \- Landing page opening narrative                                     |
|                                                                       |
| \- Optimisation pass complete                                         |
|                                                                       |
| CURRENT PHASE: Building Prompt 6+ (Duel System onwards)               |
|                                                                       |
| CHARACTER ASSIGNMENT: Now uses 20-event threshold (not 10), quiz      |
| scores as baseline, lore_topics tracking, enriched Gemini prompt,     |
| adaptive threshold, secondary match on profile.                       |
|                                                                       |
| 5 factions: agency, mafia, guild, hunting_dogs, special_div           |
|                                                                       |
| 3 hidden factions: rats, decay, clock_tower (owner triggers only)     |
|                                                                       |
| Reserved characters: Mori, Fukuzawa, Fitzgerald, Fukuchi, Fyodor,     |
| Gogol, Ango, Oda                                                      |
|                                                                       |
| Owner account: personal Gmail, role=owner, no character, invisible    |
| --- NOBODY knows this exists.                                         |
|                                                                       |
| Ango account: karmabanae@gmail.com, role=mod, faction=special_div,    |
| character=Ango Sakaguchi                                              |
|                                                                       |
| Chrome = Ango (public). Firefox = Owner (invisible). ALWAYS keep      |
| separate.                                                             |
+-----------------------------------------------------------------------+

**Locked Decisions --- Never Change These**

*These are permanent. Codex must never deviate from them regardless of
what seems simpler.*

  -------------------------------------------------------------------------------
  **Decision**             **Value**              **Why It\'s Locked**
  ------------------------ ---------------------- -------------------------------
  Username format          6-20 chars,            Auth and routing depend on this
                           alphanumeric +         format
                           underscore only        

  User cap                 100 total (5 factions  Scarcity is intentional ---
                           × 20 slots)            creates value

  Quiz                     7 questions,           Prevents gaming the faction
                           server-side scoring,   assignment
                           no back button         

  AP thresholds            0 / 100 / 500 / 1500 / Calibrated for 12-13 active
                           4000 / 10000           players

  Character assignment     20 events → behavior   Enriched system --- do not
                           scores → Gemini →      revert to 10 events
                           distance fallback      

  Faction locking          Permanent, one         Permanence creates attachment
                           lifetime transfer (30  
                           days + 500 AP)         

  Special Division         No auto assignment,    Mystery is the mechanic
                           observer pool → owner  
                           invites only           

  Hidden factions          Rats, Decay, Clock     Never auto-assign or mention
                           Tower --- owner        publicly
                           triggers only          

  Owner account            Ghost --- zero public  Identity must never be revealed
                           presence, no           
                           character, no faction  

  Ango account             karmabanae@gmail.com   This is your in-game persona
                           --- public face, mod   
                           of Special Division    

  Gemini role              Narrates only. Code    Critical --- never let Gemini
                           resolves ALL game      decide game state
                           outcomes.              

  Same faction duels       Not allowed ---        Prevents faction members
                           cross-faction only     sandbagging each other

  Corruption move          Dazai + Chuuya, 999    Sacred --- treat as a legendary
                           damage, ONE use in     event
                           game history ever      

  Bar Lupin                Dazai + Ango + Oda     The deepest secret in the game
                           simultaneously ---     
                           hidden channel         
                           unlocks, never         
                           announced              
  -------------------------------------------------------------------------------

**Master DO / DON\'T Rules**

+-----------------------------------+-----------------------------------+
| **✅ ALWAYS DO**                  | **❌ NEVER DO**                   |
|                                   |                                   |
| -   Code resolves game outcomes   | -   Let Gemini decide damage, HP, |
|     --- Gemini narrates only      |     win/loss, or any game state   |
|                                   |                                   |
| -   Define fallback strings       | -   Call Gemini before code has   |
|     BEFORE every Gemini call      |     resolved the round outcome    |
|                                   |                                   |
| -   5000ms Gemini timeout with    | -   Auto-assign Special Division  |
|     try/catch on every call       |     --- owner only, always        |
|                                   |                                   |
| -   Server-side validation on     | -   Auto-assign reserved          |
|     every game action --- never   |     characters --- owner only via |
|     trust client                  |     SQL or owner panel            |
|                                   |                                   |
| -   Realtime subscriptions        | -   Reveal owner account to       |
|     cleaned up on unmount (return |     anyone including mods         |
|     ()=\>removeChannel)           |                                   |
|                                   | -   Allow same-faction duels      |
| -   Specific .select() columns on |                                   |
|     all Supabase queries ---      | -   Use .select(\'\*\') on list   |
|     never .select(\'\*\') on      |     queries                       |
|     lists                         |                                   |
|                                   | -   Allow Special move submission |
| -   All list queries have         |     from unassigned players       |
|     .limit() set                  |     (block server-side)           |
|                                   |                                   |
| -   RLS enforced ---              | -   Trigger CharacterReveal more  |
|     cross-faction reads blocked   |     than once per account         |
|                                   |                                   |
| -   Reserved characters filtered  | -   Trigger RankUpFlash on        |
|     BEFORE Gemini AND distance    |     initial page load             |
|     fallback                      |                                   |
|                                   | -   Let Gemini run without a      |
| -   Use next/font for all three   |     fallback string defined first |
|     fonts --- never \<link\> tags |                                   |
|                                   | -   Block client response waiting |
| -   Dynamic imports with          |     for Gemini                    |
|     ssr:false for                 |                                   |
|     CharacterReveal, RankUpFlash, | -   Put API keys in client-side   |
|     KanjiReveal                   |     code --- server-side only     |
|                                   |                                   |
| -   Error boundaries around       | -   Allow faction transfer during |
|     faction space, profile, quiz, |     active war                    |
|     registry                      |                                   |
|                                   | -   Let AP go below 0 --- minimum |
| -   Loading state on every        |     is always 0                   |
|     data-fetching page            |                                   |
|     (\'ACCESSING REGISTRY\...\')  | -   Allow rank to decrease ---    |
|                                   |     rank only increases           |
| -   Keep Chrome = Ango, Firefox = |                                   |
|     Owner --- always, muscle      | -   Mix Ango account with owner   |
|     memory                        |     actions --- separate browsers |
|                                   |     always                        |
| -   CharacterReveal localStorage  |                                   |
|     gate --- fires exactly once,  |                                   |
|     never again                   |                                   |
|                                   |                                   |
| -   DailyLoginRitual localStorage |                                   |
|     gate --- once per day         |                                   |
|                                   |                                   |
| -   RankUpFlash only on live      |                                   |
|     Realtime rank change ---      |                                   |
|     NEVER on page load            |                                   |
+-----------------------------------+-----------------------------------+

**Part Two --- Gaps Filled (Build These Into Prompts 6-12)**

*These gaps existed in the original design. Each is fully specced here
and must be built alongside the relevant prompt --- not deferred.*

  -----------------------------------------------------------------------------
  **Gap**                **Severity**        **Build With**   **Status**
  ---------------------- ------------------- ---------------- -----------------
  Sakunosuke Oda missing CRITICAL --- Bar    Character        SPECCED ---
  from roster            Lupin egg broken    assignment       Section 2.1
                                             enrichment       
                                             prompt           

  Reserved characters    HIGH ---            Prompt 6 (Duel   SPECCED ---
  have no duel mechanics Mori/Fukuzawa/etc   System)          Section 2.2
                         can\'t fight                         

  Chronicle page never   HIGH --- it\'s in   New standalone   SPECCED ---
  built                  main nav and        prompt           Section 2.3
                         Ango\'s entire                       
                         guide                                

  Duel discovery         HIGH --- no way to  Prompt 6 (Duel   SPECCED ---
  mechanic missing       find opponents      System)          Section 3.2

  Observer pool UX empty MEDIUM --- players  Prompt 6 or      SPECCED ---
                         stuck with no       settings         Section 2.4
                         content                              

  Faction transfer UI    MEDIUM --- rule     Settings prompt  SPECCED ---
  never built            exists, no flow                      Section 2.5

  Cross-faction          LOW --- nice to     Prompt 10 or     SPECCED ---
  leaderboard missing    have                standalone       Section 2.6

  Chat moderation tools  MEDIUM --- mods     Prompt 7 or      SPECCED ---
  missing                can\'t manage       faction space    Section 2.7
                         Transmission Logs   update           

  Endgame undefined at   MEDIUM --- most     Add to Prompt 11 SPECCED ---
  Rank 6                 active players hit                   Section 2.8
                         wall                                 
  -----------------------------------------------------------------------------

**2.1 --- Sakunosuke Oda (Add Immediately With Assignment Enrichment)**

*Required for the Bar Lupin easter egg. Without him, Dazai + Ango + Oda
can never simultaneously exist. Add him in the same prompt as the
character assignment enrichment.*

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            sakunosuke-oda

  Name            Sakunosuke Oda / 織田作之助

  Faction         agency

  Ability         Flare / フレア

  Type            counter

  Traits          Power 3 / Intel 4 / Loyalty 5 / Control 3

  Reserved        YES --- owner assigns manually only. Reason: Bar Lupin
                  easter egg.
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Flare**                                                 |
|                                                                       |
| At the end of every round where Oda took more damage than he dealt,   |
| he automatically heals 8 HP. No activation. Reflects his role --- the |
| city\'s quiet operative who endures.                                  |
|                                                                       |
| **Special --- Flare**                                                 |
|                                                                       |
| Oda does not attack this round. He observes. The opponent\'s next     |
| move TYPE is revealed to him with 100% accuracy before the next round |
| begins. Cooldown: once every 2 rounds.                                |
|                                                                       |
| **Canon Rule --- Oda + Dazai (team fights only)**                     |
|                                                                       |
| All of Oda\'s healing effects increase by 50% when Dazai is on the    |
| same team.                                                            |
|                                                                       |
| **Canon Rule --- Oda vs Akutagawa**                                   |
|                                                                       |
| Oda deals +8 damage to Akutagawa every round. Canon --- Oda\'s death  |
| shaped what Akutagawa became.                                         |
|                                                                       |
| **Bar Lupin Trigger SQL**                                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| \-- Add to character_profiles:                                        |
|                                                                       |
| INSERT INTO character_profiles                                        |
| (slug,name,faction,ability_name,ability_name_jp,                      |
|                                                                       |
| ability_type,trait_power,trait_intel,trait_loyalty,trait_control)     |
|                                                                       |
| VALUES (\'sakunosuke-oda\',\'Sakunosuke Oda\',\'agency\',\'Flare\',   |
|                                                                       |
| \'フレア\',\'counter\',3,4,5,3) ON CONFLICT DO NOTHING;               |
|                                                                       |
| \-- Add to reserved_characters:                                       |
|                                                                       |
| INSERT INTO reserved_characters                                       |
| (slug,character_name,faction,reserved_reason)                         |
|                                                                       |
| VALUES (\'sakunosuke-oda\',\'Sakunosuke Oda\',\'agency\',             |
|                                                                       |
| \'Bar Lupin easter egg --- owner assigns manually only\')             |
|                                                                       |
| ON CONFLICT DO NOTHING;                                               |
|                                                                       |
| \-- Bar Lupin trigger (fires on character_name UPDATE):               |
|                                                                       |
| CREATE OR REPLACE FUNCTION check_bar_lupin()                          |
|                                                                       |
| RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS \$\$             |
|                                                                       |
| BEGIN                                                                 |
|                                                                       |
| IF (SELECT COUNT(\*) FROM profiles WHERE character_match_id IN        |
|                                                                       |
| (\'osamu-dazai\',\'ango-sakaguchi\',\'sakunosuke-oda\')) = 3 THEN     |
|                                                                       |
| \-- Create Bar Lupin channel if not exists                            |
|                                                                       |
| INSERT INTO faction_channels (slug,name,access_type)                  |
|                                                                       |
| VALUES (\'bar-lupin\',\'Bar Lupin --- 酒場ルパン\',\'buraiha_only\')  |
|                                                                       |
| ON CONFLICT DO NOTHING;                                               |
|                                                                       |
| END IF;                                                               |
|                                                                       |
| RETURN NEW;                                                           |
|                                                                       |
| END; \$\$;                                                            |
|                                                                       |
| CREATE TRIGGER on_character_assign AFTER UPDATE OF character_name ON  |
| profiles                                                              |
|                                                                       |
| FOR EACH ROW EXECUTE FUNCTION check_bar_lupin();                      |
+-----------------------------------------------------------------------+

**2.2 --- Reserved Characters --- Duel Mechanics**

*All six reserved characters need full ability specs. They are used in
Scenarios (NPC fights) and can be assigned to inner circle members.
Build these into the Duel System prompt.*

**Ogai Mori --- Port Mafia Boss**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            ogai-mori

  Ability         Vita Sexualis / ヰタ・セクスアリス

  Type            manipulation

  Traits          Power 2 / Intel 5 / Loyalty 3 / Control 5

  Start HP        100
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive:**                                                          |
|                                                                       |
| At the start of each round, Mori sees the opponent\'s full cooldown   |
| state --- what they can and cannot use --- before submitting his      |
| move. Perfect information on opponent capabilities.                   |
|                                                                       |
| **Special --- Elise\'s Command:**                                     |
|                                                                       |
| Summons Elise. All incoming damage this round redirected to Elise (30 |
| HP). If damage exceeds 30, overflow hits Mori. Cooldown: once every 3 |
| rounds.                                                               |
|                                                                       |
| **War Bonus:**                                                        |
|                                                                       |
| When Mori is active in a Faction War, Mafia wins earn +30 AP per      |
| member on top of standard reward.                                     |
|                                                                       |
| **NPC Logic:**                                                        |
|                                                                       |
| -   Round 1: Always Stance --- observes                               |
|                                                                       |
| -   Round 2+: Elise\'s Command if HP \< 60                            |
|                                                                       |
| -   Never Gambit --- too calculating                                  |
|                                                                       |
| -   Strikes when opponent on cooldown (he always knows)               |
+-----------------------------------------------------------------------+

**Yukichi Fukuzawa --- Agency Founder**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            yukichi-fukuzawa

  Ability         All Men Are Equal / 人の上に人を造らず

  Type            counter

  Traits          Power 4 / Intel 4 / Loyalty 5 / Control 4
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive:**                                                          |
|                                                                       |
| Immune to ALL debuffs, stun, freeze, and max HP reduction. Always     |
| active. Cannot be overridden.                                         |
|                                                                       |
| **Special --- Agency Directive:**                                     |
|                                                                       |
| Team fight: all Agency members heal 10 HP this round. 1v1: deals 30   |
| damage ignoring all defense. Cooldown: once every 2 rounds.           |
|                                                                       |
| **War Bonus:**                                                        |
|                                                                       |
| All Agency members earn +5% bonus AP from every action during a war   |
| where Fukuzawa is active.                                             |
+-----------------------------------------------------------------------+

**Francis Scott Fitzgerald --- Guild Boss**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            francis-fitzgerald

  Ability         The Great Fitzgerald / グレート・フィッツジェラルド

  Type            destruction

  Traits          Power 5 / Intel 3 / Loyalty 2 / Control 4

  Start HP        130 (not 100)
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive:**                                                          |
|                                                                       |
| Starts every duel at 130 HP. Every 20 HP lost permanently grants +3   |
| damage on all attacks for the duel. At 70 HP he deals +9 bonus        |
| damage. At 30 HP he deals +15 bonus damage.                           |
|                                                                       |
| **Special --- Dollar Conversion:**                                    |
|                                                                       |
| Spend 20 HP to deal 65 damage --- highest single hit in the game.     |
| Only usable above 30 HP. Cooldown: once every 2 rounds.               |
|                                                                       |
| **War Bonus:**                                                        |
|                                                                       |
| If Guild wins a war with Fitzgerald active, owner may allow claiming  |
| 2 districts instead of 1.                                             |
+-----------------------------------------------------------------------+

**Fukuchi Ouchi --- Hunting Dogs Commander**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            fukuchi-ouchi

  Ability         One Sword Style Amenogozen / 一刀流天之御前

  Type            analysis

  Traits          Power 5 / Intel 5 / Loyalty 4 / Control 5
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Time Reversal:**                                        |
|                                                                       |
| Once per duel, immediately after a round resolves, Fukuchi can        |
| reverse it --- both players\' moves become Recover retroactively. A   |
| 30-second window appears on screen after round resolution. If not     |
| used before the window closes, the opportunity is gone.               |
|                                                                       |
| **Special --- Time Slash:**                                           |
|                                                                       |
| 45 damage. If opponent used Strike this round, damage becomes 70      |
| instead. Cooldown: once every 2 rounds.                               |
|                                                                       |
| **Implementation note:**                                              |
|                                                                       |
| Time reversal requires a 30-second post-round window flag in the      |
| duel_rounds table (reversal_available, reversal_deadline). UI shows a |
| distinct button during this window only.                              |
+-----------------------------------------------------------------------+

**Fyodor Dostoevsky --- Rats Leader (Hidden Faction)**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            fyodor-dostoevsky

  Faction         rats (hidden)

  Ability         The Demon Descends / 悪魔が降りてくる

  Type            manipulation

  Traits          Power 2 / Intel 5 / Loyalty 1 / Control 5
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **War Ability --- Crime and Punishment (once per war, not per         |
| duel):**                                                              |
|                                                                       |
| Fyodor corrupts one enemy special ability. The corrupted special      |
| fires against its own user instead of their opponent. No warning      |
| given. No announcement. It simply happens when the corrupted player   |
| activates their special.                                              |
|                                                                       |
| **Duel Passive --- The Demon:**                                       |
|                                                                       |
| All direct-contact abilities miss Fyodor by dealing 15 less damage    |
| always. Environmental abilities (Steinbeck\'s plants, Poe\'s trap)    |
| still work normally.                                                  |
|                                                                       |
| **Special --- The Demon Descends:**                                   |
|                                                                       |
| 0 damage this round. Permanently reduces opponent\'s max HP by 30 for |
| the rest of the duel. Once per duel.                                  |
|                                                                       |
| **Arena Appearance Rule:**                                            |
|                                                                       |
| Players who vote FOR Fyodor in Arena: -10 AP. Players who vote        |
| AGAINST: private Ango notification --- \'You voted against him. The   |
| registry notes your position.\' Runs once. No winner. Purely          |
| unsettling.                                                           |
+-----------------------------------------------------------------------+

**Nikolai Gogol --- Decay of the Angel (Hidden Faction)**

  -----------------------------------------------------------------------
  **Field**       **Value**
  --------------- -------------------------------------------------------
  Slug            nikolai-gogol

  Faction         decay (hidden)

  Ability         The Overcoat / 外套

  Type            manipulation

  Traits          Power 3 / Intel 4 / Loyalty 1 / Control 2
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Passive --- Always Watching:**                                      |
|                                                                       |
| Gogol sees the opponent\'s full move history from all their previous  |
| duels in the database. Not just this duel --- all duels. Permanent    |
| information advantage.                                                |
|                                                                       |
| **Special --- The Overcoat:**                                         |
|                                                                       |
| Gogol disguises as ANY other character for exactly one round. Selects |
| a character from the full roster. That character\'s passive and       |
| special both apply for that round. Opponent sees \'???\' instead of   |
| Gogol\'s character art during move submission. Gogol is revealed at   |
| round end with Gemini-written flourish. Once per duel.                |
|                                                                       |
| **Implementation:**                                                   |
|                                                                       |
| Duel resolver accepts character_override field on Gogol\'s round.     |
| Overrides passive and special resolution for that round only. UI      |
| requirement: show \'???\' to opponent during move submission phase.   |
| Reveal character art on resolution.                                   |
+-----------------------------------------------------------------------+

**2.3 --- The Chronicle (Missing Page --- Build as Standalone Prompt)**

*Referenced everywhere --- main nav, Ango\'s operations guide, war
resolution, Book chapters --- but never built. Needs its own prompt
after Faction Wars.*

+-----------------------------------------------------------------------+
| \-- New table:                                                        |
|                                                                       |
| CREATE TABLE IF NOT EXISTS chronicle_entries (                        |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| entry_number integer UNIQUE NOT NULL,                                 |
|                                                                       |
| title text NOT NULL,                                                  |
|                                                                       |
| content text NOT NULL,                                                |
|                                                                       |
| entry_type text DEFAULT \'chapter\',                                  |
|                                                                       |
| \-- chapter \| war_record \| duel_record \| character_event \|        |
| scenario_outcome \| player_submission                                 |
|                                                                       |
| faction_focus text,                                                   |
|                                                                       |
| author_id uuid REFERENCES profiles(id),                               |
|                                                                       |
| is_featured boolean DEFAULT false,                                    |
|                                                                       |
| published_at timestamptz,                                             |
|                                                                       |
| created_at timestamptz DEFAULT now()                                  |
|                                                                       |
| );                                                                    |
|                                                                       |
| ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY;              |
|                                                                       |
| CREATE POLICY \"chronicle_public\" ON chronicle_entries FOR SELECT    |
|                                                                       |
| USING (published_at IS NOT NULL);                                     |
|                                                                       |
| CREATE POLICY \"chronicle_mod_write\" ON chronicle_entries FOR ALL    |
|                                                                       |
| USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()           |
|                                                                       |
| AND role IN (\'owner\',\'mod\')));                                    |
|                                                                       |
| CREATE SEQUENCE IF NOT EXISTS chronicle_seq START 1;                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Page: app/chronicle/page.tsx**                                      |
|                                                                       |
| Fully public. No login required. Left sidebar with type filters.      |
| Entries in reverse chronological order. Featured entries have red     |
| left border.                                                          |
|                                                                       |
| **Entry types and what creates them:**                                |
|                                                                       |
| -   chapter --- The Book weekly winner, Ango writes/approves          |
|                                                                       |
| -   war_record --- auto-generated by war resolution Edge Function,    |
|     Ango approves                                                     |
|                                                                       |
| -   duel_record --- owner creates for significant duels (canon        |
|     characters)                                                       |
|                                                                       |
| -   character_event --- reserved character assignments, owner creates |
|                                                                       |
| -   scenario_outcome --- Scenario Engine resolution, Ango approves    |
|                                                                       |
| -   player_submission --- Chronicle Submissions (rank 5+), Ango       |
|     approves                                                          |
|                                                                       |
| **CRITICAL:**                                                         |
|                                                                       |
| Nothing auto-publishes. Every draft requires Ango (mod) approval      |
| before published_at is set. Owner sees drafts in /owner panel. Ango   |
| sees them in mod queue.                                               |
|                                                                       |
| **Entry #001:**                                                       |
|                                                                       |
| Written manually by you as Ango. Sets the tone. Write it before       |
| launch.                                                               |
+-----------------------------------------------------------------------+

**2.4 --- Observer Pool UX (Build Into Prompt 6 or Settings)**

+-----------------------------------------------------------------------+
| **What observer pool players see on their profile:**                  |
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
| **What they CAN do:**                                                 |
|                                                                       |
| -   Read Archive, Registry, Chronicle, Map --- all public             |
|                                                                       |
| -   View other profiles                                               |
|                                                                       |
| -   Join the queue by continuing to use the site                      |
|                                                                       |
| **What they CANNOT do:**                                              |
|                                                                       |
| -   Post in Transmission Logs --- no faction                          |
|                                                                       |
| -   Submit Registry posts --- requires faction                        |
|                                                                       |
| -   Challenge players to duels --- no character                       |
|                                                                       |
| -   Participate in wars                                               |
|                                                                       |
| **Private page /observer:**                                           |
|                                                                       |
| Accessible only to observer pool members. Shows: one atmospheric      |
| paragraph about Special Division, \'You have been noticed. The city   |
| is patient.\', and a counter showing days in pool. Nothing else.      |
|                                                                       |
| **Owner panel --- Observer Pool section:**                            |
|                                                                       |
| -   List all observers with join date and days waiting                |
|                                                                       |
| -   \'Assign to Faction\' --- force assignment bypassing quiz         |
|                                                                       |
| -   \'Invite to Special Division\' --- sends bypass notification      |
|                                                                       |
| -   Private notes field per observer (never shown to user)            |
+-----------------------------------------------------------------------+

**2.5 --- Faction Transfer UI (Build Into Settings Prompt)**

+-----------------------------------------------------------------------+
| **Entry point:**                                                      |
|                                                                       |
| Settings page → \'Request Faction Transfer\' --- visible only if ALL  |
| conditions met: account \> 30 days old, ap_total \>= 500,             |
| transfer_used = false, no active war involving current faction.       |
|                                                                       |
| **Page: app/settings/transfer/page.tsx**                              |
|                                                                       |
| Shows: current faction, current character (will be released), current |
| AP (will not reset). Destination faction dropdown (all 4 main         |
| factions except current). Username confirmation input. \[TRANSFER     |
| FACTION\] button.                                                     |
|                                                                       |
| **On confirmation:**                                                  |
|                                                                       |
| 1.  Verify typed username matches auth.uid() username --- reject if   |
|     not                                                               |
|                                                                       |
| 2.  Set transfer_used = true, old_faction = current faction           |
|                                                                       |
| 3.  Set faction = new faction, character_name = null (released back   |
|     to pool)                                                          |
|                                                                       |
| 4.  Reset post-quiz behavior_scores deltas --- keep quiz baseline     |
|     scores                                                            |
|                                                                       |
| 5.  Redirect to new faction space                                     |
|                                                                       |
| 6.  Notify user: \'Transfer confirmed. Your character has been        |
|     released. The city will observe you again.\'                      |
|                                                                       |
| **CRITICAL:**                                                         |
|                                                                       |
| Block transfer if any war is active involving the user\'s current     |
| faction. Show: \'Transfer unavailable during active war. The city     |
| does not permit desertion.\'                                          |
+-----------------------------------------------------------------------+

**2.6 --- Cross-Faction Leaderboard (Build With Prompt 10 or
Standalone)**

+-----------------------------------------------------------------------+
| **Page: app/leaderboard/page.tsx --- Public, no login required. Three |
| tabs:**                                                               |
|                                                                       |
| -   AP Rankings --- Top 20 by total AP. Shows: rank, username,        |
|     faction kanji, character, rank title, AP total. Updates daily.    |
|                                                                       |
| -   Duel Records --- Top 20 by win rate (min 5 duels). Shows: rank,   |
|     username, faction kanji, character, W/L, win %.                   |
|                                                                       |
| -   Faction Standings --- Faction totals: total AP across members,    |
|     district count, war record W/L.                                   |
|                                                                       |
| **Never show:**                                                       |
|                                                                       |
| -   Individual behavior scores --- always private                     |
|                                                                       |
| -   Observer pool members --- exclude from all tabs                   |
|                                                                       |
| -   Registry post counts --- creates spam incentive                   |
+-----------------------------------------------------------------------+

**2.7 --- Chat Moderation Tools (Build Into Faction Space Update)**

+-----------------------------------------------------------------------+
| **Mod controls in Transmission Log (visible to mod/owner only):**     |
|                                                                       |
| -   \[DELETE MESSAGE\] --- soft delete, shows \'This transmission has |
|     been redacted.\' in italic                                        |
|                                                                       |
| -   \[WARN USER\] --- private notification: \'The registry has        |
|     flagged a transmission. Exercise judgment.\'                      |
|                                                                       |
| -   \[MUTE USER\] --- prevents posting in Transmission Log for 24     |
|     hours                                                             |
|                                                                       |
| -   \[ESCALATE TO OWNER\] --- sends owner notification with message   |
|     content                                                           |
|                                                                       |
| **Database additions:**                                               |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| ALTER TABLE faction_messages                                          |
|                                                                       |
| ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,               |
|                                                                       |
| ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id),     |
|                                                                       |
| ADD COLUMN IF NOT EXISTS deleted_at timestamptz;                      |
|                                                                       |
| CREATE TABLE IF NOT EXISTS chat_mutes (                               |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| user_id uuid REFERENCES profiles(id),                                 |
|                                                                       |
| faction text NOT NULL,                                                |
|                                                                       |
| muted_by uuid REFERENCES profiles(id),                                |
|                                                                       |
| muted_until timestamptz NOT NULL,                                     |
|                                                                       |
| reason text,                                                          |
|                                                                       |
| created_at timestamptz DEFAULT now()                                  |
|                                                                       |
| );                                                                    |
+-----------------------------------------------------------------------+

**2.8 --- Endgame Progression (Build Into Prompt 11)**

+-----------------------------------------------------------------------+
| **At 10,000 AP (Rank 6) players unlock:**                             |
|                                                                       |
| -   Designation appended to rank title --- e.g. \'Executive Agent --- |
|     Yokohama Veteran\'                                                |
|                                                                       |
| -   City Seal badge on profile --- faction color, visible in roster   |
|                                                                       |
| -   Gold profile border in roster view                                |
|                                                                       |
| -   Private Ango notification: \'The city has recorded your tenure.   |
|     Very few reach this point.\'                                      |
|                                                                       |
| **City Tokens --- spending AP above 10,000:**                         |
|                                                                       |
| -   Every 1,000 AP above 10,000 earns one City Token                  |
|                                                                       |
| -   Spend once per month on: naming a Yokohama district event (Ango   |
|     posts as canon), requesting a specific Arena matchup, or          |
|     nominating a Registry post for featured status                    |
|                                                                       |
| -   Tokens do not roll over --- spend or lose monthly                 |
|                                                                       |
| **Seasonal Reset (optional --- only after 3+ months of activity):**   |
|                                                                       |
| -   AP resets to 500 (keeps Rank 2 --- nobody loses transfer          |
|     eligibility)                                                      |
|                                                                       |
| -   Season badge permanently added to profiles that hit Rank 4+       |
|                                                                       |
| -   District control resets --- new wars decide everything again      |
|                                                                       |
| -   Character assignments never reset                                 |
+-----------------------------------------------------------------------+

**Part Three --- Prompt 6: Duel System**

*Build this first. Everything in Phase 2 depends on characters fighting.
Self-contained --- do not touch Prompts 1-5 work.*

+-----------------------------------------------------------------------+
| **STEP ORDER --- DO NOT SKIP**                                        |
|                                                                       |
| 7.  Database schema                                                   |
|                                                                       |
| 8.  Duel discovery page                                               |
|                                                                       |
| 9.  Pre-assignment state (Option B)                                   |
|                                                                       |
| 10. Duel resolver Edge Function                                       |
|                                                                       |
| 11. Round UI + Realtime                                               |
|                                                                       |
| 12. AP resolution + aftermath                                         |
|                                                                       |
| 13. Add Oda + reserved character mechanics                            |
+-----------------------------------------------------------------------+

**3.1 --- Database Schema**

+-----------------------------------------------------------------------+
| CREATE TABLE IF NOT EXISTS duels (                                    |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| challenger_id uuid REFERENCES profiles(id),                           |
|                                                                       |
| defender_id uuid REFERENCES profiles(id),                             |
|                                                                       |
| challenger_character text, \-- null if unassigned                     |
|                                                                       |
| defender_character text,                                              |
|                                                                       |
| challenger_faction text NOT NULL,                                     |
|                                                                       |
| defender_faction text NOT NULL,                                       |
|                                                                       |
| status text DEFAULT \'pending\',                                      |
|                                                                       |
| \-- pending \| active \| complete \| forfeit \| cancelled             |
|                                                                       |
| current_round integer DEFAULT 0,                                      |
|                                                                       |
| challenger_hp integer DEFAULT 100,                                    |
|                                                                       |
| defender_hp integer DEFAULT 100,                                      |
|                                                                       |
| challenger_max_hp integer DEFAULT 100, \-- Melville/Fitzgerald start  |
| higher                                                                |
|                                                                       |
| defender_max_hp integer DEFAULT 100,                                  |
|                                                                       |
| winner_id uuid REFERENCES profiles(id),                               |
|                                                                       |
| ap_awarded boolean DEFAULT false,                                     |
|                                                                       |
| is_ranked boolean DEFAULT false,                                      |
|                                                                       |
| is_war_duel boolean DEFAULT false,                                    |
|                                                                       |
| war_id uuid,                                                          |
|                                                                       |
| came_back_from_low_hp boolean DEFAULT false, \-- for comeback bonus   |
|                                                                       |
| created_at timestamptz DEFAULT now(),                                 |
|                                                                       |
| accepted_at timestamptz,                                              |
|                                                                       |
| completed_at timestamptz                                              |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE TABLE IF NOT EXISTS duel_rounds (                              |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| duel_id uuid REFERENCES duels(id) ON DELETE CASCADE,                  |
|                                                                       |
| round_number integer NOT NULL,                                        |
|                                                                       |
| challenger_move text, \-- strike\|stance\|gambit\|special\|recover    |
|                                                                       |
| defender_move text,                                                   |
|                                                                       |
| challenger_override_character text, \-- Gogol Overcoat                |
|                                                                       |
| challenger_move_submitted_at timestamptz,                             |
|                                                                       |
| defender_move_submitted_at timestamptz,                               |
|                                                                       |
| round_deadline timestamptz, \-- 30 min from round start               |
|                                                                       |
| reversal_available boolean DEFAULT false, \-- Fukuchi passive         |
|                                                                       |
| reversal_deadline timestamptz,                                        |
|                                                                       |
| challenger_damage_dealt integer DEFAULT 0,                            |
|                                                                       |
| defender_damage_dealt integer DEFAULT 0,                              |
|                                                                       |
| challenger_hp_after integer,                                          |
|                                                                       |
| defender_hp_after integer,                                            |
|                                                                       |
| special_events jsonb DEFAULT \'\[\]\',                                |
|                                                                       |
| narrative text,                                                       |
|                                                                       |
| narrative_fallback boolean DEFAULT false,                             |
|                                                                       |
| resolved_at timestamptz,                                              |
|                                                                       |
| UNIQUE(duel_id, round_number)                                         |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE TABLE IF NOT EXISTS open_challenges (                          |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| challenger_id uuid REFERENCES profiles(id),                           |
|                                                                       |
| challenger_faction text NOT NULL,                                     |
|                                                                       |
| message text, \-- optional 50-char trash talk                         |
|                                                                       |
| expires_at timestamptz DEFAULT now() + interval \'24 hours\',         |
|                                                                       |
| accepted_by uuid REFERENCES profiles(id),                             |
|                                                                       |
| status text DEFAULT \'open\', \-- open \| accepted \| expired         |
|                                                                       |
| created_at timestamptz DEFAULT now()                                  |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE INDEX idx_duels_challenger ON duels(challenger_id, status);    |
|                                                                       |
| CREATE INDEX idx_duels_defender ON duels(defender_id, status);        |
|                                                                       |
| CREATE INDEX idx_duel_rounds_duel ON duel_rounds(duel_id,             |
| round_number);                                                        |
|                                                                       |
| CREATE INDEX idx_open_challenges_status ON open_challenges(status,    |
| expires_at);                                                          |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| \-- RLS                                                               |
|                                                                       |
| ALTER TABLE duels ENABLE ROW LEVEL SECURITY;                          |
|                                                                       |
| ALTER TABLE duel_rounds ENABLE ROW LEVEL SECURITY;                    |
|                                                                       |
| ALTER TABLE open_challenges ENABLE ROW LEVEL SECURITY;                |
|                                                                       |
| CREATE POLICY \"duels_participants\" ON duels FOR SELECT              |
|                                                                       |
| USING (auth.uid() = challenger_id OR auth.uid() = defender_id);       |
|                                                                       |
| CREATE POLICY \"duels_ranked_public\" ON duels FOR SELECT             |
|                                                                       |
| USING (is_ranked = true AND status = \'active\');                     |
|                                                                       |
| CREATE POLICY \"duels_insert\" ON duels FOR INSERT                    |
|                                                                       |
| WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()      |
|                                                                       |
| AND role IN (\'member\',\'mod\',\'owner\')));                         |
|                                                                       |
| CREATE POLICY \"duels_update_participants\" ON duels FOR UPDATE       |
|                                                                       |
| USING (auth.uid() = challenger_id OR auth.uid() = defender_id);       |
|                                                                       |
| CREATE POLICY \"rounds_read\" ON duel_rounds FOR SELECT               |
|                                                                       |
| USING (EXISTS (SELECT 1 FROM duels WHERE id = duel_id                 |
|                                                                       |
| AND (challenger_id = auth.uid() OR defender_id = auth.uid())));       |
|                                                                       |
| CREATE POLICY \"rounds_ranked_public\" ON duel_rounds FOR SELECT      |
|                                                                       |
| USING (EXISTS (SELECT 1 FROM duels WHERE id = duel_id AND is_ranked = |
| true));                                                               |
|                                                                       |
| CREATE POLICY \"challenges_public_read\" ON open_challenges FOR       |
| SELECT USING (true);                                                  |
|                                                                       |
| CREATE POLICY \"challenges_own_write\" ON open_challenges FOR ALL     |
|                                                                       |
| USING (auth.uid() = challenger_id);                                   |
+-----------------------------------------------------------------------+

**3.2 --- Duel Discovery (app/duels/page.tsx)**

+-----------------------------------------------------------------------+
| **Section A --- Your Active Duels**                                   |
|                                                                       |
| All current duels. Challenger/defender avatar, character name,        |
| faction kanji, current round indicator, whose turn it is, time        |
| remaining in round. Direct link into each duel. Realtime              |
| subscription.                                                         |
|                                                                       |
| **Section B --- Challenge a Player**                                  |
|                                                                       |
| Username search bar --- live queries profiles excluding same faction  |
| as current user. Results show: username, faction kanji, character     |
| name, rank title, duel record (W/L). \[CHALLENGE\] button on each.    |
|                                                                       |
| -   Cannot challenge own faction --- error: \'The registry does not   |
|     permit internal disputes through this system.\'                   |
|                                                                       |
| -   Cannot challenge someone with an active duel already ongoing      |
|                                                                       |
| -   Cannot have more than 3 active duels simultaneously               |
|                                                                       |
| -   Challenge notification sent to defender --- 24 hours to accept or |
|     auto-decline                                                      |
|                                                                       |
| **Section C --- Open Challenges Board**                               |
|                                                                       |
| Players post open challenges visible to all other factions. Shows:    |
| challenger name, character, faction, optional message (50 chars, must |
| stay in-universe), time remaining. Any eligible player can accept.    |
|                                                                       |
| -   Expires after 24 hours if not accepted                            |
|                                                                       |
| -   Cannot post more than one open challenge at a time                |
|                                                                       |
| -   Accepting an open challenge creates the duel immediately          |
+-----------------------------------------------------------------------+

**3.3 --- Pre-Assignment Duel State (Option B)**

+-----------------------------------------------------------------------+
| **Unassigned players can duel with a stripped moveset:**              |
|                                                                       |
| -   STRIKE, STANCE, GAMBIT, RECOVER --- available                     |
|                                                                       |
| -   SPECIAL --- renders as \'ABILITY UNREGISTERED\', greyed,          |
|     unclickable in UI AND rejected server-side                        |
|                                                                       |
| -   No passives apply --- pure base stats                             |
|                                                                       |
| -   No canon rivalry bonuses --- no character to trigger them         |
|                                                                       |
| **Identity in duel UI:**                                              |
|                                                                       |
| Faction crest + rank title. Example: faction kanji + \'FIELD          |
| OPERATIVE\'. No placeholder name, no ???. Looks intentional.          |
|                                                                       |
| **One-time message before first pre-assignment duel (localStorage     |
| gate):**                                                              |
|                                                                       |
| +------------------------------------------------------------------+  |
| | *Ability signature not yet confirmed.*                           |  |
| |                                                                  |  |
| | *Combat data will be recorded by the registry.*                  |  |
| +------------------------------------------------------------------+  |
|                                                                       |
| **What feeds back to assignment:**                                    |
|                                                                       |
| Pre-assignment duels write to duel_style (gambit/strike/stance        |
| ratios) normally. This data feeds Gemini when the 20-event threshold  |
| fires.                                                                |
|                                                                       |
| **Server-side enforcement:**                                          |
|                                                                       |
| Move submission endpoint checks character_name on profile. If null    |
| AND move = \'special\': return 400 error. UI blocking is not enough.  |
+-----------------------------------------------------------------------+

**3.4 --- Resolver Edge Function
(supabase/functions/resolve-duel-round)**

+-----------------------------------------------------------------------+
| **Resolution order --- strictly this sequence every round:**          |
|                                                                       |
| 14. Validate both moves submitted OR apply auto-Stance if timer       |
|     expired                                                           |
|                                                                       |
| 15. Check Gogol Overcoat --- if character_override set, resolve as    |
|     override character this round                                     |
|                                                                       |
| 16. Apply ability type modifiers: Counter 150% counter-dmg vs Strike, |
|     Manipulation 20% peek, Analysis 30% predict                       |
|                                                                       |
| 17. Apply character passives in order: pre-round, on-damage-receive,  |
|     post-round                                                        |
|                                                                       |
| 18. Apply canon rivalry bonuses if applicable matchup                 |
|                                                                       |
| 19. Calculate final damage both directions                            |
|                                                                       |
| 20. Apply HP changes --- clamp to 0 minimum, clamp to max_hp maximum  |
|                                                                       |
| 21. Update cooldowns, record special_events array                     |
|                                                                       |
| 22. Check win condition: either HP \<= 0 OR round_number = 5          |
|                                                                       |
| 23. If duel over: resolve AP, write aftermath prompt to Gemini        |
|                                                                       |
| 24. THEN call Gemini for round narrative (never before step 9)        |
|                                                                       |
| 25. Write complete round record to duel_rounds                        |
|                                                                       |
| 26. Broadcast Realtime update --- both players receive new state      |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Gemini Round Narrative Prompt:**                                    |
|                                                                       |
| You are the Yokohama ability registry combat recorder.                |
|                                                                       |
| Write exactly 2 sentences describing this round of combat.            |
|                                                                       |
| Do not mention HP numbers, damage values, or AP.                      |
|                                                                       |
| Present tense. Literary, cold, precise. BSD anime tone.               |
|                                                                       |
| FIGHTER A: \[character_name\] (\[ability_type\] type)                 |
|                                                                       |
| FIGHTER B: \[character_name\] (\[ability_type\] type)                 |
|                                                                       |
| A used: \[move\] --- \[damage_dealt\] damage dealt                    |
|                                                                       |
| B used: \[move\] --- \[damage_dealt\] damage dealt                    |
|                                                                       |
| Special events: \[passive triggers, specials, canon bonuses --- or    |
| \'none\'\]                                                            |
|                                                                       |
| Setting: \[district if war duel, else \'Yokohama\'\]                  |
|                                                                       |
| Return ONLY the 2 sentences. No preamble.                             |
|                                                                       |
| **ALWAYS define fallback BEFORE calling Gemini:**                     |
|                                                                       |
| const fallback = \`\${charA} and \${charB} exchanged blows. The       |
| registry notes this outcome.\`                                        |
|                                                                       |
| try { narrative = await callGemini(prompt, 5000) }                    |
|                                                                       |
| catch { narrative = fallback; round.narrative_fallback = true }       |
+-----------------------------------------------------------------------+

**3.5 --- Damage Reference**

  -------------------------------------------------------------------------
  **Move**   **Damage      **Incoming       **Special Notes**
             Dealt**       Received**       
  ---------- ------------- ---------------- -------------------------------
  STRIKE     25-35 random  Full incoming    Base move --- no special
             roll                           modifiers

  STANCE     10-15 random  40% of incoming  Counter types: 150% counter-dmg
             roll          (60% reduction)  when opp uses Strike

  GAMBIT     0 or 50 (coin Full incoming    Server resolves flip. Tachihara
             flip)                          passive: 60% win.

  SPECIAL    Varies by     Varies by        400 error if on cooldown OR
             character     character        player unassigned

  RECOVER    +20 HP healed Full incoming    Cannot use 2 rounds in a row
                                            --- server enforced
  -------------------------------------------------------------------------

**3.6 --- AP Resolution on Duel End**

  ------------------------------------------------------------------------
  **Outcome**                **Winner**            **Loser**
  -------------------------- --------------------- -----------------------
  Standard win               +50 AP                -20 AP (min 0)

  Comeback win (HP was below +75 AP                -20 AP (min 0)
  20 at any point during                           
  win)                                             

  Draw (equal HP after round +5 AP consolation     +5 AP consolation
  5)                                               

  War duel win (is_war_duel  +50 AP + 3 war points -20 AP (min 0)
  = true)                    to faction            

  Forfeit/timeout win        +50 AP                -20 AP (min 0)
  ------------------------------------------------------------------------

**3.7 --- Timer and Auto-Resolution**

+-----------------------------------------------------------------------+
| -   Round timer: 30 minutes from when BOTH players have acknowledged  |
|     the current round state via Realtime                              |
|                                                                       |
| -   Timer stored as round_deadline timestamptz in duel_rounds         |
|                                                                       |
| -   Cron job every 5 minutes: checks rounds with deadline in past and |
|     no move submitted → apply auto-Stance                             |
|                                                                       |
| -   Three consecutive auto-Stances from same player → auto-forfeit    |
|                                                                       |
| -   Never rely on client-side timers for resolution --- server is     |
|     always authoritative                                              |
+-----------------------------------------------------------------------+

**3.8 --- Duel Page UI (app/duels/\[duelId\]/page.tsx)**

+-----------------------------------------------------------------------+
| -   TOP: Challenger art/crest vs Defender art/crest. Faction kanji    |
|     both sides.                                                       |
|                                                                       |
| -   HP BARS: Both visible. CSS width % only --- no numbers shown to   |
|     opponent. Faction color.                                          |
|                                                                       |
| -   ROUND: 'Round X / 7' centered top (round 8 is sudden-death)       |
|                                                                       |
| -   MOVES: 5 buttons. SPECIAL greyed if on cooldown or unassigned.    |
|     RECOVER greyed if used last round.                                |
|                                                                       |
| -   SUBMIT: After submitting --- \'Move submitted. Awaiting           |
|     opponent.\' No reveal of own move.                                |
|                                                                       |
| -   NARRATIVE: Center between HP bars. Cormorant italic. 2 sentences. |
|     Fades in after resolution.                                        |
|                                                                       |
| -   HISTORY: Accordion below. Each round collapsible. Auto-opens      |
|     after resolution. Shows: both moves, damage dealt, narrative.     |
|                                                                       |
| -   REALTIME: Subscribe to duel_rounds INSERT for this duel_id. On    |
|     new record: animate HP bars → fade in narrative → unlock moves.   |
|     Unsubscribe on unmount.                                           |
|                                                                       |
| **Gogol special UI:**                                                 |
|                                                                       |
| -   When Gogol activates Overcoat: show character selector modal      |
|     before move submission                                            |
|                                                                       |
| -   Opponent sees \'???\' in character art position during move       |
|     submission                                                        |
|                                                                       |
| -   On resolution: reveal Gogol + show which character he used +      |
|     Gemini flourish                                                   |
|                                                                       |
| **Fukuchi time reversal UI:**                                         |
|                                                                       |
| -   After round resolves: show reversal window with 30-second         |
|     countdown                                                         |
|                                                                       |
| -   \'REVERSE TIME\' button --- bold red --- disappears when timer    |
|     ends                                                              |
|                                                                       |
| -   If activated: both moves set to Recover, round re-renders, HP     |
|     bars animate back                                                 |
+-----------------------------------------------------------------------+

**Part Four --- Prompt 7: Faction Wars**

*Build after Duel System is tested. Wars use duel outcomes as their main
fuel. Self-contained.*

**4.1 --- Database Schema**

+-----------------------------------------------------------------------+
| CREATE TABLE IF NOT EXISTS faction_wars (                             |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| faction_a text NOT NULL,                                              |
|                                                                       |
| faction_b text NOT NULL,                                              |
|                                                                       |
| status text DEFAULT \'pending\',                                      |
|                                                                       |
| \-- pending \| active \| day2 \| day3 \| complete                     |
|                                                                       |
| stakes text NOT NULL,                                                 |
|                                                                       |
| \-- district \| ap_multiplier \| registry_priority \|                 |
| narrative_consequence                                                 |
|                                                                       |
| stakes_detail jsonb,                                                  |
|                                                                       |
| \-- {district: \'chinatown\'} or {multiplier: 20, days: 3}            |
|                                                                       |
| faction_a_points integer DEFAULT 0,                                   |
|                                                                       |
| faction_b_points integer DEFAULT 0,                                   |
|                                                                       |
| winner text,                                                          |
|                                                                       |
| triggered_by uuid REFERENCES profiles(id),                            |
|                                                                       |
| war_message text, \-- Ango declaration text                           |
|                                                                       |
| starts_at timestamptz NOT NULL,                                       |
|                                                                       |
| day2_at timestamptz,                                                  |
|                                                                       |
| day3_at timestamptz,                                                  |
|                                                                       |
| ends_at timestamptz NOT NULL,                                         |
|                                                                       |
| resolved_at timestamptz,                                              |
|                                                                       |
| chronicle_draft_id uuid,                                              |
|                                                                       |
| created_at timestamptz DEFAULT now()                                  |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE TABLE IF NOT EXISTS war_contributions (                        |
|                                                                       |
| id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| war_id uuid REFERENCES faction_wars(id) ON DELETE CASCADE,            |
|                                                                       |
| user_id uuid REFERENCES profiles(id),                                 |
|                                                                       |
| faction text NOT NULL,                                                |
|                                                                       |
| contribution_type text NOT NULL,                                      |
|                                                                       |
| \-- duel_win \| registry_post \| daily_login \| team_fight \|         |
| boss_fight_win                                                        |
|                                                                       |
| points_awarded integer DEFAULT 0,                                     |
|                                                                       |
| reference_id uuid, \-- duel_id or post_id                             |
|                                                                       |
| created_at timestamptz DEFAULT now()                                  |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE INDEX idx_wars_status ON faction_wars(status);                 |
|                                                                       |
| CREATE INDEX idx_contributions_war ON war_contributions(war_id,       |
| faction);                                                             |
|                                                                       |
| CREATE INDEX idx_contributions_user ON war_contributions(user_id,     |
| war_id);                                                              |
|                                                                       |
| ALTER TABLE faction_wars ENABLE ROW LEVEL SECURITY;                   |
|                                                                       |
| ALTER TABLE war_contributions ENABLE ROW LEVEL SECURITY;              |
|                                                                       |
| CREATE POLICY \"wars_public\" ON faction_wars FOR SELECT USING        |
| (true);                                                               |
|                                                                       |
| CREATE POLICY \"wars_owner\" ON faction_wars FOR ALL USING (          |
|                                                                       |
| EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role =       |
| \'owner\'));                                                          |
|                                                                       |
| CREATE POLICY \"contributions_public\" ON war_contributions FOR       |
| SELECT USING (true);                                                  |
|                                                                       |
| CREATE POLICY \"contributions_system\" ON war_contributions FOR       |
| INSERT                                                                |
|                                                                       |
| WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()      |
|                                                                       |
| AND role IN (\'owner\',\'mod\')));                                    |
+-----------------------------------------------------------------------+

**4.2 --- War Points**

  ------------------------------------------------------------------------------
  **Action**            **Points**   **Cap**     **Notes**
  --------------------- ------------ ----------- -------------------------------
  Win a duel vs enemy   3 pts        No cap      Duel must have is_war_duel =
  faction member                                 true --- set on challenge when
                                                 war active

  Registry post         2 pts        2 posts per Mod action: mark_as_war_post on
  approved (mod marks                player per  approval
  war-related)                       war         

  Daily login during    1 pt         Once per    Auto-award via daily_login
  active war                         day per     event during active war
                                     player      

  Win Tag Team fight vs 5 pts        No cap      Unlocks Day 2 --- 2v2 shared HP
  enemy                                          pool

  Win Faction Raid vs   5 pts        No cap      Unlocks Day 2 --- requires 3+
  enemy                                          members per side

  Win Boss Fight on Day Auto war win Once per    Overrides all point standings
  3                                  war         completely
  ------------------------------------------------------------------------------

**4.3 --- War Timeline**

+-----------------------------------------------------------------------+
| **Day 1 (Hours 0-24):**                                               |
|                                                                       |
| -   Individual duels earn war points (is_war_duel = true auto-set     |
|     when dueling across warring factions)                             |
|                                                                       |
| -   Registry post submissions about the conflict open --- mod marks   |
|     war-related on approval                                           |
|                                                                       |
| -   Ango posts war declaration in Chronicle (auto-generated draft,    |
|     Ango edits and publishes)                                         |
|                                                                       |
| -   War strip live in both faction spaces via Realtime                |
|                                                                       |
| -   Non-warring factions: can spectate, earn nothing                  |
|                                                                       |
| **Day 2 (Hours 24-48):**                                              |
|                                                                       |
| -   Tag Team (2v2) fights unlock --- worth 5 pts each                 |
|                                                                       |
| -   Faction Raid (3v3) unlocks if both factions have 3+ members       |
|                                                                       |
| -   Arena matchup can run simultaneously if owner schedules one       |
|                                                                       |
| **Day 3 (Hours 48-72):**                                              |
|                                                                       |
| -   Boss Fight unlocks --- faction leaders only (highest AP in        |
|     faction)                                                          |
|                                                                       |
| -   Boss Fight win = automatic war victory regardless of points       |
|                                                                       |
| -   If no Boss Fight triggered: highest points at 72hr wins           |
|                                                                       |
| -   Tied points: defending faction wins (holds the territory by       |
|     default)                                                          |
|                                                                       |
| -   War auto-resolves via cron job --- runs every 30 minutes checking |
|     wars past ends_at                                                 |
+-----------------------------------------------------------------------+

**4.4 --- War Resolution Edge Function
(supabase/functions/resolve-war)**

+-----------------------------------------------------------------------+
| Resolution steps (in order):                                          |
|                                                                       |
| 1\. Determine winner: boss_fight_win flag OR higher points OR         |
| defending faction if tied                                             |
|                                                                       |
| 2\. Award AP:                                                         |
|                                                                       |
| Winner faction: +100 AP each member                                   |
|                                                                       |
| Loser faction: +20 AP consolation each member                         |
|                                                                       |
| Top contributor each side: +50 AP bonus                               |
|                                                                       |
| 3\. Apply stakes:                                                     |
|                                                                       |
| district: UPDATE district_ownership SET faction = winner WHERE name = |
| stakes_detail.district                                                |
|                                                                       |
| ap_multiplier: INSERT war_multipliers (faction, multiplier,           |
| expires_at)                                                           |
|                                                                       |
| registry_priority: INSERT war_featured_window (faction, expires_at)   |
|                                                                       |
| 4\. Log faction_activity for both factions                            |
|                                                                       |
| 5\. Call Gemini for Chronicle draft (3-4 sentences about the war      |
| outcome)                                                              |
|                                                                       |
| Save as chronicle_entries with published_at = null (draft --- Ango    |
| approves)                                                             |
|                                                                       |
| 6\. Notify all participants via notifications table                   |
|                                                                       |
| 7\. Owner notification: \'War resolved. Chronicle draft ready for     |
| approval.\'                                                           |
|                                                                       |
| 8\. Mark war status = \'complete\', resolved_at = now()               |
+-----------------------------------------------------------------------+

**4.5 --- Owner Panel War Controls (app/owner/wars/page.tsx)**

+-----------------------------------------------------------------------+
| **Start New War form:**                                               |
|                                                                       |
| -   Faction A + Faction B dropdowns --- cannot select same faction,   |
|     cannot repeat last pairing                                        |
|                                                                       |
| -   Stakes: District \| AP Multiplier \| Registry Priority \|         |
|     Narrative Consequence                                             |
|                                                                       |
| -   Stakes detail input depending on stakes type                      |
|                                                                       |
| -   War declaration text --- pre-fills with Ango template, editable   |
|                                                                       |
| -   Schedule: immediately OR specific datetime                        |
|                                                                       |
| -   \[DECLARE WAR\] --- triggers war, posts Ango declaration to       |
|     Chronicle draft, notifies both factions                           |
|                                                                       |
| **Active War panel:**                                                 |
|                                                                       |
| -   Live points with faction colors and breakdown by contribution     |
|     type                                                              |
|                                                                       |
| -   \[TRIGGER DAY 2\] manual override if needed                       |
|                                                                       |
| -   \[TRIGGER BOSS FIGHT\] --- opens boss fight configuration modal   |
|                                                                       |
| -   \[END WAR EARLY\] emergency option --- resolves by current points |
|     immediately                                                       |
|                                                                       |
| **Boss Fight modal:**                                                 |
|                                                                       |
| -   NPC Character selector (any reserved character)                   |
|                                                                       |
| -   Difficulty: Easy (80 HP, -5 dmg) \| Normal (100 HP) \| Hard (130  |
|     HP, +10 dmg) \| Extreme (150 HP, +15 dmg)                         |
|                                                                       |
| -   Available to: Faction A \| Faction B \| Both                      |
|                                                                       |
| -   \[ACTIVATE\] --- posts Ango notification to both factions,        |
|     creates boss fight duel entry                                     |
+-----------------------------------------------------------------------+

**4.6 --- War Strip Component**

+-----------------------------------------------------------------------+
| **WAR ACTIVE --- Agency vs Mafia --- 31:24:07 remaining**             |
|                                                                       |
| 探 Agency 47 pts \|\|\|\|\|\|\|\|\|\|\| 39 pts Mafia 港               |
|                                                                       |
| *Stakes: Harbor District control*                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| -   Sits above faction bulletin in faction space --- red background,  |
|     always visible during war                                         |
|                                                                       |
| -   Updates via Realtime on faction_wars + war_contributions          |
|                                                                       |
| -   Countdown client-side (cosmetic) --- server resolves at correct   |
|     time regardless                                                   |
|                                                                       |
| -   Hidden entirely for non-warring factions                          |
|                                                                       |
| -   Shows Day 2 / Day 3 unlock countdown once war passes 24 / 48      |
|     hours                                                             |
+-----------------------------------------------------------------------+

**Part Five --- Prompts 8-12 Summary**

*These prompts are fully specced in
BungouArchive-Phase2-GameDesign.docx. Summarised here with any additions
from gap analysis. Build in order --- do not skip.*

**Prompt 8 --- Arena**

+-----------------------------------------------------------------------+
| **Mode 1 --- Community Voting:**                                      |
|                                                                       |
| Owner posts matchup. 24hr window. Minimum 50-word argument required   |
| to vote --- no argument, no vote. Best argument (most upvoted) = +30  |
| AP. Cannot vote for own faction\'s character. Cannot upvote own       |
| argument. Winning faction +50 AP per member.                          |
|                                                                       |
| **Mode 2 --- Ranked 1v1 (Spectatable):**                              |
|                                                                       |
| Same duel system as Prompt 6 but is_ranked = true. All members can    |
| watch in Realtime. Move history visible to spectators ONLY after      |
| round resolves --- never during submission.                           |
|                                                                       |
| **Season 1 matchups (follow in order):**                              |
|                                                                       |
| -   Week 1: Atsushi vs Akutagawa --- the iconic rivalry               |
|                                                                       |
| -   Week 2: Chuuya vs Kunikida --- raw power vs precision             |
|                                                                       |
| -   Week 3: Dazai vs Ranpo --- who outthinks who                      |
|                                                                       |
| **Fyodor Arena Appearance (Season 4 --- after Rats faction            |
| revealed):**                                                          |
|                                                                       |
| Players voting FOR Fyodor: -10 AP. Players voting AGAINST: private    |
| Ango notification. Runs once. No winner. Just unsettles everyone.     |
+-----------------------------------------------------------------------+

**Prompt 9 --- Scenario Engine**

+-----------------------------------------------------------------------+
| **Type 1 --- NPC Encounter:**                                         |
|                                                                       |
| Reserved character appears somewhere in Yokohama. Owner sets NPC,     |
| difficulty, which faction can engage, time limit, stakes. NPC fights  |
| using automated logic. Owner triggers from /owner panel.              |
|                                                                       |
| **Type 2 --- Investigation:**                                         |
|                                                                       |
| No fight. A mystery appears in a district. Faction with best Registry |
| post wins. Judged by Ango personally.                                 |
|                                                                       |
| **Type 3 --- Timed Crisis:**                                          |
|                                                                       |
| Something happening in Yokohama right now. All factions respond       |
| within 12 hours. Most war points earned in window wins.               |
|                                                                       |
| **NPC Difficulty: Easy (80 HP, -5 dmg) \| Normal (100 HP) \| Hard     |
| (130 HP, +10 dmg) \| Extreme (150 HP, +15 dmg)**                      |
+-----------------------------------------------------------------------+

**Prompt 10 --- Yokohama Map**

+-----------------------------------------------------------------------+
| SVG map of Yokohama divided into districts. Fills with faction color  |
| based on ownership. Changes through wars and scenarios. Registry      |
| posts tag districts --- enough posts about a district makes it        |
| contested.                                                            |
|                                                                       |
|   ------------------------------------------------------------------- |
|   **District**    **Starting          **How to Contest**              |
|                   Control**                                           |
|   --------------- ------------------- ------------------------------- |
|   Kannai          Agency              Win war vs Agency               |
|                                                                       |
|   Harbor /        Port Mafia          Win war vs Mafia or NPC         |
|   Waterfront                          scenario                        |
|                                                                       |
|   Chinatown       Neutral             First faction to get 3 Registry |
|                                       posts tagged Chinatown          |
|                                                                       |
|   Motomachi       Guild               Win war vs Guild                |
|                                                                       |
|   Honmoku         Hunting Dogs        Win war vs Hunting Dogs         |
|                                                                       |
|   Northern        Neutral             Any Investigation scenario      |
|   Districts                                                           |
|                                                                       |
|   Underground /   Rats (hidden)       Only unlocks when Rats faction  |
|   Sewers                              revealed                        |
|   ------------------------------------------------------------------- |
|                                                                       |
| -   District control = +5% AP bonus for all members of controlling    |
|     faction                                                           |
|                                                                       |
| -   Controlling 3+ districts = faction leader gets Chronicle mention  |
|                                                                       |
| -   Cannot control all 5 main districts simultaneously --- game       |
|     balance enforced                                                  |
|                                                                       |
| -   Map visible to everyone including visitors --- no login required  |
+-----------------------------------------------------------------------+

**Prompt 11 --- The Book**

+-----------------------------------------------------------------------+
| Every Monday 00:00: faction with highest AP earned in past 7 days     |
| becomes Book Holder for next 7 days. Book Holder gets +10% AP         |
| multiplier on all earnings that week. Gemini drafts a Chronicle       |
| chapter based on faction activity --- Ango edits and approves before  |
| it goes live. Previous chapters archive at /chronicle.                |
|                                                                       |
| **ADD: Endgame / City Tokens system (Section 2.8) in this same        |
| prompt.**                                                             |
+-----------------------------------------------------------------------+

**Prompt 12 --- Hidden Faction Triggers**

+-----------------------------------------------------------------------+
| **Rats in the House of the Dead:**                                    |
|                                                                       |
| -   Who: most philosophical Registry writer --- references            |
|     Dostoevsky\'s real works, engages with nihilism                   |
|                                                                       |
| -   Trigger: /owner panel → notification sent: \'You have been        |
|     expected. Report to the underground registry.\'                   |
|                                                                       |
| -   Fyodor assigned manually via SQL                                  |
|                                                                       |
| -   War ability: Crime and Punishment (see Section 2.2)               |
|                                                                       |
| **Decay of the Angel:**                                               |
|                                                                       |
| -   Who: most chaotic player --- goes hard, disappears, returns       |
|     unpredictably                                                     |
|                                                                       |
| -   Trigger: notification --- \'The registry has noted your           |
|     pattern.\'                                                        |
|                                                                       |
| -   Gogol assigned manually via SQL                                   |
|                                                                       |
| -   Duel ability: The Overcoat (see Section 2.2)                      |
|                                                                       |
| **Clock Tower:**                                                      |
|                                                                       |
| -   Who: most loyal member, Rank 5-6, months of consistent presence,  |
|     never caused drama                                                |
|                                                                       |
| -   Trigger: personal message from you first (outside the site), then |
|     /owner panel invite                                               |
|                                                                       |
| -   Unique passive: ALL abilities at 110% effectiveness --- always    |
|     active, never documented anywhere                                 |
|                                                                       |
| -   If they notice they are hitting harder: good. Let them wonder     |
|     why.                                                              |
|                                                                       |
| **ADD: Reserved character duel mechanics (Section 2.2) in this same   |
| prompt.**                                                             |
+-----------------------------------------------------------------------+

**Part Six --- Complete Character Roster**

*All 24 assignable + 7 reserved. Every passive and special. This is the
duel resolver\'s source of truth.*

**Armed Detective Agency**

  ------------------------------------------------------------------------------------
  **Character**   **Type**       **Passive**          **Special**       **Cooldown**
  --------------- -------------- -------------------- ----------------- --------------
  Atsushi         Destruction    Below 30 HP: damage  BEAST BENEATH     Once when
  Nakajima                       doubles (once per    MOONLIGHT: 40     below 30 HP
                                 duel)                guaranteed        
                                                      damage. Only when 
                                                      HP \< 30.         

  Osamu Dazai     Counter        Immune to ALL        NO LONGER HUMAN:  Once every 2
                                 ability effects      nullify opponent  rounds
                                 always --- passives, special this      
                                 specials, status     round. vs Chuuya: 
                                                      80% success. vs   
                                                      Akutagawa: 100%.  

  Doppo Kunikida  Analysis       Strike deals +5      IDEAL NOTEBOOK:   Once per duel
                                 extra damage always  negate all        
                                                      incoming damage   
                                                      this round. Once  
                                                      per duel.         

  Ranpo Edogawa   Analysis       After both submit:   SUPER DEDUCTION:  Once per duel
                                 sees opponent move   skip opponent\'s  
                                 TYPE (not exact)     next move         
                                 before resolution    entirely          

  Akiko Yosano    Counter        At 20 HP or below:   THOU SHALT NOT    Once per duel
                                 auto-heals fully to  DIE: trigger full 
                                 50 HP (once)         heal to 50 HP     
                                                      immediately at    
                                                      any HP            

  Junichirou      Manipulation   Stance reduces       LIGHT SNOW:       Once every 3
  Tanizaki                       incoming by 60%      untargetable this rounds
                                 instead of 40%       round, 0 damage   
                                                      taken             

  Kyouka Izumi    Destruction    Takes 5 less damage  DEMON SNOW: 35    Once every 2
                                 every round          guaranteed damage rounds
                                 passively            ignoring all      
                                                      defense           

  Kenji Miyazawa  Destruction    Below 20 HP: immune  UNDEFEATED BY     Once per duel
                                 to all damage        RAIN: absorb all  
                                 completely           incoming, reflect 
                                                      50% back          

  Edgar Allan Poe Manipulation   If opponent uses     BLACK CAT: trap   Once per duel
                                 same move twice in a set --- opponent  
                                 row: auto-counter    takes 45 damage   
                                 fires next round     next round        
                                                      regardless        

  Sakunosuke Oda  Counter        End of round where   FLARE: do not     Once every 2
  \*                             Oda took more damage attack. Reveal    rounds
                                 than dealt: heals 8  opponent\'s next  
                                 HP                   move TYPE with    
                                                      100% accuracy.    
  ------------------------------------------------------------------------------------

*\* Oda: reserved --- owner assigns manually only. Required for Bar
Lupin easter egg.*

**Port Mafia**

  ------------------------------------------------------------------------------------
  **Character**   **Type**       **Passive**          **Special**       **Cooldown**
  --------------- -------------- -------------------- ----------------- --------------
  Chuuya Nakahara Destruction    Below 40 HP: +8      UPON THE TAINTED  Once every 2
                                 damage but takes +5  SORROW: 50 damage rounds
                                 damage too (gravity  ignoring ALL      
                                 overload)            defense           

  Ryunosuke       Destruction    Each round without   RASHOMON: 45      Once every 2
  Akutagawa                      using Special: stack damage ---        rounds
                                 +3 damage on next    ignores Stance    
                                 Strike               defense reduction 
                                                      entirely          

  Kouyou Ozaki    Manipulation   Can cancel opponent  GOLDEN DEMON: 35  Once per duel
                                 special if their     damage + opponent 
                                 move type predicted  loses one         
                                 (20% Manip chance)   remaining Special 
                                                      use               

  Gin Akutagawa   Counter        Strike vs Strike:    HANNYA: invisible Once every 3
                                 Gin always wins ---  this round, deal  rounds
                                 her Strike beats     30 damage, take 0 
                                 theirs always        damage            

  Ichiyou Higuchi Counter        Team fights: if      PROTECT: absorb   Once per duel
                                 Akutagawa also       ALL damage        
                                 present, +10 all     intended for one  
                                 damage               ally this round   

  Michizou        Destruction    Gambit wins 60%      MIDWINTER         Once every 2
  Tachihara                      instead of standard  MEMENTO: 40       rounds
                                 50%                  damage + freeze   
                                                      opponent Special  
                                                      for 1 round       
  ------------------------------------------------------------------------------------

**The Guild**

  ------------------------------------------------------------------------------------
  **Character**   **Type**       **Passive**          **Special**       **Cooldown**
  --------------- -------------- -------------------- ----------------- --------------
  Lucy Montgomery Manipulation   Opponent must reveal ANNE\'S ROOM:     Once every 3
                                 move TYPE before     opponent skips    rounds
                                 both submit ---      their move next   
                                 every round          round entirely    

  John Steinbeck  Destruction    Plants deal 5 damage GRAPES OF WRATH:  Once every 2
                                 per round            45 damage +       rounds
                                 automatically from   plants deal 10    
                                 round 1, no action   (double) next     
                                 needed               round too         

  Herman Melville Destruction    Starts duel at 120   MOBY DICK: 60     Once per duel
                                 HP                   damage (highest   
                                                      hit in game) ---  
                                                      Melville takes 20 
                                                      self-damage       

  Mark Twain      Manipulation   Clone misdirects 20% HUCK AND TOM:     Once every 3
                                 of all incoming      redirect ALL      rounds
                                 damage every round,  incoming to clone 
                                 always               this round, Twain 
                                                      takes 0           

  Louisa Alcott   Analysis       Sees opponent\'s     LITTLE WOMEN:     Once per duel
                                 exact HP value at    heal 30 HP +      
                                 all times            remove all        
                                                      opponent active   
                                                      buffs             
  ------------------------------------------------------------------------------------

**Hunting Dogs**

  -----------------------------------------------------------------------------------
  **Character**   **Type**      **Passive**          **Special**       **Cooldown**
  --------------- ------------- -------------------- ----------------- --------------
  Tetchou Suehiro Destruction   Immune to all stun   PLUM BLOSSOMS IN  Once every 2
                                and freeze effects   SNOW: 55 damage   rounds
                                always               --- in team       
                                                     fights cleaves    
                                                     both enemies      

  Saigiku Jouno   Analysis      Knows opponent       PUPPETEER: force  Once per duel
                                ability TYPE before  opponent to use   
                                duel begins (shown   Recover this      
                                at duel start)       round instead of  
                                                     their move        

  Teruko Okura    Analysis      Sees opponent exact  GASP OF SOUL:     Once per duel
                                HP at all times      permanently       
                                                     reduce opponent   
                                                     max HP by 20 for  
                                                     rest of duel      

  Michizou        Destruction   Same as Mafia        MIDWINTER         Once every 2
  Tachihara                     version: Gambit 60%  MEMENTO: same as  rounds
  (Dogs)                                             Mafia version     
  -----------------------------------------------------------------------------------

**Reserved Characters**

  -----------------------------------------------------------------------------------------
  **Character**   **Faction**   **Type**       **Passive**            **Special**
  --------------- ------------- -------------- ---------------------- ---------------------
  Yukichi         agency        counter        Immune to ALL debuffs, AGENCY DIRECTIVE:
  Fukuzawa                                     stun, freeze, max HP   team heals 10 HP
                                               reduction --- always   (team) or 30 dmg
                                                                      ignore defense (1v1)
                                                                      --- every 2 rounds

  Ogai Mori       mafia         manipulation   Sees opponent\'s full  ELISE\'S COMMAND:
                                               cooldown state before  Elise absorbs all
                                               submitting each round  incoming damage (30
                                                                      HP buffer) --- every
                                                                      3 rounds

  Francis         guild         destruction    Starts at 130 HP.      DOLLAR CONVERSION:
  Fitzgerald                                   Every 20 HP lost = +3  spend 20 HP to deal
                                               damage permanently for 65 damage. Only above
                                               duel                   30 HP --- every 2
                                                                      rounds

  Fukuchi Ouchi   dogs          analysis       Once per duel: reverse TIME SLASH: 45 dmg.
                                               last round (both moves If opp used Strike:
                                               become Recover).       becomes 70 dmg ---
                                               30-second window.      every 2 rounds

  Ango Sakaguchi  special       analysis       Sees all four behavior DISCOURSE ON
                                               scores of opponent     DECADENCE: opponent
                                               before duel begins     cannot use Special
                                                                      for next 2 rounds ---
                                                                      once per duel

  Fyodor          rats          manipulation   Direct-contact         THE DEMON DESCENDS:
  Dostoevsky                                   abilities deal 15 less reduce opponent max
                                               dmg. Environmental     HP by 30 permanently
                                               still works.           for duel --- once per
                                                                      duel

  Nikolai Gogol   decay         manipulation   Sees opponent\'s full  THE OVERCOAT:
                                               move history from ALL  disguise as any
                                               previous duels         character for one
                                                                      round. Opponent sees
                                                                      ???. --- once per
                                                                      duel

  Sakunosuke Oda  agency        counter        End of round where Oda FLARE: reveal
                                               took more damage than  opponent\'s next move
                                               dealt: heals 8 HP      TYPE with 100%
                                                                      accuracy --- every 2
                                                                      rounds
  -----------------------------------------------------------------------------------------

**Canon Rivalry Bonuses**

  -----------------------------------------------------------------------
  **Matchup**      **Bonus**                  **Notes**
  ---------------- -------------------------- ---------------------------
  Atsushi vs       Both deal +10 damage to    Always --- no activation
  Akutagawa        each other every round     needed

  Dazai vs Chuuya  Both deal +5 damage to     Dazai\'s nullify drops to
                   each other every round     80% success vs Chuuya

  Dazai vs         Dazai nullify is 100% vs   Akutagawa gets +5 rage
  Akutagawa        Akutagawa                  damage every round

  Oda vs Akutagawa Oda deals +8 damage to     Canon --- Oda\'s death
                   Akutagawa every round      shaped Akutagawa

  CORRUPTION (team 999 damage to all enemies  Dazai + Chuuya same team,
  event)           --- instant win            both must activate, owner
                                              triggers, ONE USE EVER IN
                                              GAME HISTORY
  -----------------------------------------------------------------------

**Part Seven --- Complete Build Order**

*Feed to Codex in this exact sequence. Never skip. Never merge unrelated
prompts into one.*

  --------------------------------------------------------------------------------
  **\#**   **Prompt**      **Key Outputs**      **Gaps Fixed**   **Depends On**
  -------- --------------- -------------------- ---------------- -----------------
  1        Character       Quiz score baseline, Oda added,       Prompts 1-5
           Assignment      lore_topics          assignment       
           Enrichment      tracking, enriched   quality fixed    
                           Gemini prompt,                        
                           20-event threshold,                   
                           secondary match,                      
                           Oda + Bar Lupin                       
                           trigger                               

  2        Duel System     Duels DB, duel       Duel discovery,  Prompt 1 above
           (full spec)     discovery, Option B  observer pool    
                           pre-assignment,      UX,              
                           resolver Edge        pre-assignment   
                           Function, duel page  state            
                           UI, AP resolution,                    
                           all 24 character                      
                           abilities                             

  3        Faction Wars    Wars DB, points      Chat moderation  Prompt 2
           (full spec)     system, day          (add alongside), 
                           timeline, resolution faction transfer 
                           Edge Function, war   DB fields        
                           strip, owner war                      
                           panel                                 

  4        Chronicle Page  Chronicle DB, page + Chronicle page   Prompt 3
                           entry view,          finally exists   
                           auto-draft triggers,                  
                           mod approval flow                     

  5        Arena           Voting system,       ---              Prompt 3
                           ranked spectatable                    
                           duels, season                         
                           calendar                              

  6        Scenario Engine NPC fight system,    ---              Prompt 5
                           investigation type,                   
                           timed crisis, /owner                  
                           scenario panel                        

  7        Yokohama Map +  SVG map, district    Leaderboard      Prompt 6
           Leaderboard     ownership,           added            
                           leaderboard page                      

  8        The Book +      Weekly AP            Endgame defined  Prompt 7
           Endgame         competition, Book                     
                           Holder multiplier,                    
                           City Tokens, Rank 6                   
                           prestige                              

  9        Settings:       Faction transfer UI, Transfer UI      Any point after
           Transfer + Mods chat moderation      built, chat mods Prompt 3
                           tools, faction       built            
                           transfer DB                           

  10       Hidden Factions Rats/Decay/Clock     Reserved         Prompt 8
                           Tower triggers,      character        
                           Fyodor/Gogol duel    mechanics        
                           mechanics, Bar Lupin complete         
                           channel                               

  11       Optimisation    Dynamic imports,     Performance      All prompts done
           Pass            indexes, rate        before traffic   
                           limiting, error                       
                           boundaries, metadata                  
  --------------------------------------------------------------------------------

**Part Eight --- Operations Reference**

**The Two Accounts --- Never Mix**

  -----------------------------------------------------------------------
                **Owner Account**            **Ango Account**
  ------------- ---------------------------- ----------------------------
  Identity      Personal Gmail --- NOBODY    karmabanae@gmail.com ---
                knows this exists            public face in Yokohama

  Browser       Firefox --- always           Chrome --- always

  Role          owner --- no character, no   mod --- special_div --- Ango
                faction                      Sakaguchi

  Access        /owner panel, Supabase,      faction/special_div, mod
                Vercel, GitHub               queue, Chronicle, Registry

  Purpose       Infrastructure --- invisible Story --- everything players
                                             see

  Bookmarks     /owner, supabase dashboard,  /faction/special_div,
                vercel dashboard, github     /registry, /chronicle,
                                             /duels
  -----------------------------------------------------------------------

**How Ango Speaks --- Character Guide**

+-----------------------------------+-----------------------------------+
| **ALWAYS**                        | **NEVER**                         |
|                                   |                                   |
| -   Formal. Cold. Precise. Never  | -   \'hey everyone\' or any       |
|     casual.                       |     casual opener                 |
|                                   |                                   |
| -   Present tense. Short          | -   Exclamation marks or emojis   |
|     sentences.                    |                                   |
|                                   | -   More than 4 sentences in one  |
| -   References \'the city\' not   |     post                          |
|     \'the website\'               |                                   |
|                                   | -   Post two days in a row unless |
| -   References \'records\' not    |     war active                    |
|     \'posts\'                     |                                   |
|                                   | -   Break character even in DMs   |
| -   References \'ability users\'  |                                   |
|     not \'members\'               | -   Confirm who runs the site     |
|                                   |                                   |
| -   Maximum 4 sentences per post  | -   Comment on technical issues   |
|                                   |     publicly                      |
| -   Posts 3-4 times per week      |                                   |
|     maximum                       | -   Apologize. The city\'s        |
|                                   |     assessment stands.            |
| -   Less is always more           |                                   |
+-----------------------------------+-----------------------------------+

**Ango Post Bank --- Ready to Use**

+-----------------------------------------------------------------------+
| **Restart the game when it goes quiet:**                              |
|                                                                       |
| *\"An unregistered ability signature was detected near the            |
| waterfront. Origin unknown. The city is watching.\"*                  |
|                                                                       |
| Post this and wait. It restarts everything.                           |
|                                                                       |
| **Declare a war:**                                                    |
|                                                                       |
| *\"The registry has opened a conflict file between \[Faction A\] and  |
| \[Faction B\]. Dispute: \[one sentence\]. Duration: 72 hours. The     |
| city is watching.\"*                                                  |
|                                                                       |
| **After a war ends:**                                                 |
|                                                                       |
| *\"\[Winning faction\] has secured \[what they won\]. The registry    |
| has updated its district records accordingly. \[One cold line about   |
| the losing faction\].\"*                                              |
|                                                                       |
| **After a duel (significant ones only):**                             |
|                                                                       |
| *\"\[Winner character\] defeated \[Loser character\] near             |
| \[district\]. The registry notes this outcome without comment.\"*     |
|                                                                       |
| **Acknowledging a great Registry post (private notification only):**  |
|                                                                       |
| *\"Ango-san has read your report.\"*                                  |
|                                                                       |
| Nothing else. Send only this. They will understand.                   |
|                                                                       |
| **Responding to any challenge to a decision:**                        |
|                                                                       |
| *\"The city\'s assessment stands.\"*                                  |
|                                                                       |
| That is all. No further explanation. Ever.                            |
+-----------------------------------------------------------------------+

**Emergency SQL Reference**

+-----------------------------------------------------------------------+
| \-- All users and status:                                             |
|                                                                       |
| SELECT username, role, faction, character_name, ap_total, rank        |
|                                                                       |
| FROM profiles ORDER BY created_at;                                    |
|                                                                       |
| \-- Manually assign character:                                        |
|                                                                       |
| UPDATE profiles SET                                                   |
|                                                                       |
| character_name=\'\[Name\]\', character_match_id=\'\[slug\]\',         |
|                                                                       |
| character_ability=\'\[ability\]\', character_type=\'\[type\]\',       |
|                                                                       |
| character_assigned_at=now()                                           |
|                                                                       |
| WHERE username=\'\[username\]\';                                      |
|                                                                       |
| \-- Give AP manually:                                                 |
|                                                                       |
| UPDATE profiles SET ap_total=ap_total+\[amount\] WHERE                |
| username=\'\[username\]\';                                            |
|                                                                       |
| \-- Check active wars:                                                |
|                                                                       |
| SELECT \* FROM faction_wars WHERE status=\'active\';                  |
|                                                                       |
| \-- Check pending Registry posts:                                     |
|                                                                       |
| SELECT case_number, title, author_id, created_at                      |
|                                                                       |
| FROM registry_posts WHERE status=\'pending\';                         |
|                                                                       |
| \-- Check event count for character assignment:                       |
|                                                                       |
| SELECT COUNT(\*) FROM user_events WHERE user_id=\'\[id\]\';           |
|                                                                       |
| \-- Check duel state:                                                 |
|                                                                       |
| SELECT d.status, d.current_round, d.challenger_hp, d.defender_hp      |
|                                                                       |
| FROM duels d WHERE d.id=\'\[duel_id\]\';                              |
+-----------------------------------------------------------------------+

*横浜は、いつも雨が降っている。*

BungouArchive --- 文豪アーカイブ

*Master Game Bible v2 · Single Source of Truth*