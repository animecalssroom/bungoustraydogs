# BUNGOUARCHIVE — GAME MECHANICS REFERENCE
## 文豪アーカイブ ゲームメカニクス辞典
> **USAGE:** Pure mechanics. No lore. Paste into any Codex prompt or Claude conversation when you need exact numbers, thresholds, or resolver logic. Companion to CHARACTERS.md, FACTIONS.md, RELATIONSHIPS.md.

---

# PLAYER PROGRESSION

## AP (Action Points)
```
AP never goes below 0.
Rank never decreases regardless of AP loss.
```

### AP Thresholds → Rank
```
0        Rank 1
100      Rank 2
500      Rank 3
1,500    Rank 4
4,000    Rank 5
10,000   Rank 6
```

### AP Rewards
```
Daily login          +5 AP
Chat message         +2 AP
Archive read (unique) +3 AP (once per character per session)
Registry post (approved) +25 AP
Registry post (pending)  +0
Registry post (rejected) +0
Duel win (standard)  +50 AP
Duel win (comeback)  +75 AP   (HP was ≤ 20 at any point and player won)
Duel loss            -20 AP   (min 0)
Duel draw            +5 AP    each
Duel forfeit win     +50 AP
Duel forfeit loss    -20 AP   (min 0)
War duel win         +50 AP + 3 war points to faction
Arena vote           +5 AP
Arena debate post    +10 AP (mod-approved)
```

### City Tokens (Late Game — after 10,000 AP)
```
"Yokohama Veteran" designation
City Seal badge + gold profile border
Every 1,000 AP above 10,000 = 1 City Token
Token uses (once per month each):
  - Name a district event (Ango posts as canon)
  - Request an Arena matchup
  - Nominate a Registry post for featured
Tokens do not roll over.
```

---

# CHARACTER ASSIGNMENT

## Event Threshold
```
Standard:  20 events required before assignment fires
Fast-track: 10 events IF one trait score ≥ 2× all others combined
            OR duel_style shows one move with ≥ 2× count of all others
```

## Events That Count Toward Threshold
```
daily_login       +1 event, behavior: loyalty +1
chat_message      +1 event, behavior: loyalty +1
archive_read      +1 event, behavior: intel +1
field_note        +1 event, behavior: intel +1, control +2
lore_post         +1 event (on approval only, not submission), behavior: intel +2
duel_complete     +1 event, behavior: power +2
arena_vote        +1 event, behavior: control +1
```

## Behavior Scores Written at Quiz
```
Quiz baseline written to behavior_scores at quiz completion.
Written to quiz_scores (jsonb) for permanent reference.
Subsequent events adjust ON TOP of quiz baseline.
```

## Assignment Data Sent to Gemini
```
1. Power / Intel / Loyalty / Control scores (numeric)
2. lore_topics: top 3 most-read character slugs (from archive visits)
3. duel_style: {gambit: N, strike: N, stance: N}
4. avg_move_speed_minutes (fast <3 = impulsive, slow >15 = deliberate)
5. writing_sample: first 200 chars of earliest Registry post
6. recent_events: last 5 event_types
7. quiz_dominant_trait: highest quiz score trait
```

## Move Speed → Assignment Signal
```
avg_move_speed_minutes < 3      "fast submitter (impulsive)"
                                → Chuuya, Tachihara, Kenji
avg_move_speed_minutes 3–15     "measured submitter"
                                → most characters
avg_move_speed_minutes > 15     "slow submitter (deliberate)"
                                → Ranpo, Kunikida, Louisa
```

## Writing Tone → Assignment Signal
```
Aggressive/terse               → Mafia destruction types
Philosophical/verbose          → Dazai, Poe, Ranpo
Protective/emotional           → Yosano, Higuchi
Precise/formal                 → Ango (Special Division)
Playful/concealing             → Gogol (Decay)
Dark philosophical             → Fyodor (Rats)
```

## Reserved Characters — Filtered Before Everything
```
ALWAYS filter these before sending to Gemini AND before distance fallback:
mori-ogai | yukichi-fukuzawa | francis-fitzgerald | fukuchi-ouchi
fyodor-dostoevsky | nikolai-gogol | ango-sakaguchi | sakunosuke-oda

If Gemini returns a reserved slug: use distance fallback immediately.
```

## Secondary Character Match
```
After every assignment (both Gemini and fallback paths):
Run Euclidean distance on all non-reserved, non-reserved characters.
Sort by distance. Store index [1] (second closest) as:
  secondary_character_slug
  secondary_character_name
Profile UI: "Secondary resonance: [name]" — Cormorant italic, muted.
No explanation. Render nothing if null.
```

---

# DUEL MECHANICS

## HP Starting Values
```
Default max HP:        100
Fitzgerald max HP:     130 (set at duel creation)
Melville max HP:       120 (set at duel creation)
All others:            100
```

## Move Types — Base Damage
```
STRIKE     25–35 damage       (Math.floor(Math.random() * 11) + 25)
           100% incoming damage taken

STANCE     10–15 damage       (Math.floor(Math.random() * 6) + 10)
           Incoming damage reduced by 40% (opponent gets 60% through)
           EXCEPTION: Counter type vs Strike — 150% counter-damage

GAMBIT     50 damage if win, 0 if lose
           win_threshold = Math.random() >= 0.5  (standard)
           win_threshold = Math.random() >= 0.4  (Tachihara — 60% rate)
           100% incoming damage taken (both win and loss cases)

RECOVER    0 damage dealt
           +20 HP healed (capped at max_hp)
           100% incoming damage taken
           CANNOT be used 2 rounds in a row

SPECIAL    Varies per character (see CHARACTERS.md for each)
           Cooldowns tracked in duel_cooldowns table
```

## Ability Type Interactions
```
COUNTER vs STRIKE:
  If defender.ability_type === 'counter' AND attacker.move === 'strike':
    defender_damage_dealt *= 1.5 (round up)

MANIPULATION:
  20% chance each round (roll ≤ 0.2) to peek opponent move type
  Result: logged in special_events only (no mechanical effect from peek)

ANALYSIS:
  30% chance each round (roll ≤ 0.3) to predict opponent move
  If prediction correct: +5 bonus damage to analysis player
```

## Resolver Order (NEVER deviate from this sequence)
```
Step 1:   Fetch duel + current round + both profiles + character_profiles + cooldowns
Step 2:   Determine effective character for each player this round
          (Gogol override check)
Step 3:   Validate moves server-side (re-validate — client could be stale)
          SPECIAL with expired cooldown → override to STRIKE silently, log in special_events
          RECOVER used consecutively → override to STANCE silently, log in special_events
Step 4:   Apply ability type passive modifiers (Counter vs Strike, Manipulation, Analysis)
Step 5:   Apply character-specific passives
Step 6:   Apply canon rivalry bonuses
Step 7:   Calculate damage both directions
Step 8:   Apply HP changes — clamp minimum 0, maximum to max_hp
          Flag comeback: if player HP dropped to ≤ 20 at any point AND they win
Step 9:   Update cooldowns in duel_cooldowns table
Step 10:  Check win condition:
          - Either player HP ≤ 0: duel over
          - Round 5 ends with both alive: higher HP wins, equal = draw
Step 11:  Call Gemini for round narrative (ONLY after step 10 is complete)
Step 12:  Write complete round record to duel_rounds
Step 13:  If duel is over: call resolve-duel-aftermath
Step 14:  Broadcast Realtime to duel channel
```

## Win Conditions
```
HP ≤ 0:             Player is defeated. Duel ends immediately.
Round 5 complete:   Higher HP wins. Equal HP = draw.
Auto-forfeit:       3 consecutive auto-Stances (timeout). Forfeit counted.
Forfeit:            Player forfeits. Opponent wins.
```

## AP Resolution
```
Standard win:      winner +50 AP  /  loser -20 AP (min 0)
Comeback win:      winner +75 AP  /  loser -20 AP (min 0)
Draw:              +5 AP each
War duel win:      winner +50 AP + 3 war points  /  loser -20 AP (min 0)
Forfeit win:       winner +50 AP  /  loser -20 AP (min 0)
Auto-forfeit win:  winner +50 AP  /  loser -20 AP (min 0)
```

## Timers
```
Round deadline:     30 minutes from round start
                    Timer is cosmetic on client — server resolves authoritatively
Cron check:         Every 5 minutes — finds expired rounds, applies auto-Stance
Auto-forfeit:       3 consecutive auto-Stances = forfeit
Challenge expiry:   24 hours from creation
Open challenge:     24 hours from creation
Fukuchi reversal:   30 seconds from round resolution
```

## Duel Limits
```
Max active/pending duels per player:  3
Challenge accept window:              24 hours
Pre-assignment duels:                 SPECIAL rejected server-side (400)
Same faction duels:                   Blocked (challenger_faction !== defender_faction enforced)
```

---

# SPECIAL ABILITY COOLDOWNS

## Full Cooldown Reference
```
CHARACTER            SPECIAL NAME                 COOLDOWN
─────────────────────────────────────────────────────────
Atsushi Nakajima     Beast Beneath the Moonlight  Once per duel (HP ≤ 30 gate)
Osamu Dazai          No Longer Human              Every 2 rounds
Doppo Kunikida       Ideal Notebook               Once per duel
Ranpo Edogawa        Super Deduction              Once per duel
Akiko Yosano         Thou Shalt Not Die           Once per duel
Jun. Tanizaki        Light Snow (Full Veil)        Every 3 rounds
Kyouka Izumi         Demon Snow                   Every 2 rounds
Kenji Miyazawa       Undefeated (Full)            Once per duel
Edgar Allan Poe      The Trap                     Once per duel
Chuuya Nakahara      Upon the Tainted Sorrow      Every 2 rounds
Ryu. Akutagawa       Rashōmon                     Every 2 rounds
Kouyou Ozaki         Golden Demon                 Once per duel
Gin Akutagawa        Hannya                       Every 3 rounds
Ichiyou Higuchi      Protect                      Once per duel
M. Tachihara         Midwinter Memento            Every 2 rounds
Lucy Montgomery      Anne's Room (Seal)           Every 3 rounds
John Steinbeck       Grapes of Wrath              Every 2 rounds
Herman Melville      Moby Dick                    Once per duel
Mark Twain           The Clone (Full)             Every 3 rounds
Louisa Alcott        Little Women                 Once per duel
Francis Fitzgerald   Dollar Conversion            Every 2 rounds
Tetchou Suehiro      Plum Blossoms in Snow        Every 2 rounds
Saigiku Jouno        Puppeteer of the Rainbow     Once per duel
Teruko Okura         Gasp of the Soul             Once per duel
Ango Sakaguchi       Discourse on Decadence       Once per duel
Yukichi Fukuzawa     Agency Directive             Every 2 rounds
Ogai Mori            Elise's Command              Every 3 rounds
Fukuchi Ouchi        Time Slash                   Every 2 rounds
Fyodor Dostoevsky    The Demon Descends           Once per duel
Nikolai Gogol        The Overcoat                 Once per duel
Sakunosuke Oda       Flare                        Every 2 rounds
```

---

# BEHAVIOR SCORE → CHARACTER TRAIT MATCHING

## How Distance Fallback Works
```
User scores:        {power: U_p, intel: U_i, loyalty: U_l, control: U_c}
Character traits:   {trait_power: C_p, trait_intel: C_i, trait_loyalty: C_l, trait_control: C_c}

Manhattan distance: |U_p - C_p| + |U_i - C_i| + |U_l - C_l| + |U_c - C_c|
Lowest distance wins.
```

## Character Trait Reference Table
```
CHARACTER                   P   I   L   C   TYPE
────────────────────────────────────────────────
Atsushi Nakajima            3   2   4   2   destruction
Osamu Dazai                 2   5   2   3   counter
Doppo Kunikida              3   4   4   5   analysis
Ranpo Edogawa               1   5   3   4   analysis
Akiko Yosano                4   3   4   4   counter
Jun. Tanizaki               2   3   4   3   manipulation
Kyouka Izumi                4   2   4   3   destruction
Kenji Miyazawa              5   1   5   2   destruction
Edgar Allan Poe             1   5   2   4   manipulation
Chuuya Nakahara             5   3   5   2   destruction
Ryu. Akutagawa              5   3   4   3   destruction
Kouyou Ozaki                3   4   4   4   manipulation
Gin Akutagawa               3   3   5   5   counter
Ichiyou Higuchi             3   2   5   3   counter
Michizou Tachihara          4   3   3   3   destruction
Lucy Montgomery             2   3   3   4   manipulation
John Steinbeck              4   2   4   3   destruction
Herman Melville             5   2   3   2   destruction
Mark Twain                  3   3   3   3   manipulation
Louisa Alcott               2   4   4   5   analysis
Tetchou Suehiro             5   2   5   4   destruction
Saigiku Jouno               3   5   3   4   analysis
Teruko Okura                3   4   4   5   analysis
```

*(Reserved characters not in fallback pool)*

---

# FACTION WARS

## Points System
```
Duel win vs enemy (is_war_duel=true):    3 pts
Registry post (mod marks war-related):   2 pts   (cap: 2/player/war)
Daily login during active war:           1 pt/day
Tag Team (2v2) win:                      5 pts
Faction Raid (3v3) win:                  5 pts
Boss Fight win:                          auto war victory
```

## War Timeline
```
Day 1 (0–24h):    Individual duels + Registry posts + Chronicle declaration
Day 2 (24–48h):   Tag Team (2v2) + Faction Raid (3v3) unlock
Day 3 (48–72h):   Boss Fight unlocks
```

## War Resolution
```
No Boss Fight:       Highest points wins
Tied points:         Defending faction wins
Boss Fight win:      Auto victory regardless of points
Cron check:          Every 30 minutes, checks wars past ends_at
```

## War Rewards
```
Winner:              +100 AP per member
Top contributor:     +50 AP bonus
Loser:               +20 AP consolation
Stakes apply:        District ownership | AP multiplier | Registry priority
```

## Boss Fight Difficulty
```
Easy:      Boss HP = 80
Normal:    Boss HP = 100
Hard:      Boss HP = 130
Extreme:   Boss HP = 150
```

---

# RANK TITLES — ALL FACTIONS

```
RANK  AGENCY                 MAFIA              GUILD                  DOGS               SPECIAL
  1   Unaffiliated Detective Foot Soldier       Associate              Recruit            Flagged
  2   Field Operative        Operative          Contractor             Enlisted           Monitored
  3   Senior Operative       Lieutenant         Acquisitions Agent     Sergeant           Cleared
  4   Lead Detective         Captain            Senior Partner         Lieutenant         Operative
  5   Special Investigator   Executive          Director               Commander          Handler
  6   Executive Agent        Black Hand         Founding Member        First Hound        Controller
```

---

# REGISTRY SYSTEM

## Case Number Format
```
YKH-[F]-[YEAR]-[NNNN]
F = A (Agency) | M (Mafia) | G (Guild) | D (Dogs) | S (Special) | X (Unknown)
Example: YKH-A-2025-0041
```

## Post Status Flow
```
pending → approved (mod approves, published_at set)
pending → rejected (mod rejects, mod_note added)
approved → featured (mod sets featured = true)
```

## Submission Requirements
```
Minimum word count:   200 words
Rank required:        Rank 2+ (ap_total ≥ 100)
Role required:        member, mod, or owner
Pre-assignment:       Cannot post (character_name IS NULL blocks this)
```

## Gemini Review Fields
```json
{
  "canon_consistent": true,
  "canon_notes": "one sentence if issues",
  "character_accurate": true,
  "character_notes": "one sentence if issues",
  "quality_score": 0.0,
  "recommendation": "approve|review|reject",
  "recommendation_reason": "one sentence"
}
```

---

# AUTHENTICATION & ROLES

## User Roles
```
observer    Quiz not complete or Special Div pool — limited access
member      Regular faction member — full game access
mod         Moderation access — Registry approvals, Chronicle
owner       Full admin — reserved chars, wars, panels, invisible in game
```

## Access Matrix
```
                    observer  member  mod   owner
Archive read            ✓       ✓      ✓     ✓
Registry read           ✓       ✓      ✓     ✓
Registry write          ✗       ✓      ✓     ✓
Faction chat read       ✗       ✓      ✓     ✓
Faction chat write      ✗       ✓      ✓     ✓
Duel challenge          ✗       ✓      ✓     ✓
Chronicle read          ✓       ✓      ✓     ✓
Chronicle write         ✗       ✗      ✓     ✓
Owner panel             ✗       ✗      ✗     ✓
```

## Key Accounts
```
Owner:   Personal Gmail. role=owner. Invisible in game. No character. No faction.
         Firefox only.
Ango:    karmabanae@gmail.com. role=mod. faction=special_div. character=Ango Sakaguchi.
         Chrome only.
NEVER mix browsers.
```

---

# USER LIMITS

```
Total users:         100 (5 factions × 20 slots)
Per faction:         20 members maximum
Exam retake:         Once lifetime (30 days post-join + 500 AP + costs 500 AP)
Faction transfer:    Once lifetime (30 days + 500 AP + no active war)
Max active duels:    3 per player
Challenge window:    24 hours
Open challenges:     1 per player at a time
```

---

# GEMINI API RULES (NEVER BREAK THESE)

```
1. ALWAYS define fallback string BEFORE the Gemini call
2. ALWAYS wrap in try/catch with 5000ms timeout
3. ALWAYS validate returned slug against reserved list if doing assignment
4. NEVER let Gemini decide damage, HP, or win/loss
5. NEVER call Gemini before game resolution (resolver steps 1-10 first)
6. Strip ```json fences before JSON.parse()
7. Temperature 0.6 for combat narratives
8. Temperature 0.4 for assignment (determinism matters)
9. Max tokens 1000 for narratives, 500 for assignment
10. Model: claude-sonnet-4-20250514 — wait, this is Gemini
    Model: gemini-pro or gemini-1.5-pro (use whichever is current in .env)
```

---

# DATABASE QUICK REFERENCE

## Key Tables
```
profiles              user data, AP, rank, character assignment, behavior_scores
user_events           event log (feeds assignment threshold)
character_profiles    all character definitions (traits, slugs, types)
reserved_characters   reserved slug list + assignment tracking
rank_thresholds       AP thresholds per faction per rank
duels                 duel records (HP, status, characters)
duel_rounds           per-round move data, narratives, damage
duel_cooldowns        active cooldowns per player per duel
open_challenges       public challenge board
notifications         per-user notifications (type, action_url, reference_id)
faction_activity      faction event log (used for bulletin feeds)
registry_posts        lore submissions (pending/approved/rejected)
registry_saves        bookmarked posts per user
chronicle_entries     canon story entries (mod-approved only)
observer_pool         Special Division candidates
global_events         once-ever events (corruption, etc.)
```

## Behavior Scores JSONB Structure
```json
{
  "power": 0,
  "intel": 0,
  "loyalty": 0,
  "control": 0,
  "duel_style": {
    "gambit": 0,
    "strike": 0,
    "stance": 0
  },
  "arena_votes": {},
  "lore_topics": {}
}
```

## Profiles — Key Columns
```
id                    uuid
username              text unique
faction               text
role                  text (observer|member|mod|owner)
character_name        text (null until assigned)
character_match_id    text (slug)
character_ability     text
character_ability_jp  text
character_type        text
character_description text
character_assigned_at timestamptz
ap_total              integer default 0
rank                  integer default 1
rank_title            text
behavior_scores       jsonb
quiz_scores           jsonb (permanent quiz baseline)
duel_wins             integer default 0
duel_losses           integer default 0
duel_forfeits         integer default 0
avg_move_speed_minutes float
secondary_character_slug text
secondary_character_name text
is_bot                boolean default false
bot_config            jsonb
transfer_used         boolean default false
exam_retake_used      boolean default false
exam_retake_eligible_at timestamptz
```

---

# REALTIME SUBSCRIPTIONS — CHANNELS

```
profile:${userId}          Profile changes (character assignment, rank up)
faction:${faction}         Faction activity feed
duel:${duelId}             Duel round resolution, move submissions
notifications:${userId}    New notifications
war:${warId}               War points updates
arena:${matchupId}         Vote updates
```

---

*BungouArchive — 文豪アーカイブ*
*横浜は、いつも雨が降っている。*
