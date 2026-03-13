# BungouArchive — 文豪アーカイブ
## Complete Continuation Guide
### Prompts 3, 4, 5 + World Setup + Ango Management

> 横浜は、いつも雨が降っている。

---

## HOW TO CONTINUE IN A NEW CHAT

Paste this at the start of every new Claude conversation:

```
I am building BungouArchive (文豪アーカイブ) — a Bungou Stray Dogs 
fan community website. It is a literary atmospheric game where users 
get assigned to factions (Agency, Mafia, Guild, Hunting Dogs, 
Special Division) via a quiz, earn AP, get assigned BSD characters 
via behavior analysis + Gemini AI, and participate in a living 
Yokohama story.

Tech stack: Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel.
Auth: Google OAuth + Email/Password. No Discord.
AI: Gemini API server-side only.
Animations: Framer Motion + GSAP.

COMPLETED SO FAR:
- Prompt 1: Atmosphere (CSS tokens, fonts, RainLayer, InkTransition, 
  KanjiReveal, SoundToggle, time-based theme system)
- Prompt 2: Faction private space (bulletin, live feed, roster, 
  transmission log chat, war strip, RLS confirmed)
- Owner setup page (/setup/owner — closes after first use)
- Special Division direct access flow
- Landing page opening narrative

IN PROGRESS: Prompt 3 — Profile page + Character assignment system

Key decisions locked:
- 100 user cap (5 factions × 20 slots)
- Quiz: 7 questions, 4 assignable factions
- Character assignment: behavior scores + Gemini + distance fallback
- Reserved characters: Mori, Fukuzawa, Fitzgerald, Fukuchi, 
  Fyodor, Gogol — owner assigns manually only
- Ango Sakaguchi: owner's public character, never auto-assigned
- Special Division: no auto character assignment, owner only
- Faction locking: permanent with one transfer lifetime
- Hidden factions: Rats, Decay of Angel, Clock Tower

The full project context, all locked decisions, and all previous 
prompts are documented in my continuation guide. 
I will paste specific prompts as needed.
```

---

## CURRENT BUILD STATUS

```
✅ Prompt 1 — Atmosphere pass (DONE)
✅ Prompt 2 — Faction private space (DONE)  
✅ Owner setup page (DONE)
✅ Special Division bypass flow (DONE)
✅ Landing page narrative (DONE)
🔄 Prompt 3 — Profile + Character system (IN PROGRESS)
✅ Prompt 4 — The Archive
✅ Prompt 5 — The Registry
⏳ Optimisation prompt (before hosting)
⏳ Owner + Ango account setup (manual, after deploy)
```

### REPO IMPLEMENTATION NOTES (2026-03-12)

The repo now includes the following Prompt 3 slices:

- Prompt 3 profile page upgrade is implemented.
- Rank/AP progress, deterministic ability signature, observation meter, rank-up flash, and one-time character reveal are implemented.
- `rank.ts`, `ability-types.ts`, `ability-signature.ts`, and `behavior.ts` are implemented in the repo.
- Onboarding no longer auto-assigns a character at faction acceptance.
- Delayed character assignment now exists as an internal service plus `/api/character/assign`.
- Behavior/event accumulation now exists via shared server-side event logging plus `/api/behavior/update`.
- Prompt 3 schema scaffolding for profile character fields, rank thresholds, reserved characters, and character profiles has been added to local SQL files.

Prompt 3 status in the repo now:

- Gemini-capable character assignment exists in the app service, with a matching edge function scaffold under `supabase/functions/assign-character`
- DailyLoginRitual is implemented and mounted globally
- owner reserved-character assignment panel exists at `/owner/assign-character`
- exam retake flow exists via `/exam` plus a retake-aware quiz submission path
- full `character_profiles` SQL seed is present in `backend/db/seed.sql`
- field record log is present on the profile page for the file owner

Prompt 4 status in the repo now:

- public archive routes now exist at `/archive` and `/archive/[slug]`
- archive uses a server model with local fallback catalog support when `archive_entries` is not populated yet
- old `/characters` links now resolve to the new archive route
- local SQL files now include `archive_entries` schema/reset/seed scaffolding

Prompt 5 status in the repo now:

- public registry feed now exists at `/registry`
- registry case-file pages now exist at `/registry/[caseNumber]`
- rank-gated submission now exists at `/registry/submit`
- faction-space moderation queue is mounted for mods and owners
- registry save flow, AP awards, notifications, and Gemini review helper are implemented in the app
- local SQL files now include `registry_posts`, `registry_saves`, and case-number generator scaffolding

---

## PROMPT 3 — PROFILE PAGE + CHARACTER SYSTEM + GAME LAYER

*Feed this to Codex. Self-contained. Do not touch Prompts 1 and 2 work.*

### STEP 3A — DATABASE

Run all of this in Supabase SQL editor first:

```sql
-- Profile additions
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS character_name text,
ADD COLUMN IF NOT EXISTS character_match_id text,
ADD COLUMN IF NOT EXISTS character_ability text,
ADD COLUMN IF NOT EXISTS character_ability_jp text,
ADD COLUMN IF NOT EXISTS character_description text,
ADD COLUMN IF NOT EXISTS character_type text,
ADD COLUMN IF NOT EXISTS character_assigned_at timestamptz,
ADD COLUMN IF NOT EXISTS behavior_scores jsonb DEFAULT '{
  "power": 0, "intel": 0, "loyalty": 0, "control": 0,
  "arena_votes": {},
  "duel_style": {"gambit": 0, "strike": 0, "stance": 0},
  "lore_topics": {}
}'::jsonb,
ADD COLUMN IF NOT EXISTS exam_retake_eligible_at timestamptz,
ADD COLUMN IF NOT EXISTS exam_retake_used boolean DEFAULT false;

-- Rank thresholds
CREATE TABLE IF NOT EXISTS rank_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faction text NOT NULL,
  rank integer NOT NULL,
  rank_title text NOT NULL,
  ap_required integer NOT NULL,
  UNIQUE(faction, rank)
);

INSERT INTO rank_thresholds (faction, rank, rank_title, ap_required) VALUES
('agency',1,'Unaffiliated Detective',0),
('agency',2,'Field Operative',100),
('agency',3,'Senior Operative',500),
('agency',4,'Lead Detective',1500),
('agency',5,'Special Investigator',4000),
('agency',6,'Executive Agent',10000),
('mafia',1,'Foot Soldier',0),
('mafia',2,'Operative',100),
('mafia',3,'Lieutenant',500),
('mafia',4,'Captain',1500),
('mafia',5,'Executive',4000),
('mafia',6,'Black Hand',10000),
('guild',1,'Associate',0),
('guild',2,'Contractor',100),
('guild',3,'Acquisitions Agent',500),
('guild',4,'Senior Partner',1500),
('guild',5,'Director',4000),
('guild',6,'Founding Member',10000),
('dogs',1,'Recruit',0),
('dogs',2,'Enlisted',100),
('dogs',3,'Sergeant',500),
('dogs',4,'Lieutenant',1500),
('dogs',5,'Commander',4000),
('dogs',6,'First Hound',10000),
('special',1,'Flagged',0),
('special',2,'Monitored',100),
('special',3,'Cleared',500),
('special',4,'Operative',1500),
('special',5,'Handler',4000),
('special',6,'Controller',10000)
ON CONFLICT DO NOTHING;

ALTER TABLE rank_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_thresholds_public" ON rank_thresholds FOR SELECT USING (true);

-- Character profiles table
CREATE TABLE IF NOT EXISTS character_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  faction text NOT NULL,
  ability_name text,
  ability_name_jp text,
  ability_type text,
  trait_power integer NOT NULL,
  trait_intel integer NOT NULL,
  trait_loyalty integer NOT NULL,
  trait_control integer NOT NULL
);

INSERT INTO character_profiles
(slug,name,faction,ability_name,ability_name_jp,ability_type,trait_power,trait_intel,trait_loyalty,trait_control)
VALUES
('atsushi-nakajima','Atsushi Nakajima','agency','Beast Beneath the Moonlight','月下獣','destruction',3,2,4,2),
('osamu-dazai','Osamu Dazai','agency','No Longer Human','人間失格','counter',2,5,2,3),
('doppo-kunikida','Doppo Kunikida','agency','Lone Poet','独歩吟客','analysis',3,4,4,5),
('ranpo-edogawa','Ranpo Edogawa','agency','Super Deduction','超推理','analysis',1,5,3,4),
('akiko-yosano','Akiko Yosano','agency','Thou Shalt Not Die','君死給勿','counter',4,3,4,4),
('junichirou-tanizaki','Junichirou Tanizaki','agency','Light Snow','細雪','manipulation',2,3,4,3),
('kyouka-izumi','Kyouka Izumi','agency','Demon Snow','夜叉白雪','destruction',4,2,4,3),
('kenji-miyazawa','Kenji Miyazawa','agency','Undefeated by the Rain','雨ニモマケズ','destruction',5,1,5,2),
('edgar-allan-poe','Edgar Allan Poe','agency','Black Cat in the Rue Morgue','モルグ街の黒猫','manipulation',1,5,2,4),
('chuuya-nakahara','Chuuya Nakahara','mafia','Upon the Tainted Sorrow','汚れっちまった悲しみに','destruction',5,3,5,2),
('ryunosuke-akutagawa','Ryunosuke Akutagawa','mafia','Rashomon','羅生門','destruction',5,3,4,3),
('kouyou-ozaki','Kouyou Ozaki','mafia','Golden Demon','金色夜叉','manipulation',3,4,4,4),
('gin-akutagawa','Gin Akutagawa','mafia','Hannya','般若','counter',3,3,5,5),
('ichiyou-higuchi','Ichiyou Higuchi','mafia','Ichiyou Higuchi Ability','樋口一葉の能力','counter',3,2,5,3),
('michizou-tachihara','Michizou Tachihara','mafia','Midwinter Memento','冬の記憶','destruction',4,3,3,3),
('lucy-montgomery','Lucy Montgomery','guild','Anne of Abyssal Red','深紅のアン','manipulation',2,3,3,4),
('john-steinbeck','John Steinbeck','guild','The Grapes of Wrath','怒りの葡萄','destruction',4,2,4,3),
('herman-melville','Herman Melville','guild','Moby Dick','白鯨','destruction',5,2,3,2),
('mark-twain','Mark Twain','guild','Huck Finn and Tom Sawyer','ハックルベリー・フィンとトム・ソーヤー','manipulation',3,3,3,3),
('louisa-alcott','Louisa Alcott','guild','Little Women','若草物語','analysis',2,4,4,5),
('teruko-okura','Teruko Okura','dogs','Gasp of the Soul','魂の喘ぎ','analysis',3,4,4,5),
('tetchou-suehiro','Tetchou Suehiro','dogs','Plum Blossoms in Snow','雪中梅','destruction',5,2,5,4),
('saigiku-jouno','Saigiku Jouno','dogs','Puppeteer of the Rainbow','彩虹の糸','analysis',3,5,3,4),
('michizou-tachihara-dogs','Michizou Tachihara','dogs','Midwinter Memento','冬の記憶','destruction',4,3,3,3)
ON CONFLICT DO NOTHING;

ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_profiles_public" ON character_profiles FOR SELECT USING (true);

-- Reserved characters
CREATE TABLE IF NOT EXISTS reserved_characters (
  slug text PRIMARY KEY,
  character_name text NOT NULL,
  faction text NOT NULL,
  reserved_reason text,
  assigned_to uuid REFERENCES profiles(id),
  assigned_at timestamptz
);

INSERT INTO reserved_characters (slug, character_name, faction, reserved_reason) VALUES
('ango-sakaguchi','Ango Sakaguchi','special','Owner character — never assignable'),
('ogai-mori','Ogai Mori','mafia','Faction boss — owner assigns manually'),
('yukichi-fukuzawa','Yukichi Fukuzawa','agency','Faction founder — owner assigns manually'),
('fyodor-dostoevsky','Fyodor Dostoevsky','rats','Hidden faction lead — owner only'),
('nikolai-gogol','Nikolai Gogol','decay','Hidden faction lead — owner only'),
('fukuchi-ouchi','Fukuchi Ouchi','dogs','Faction commander — owner assigns manually'),
('francis-fitzgerald','Francis Fitzgerald','guild','Faction boss — owner assigns manually')
ON CONFLICT DO NOTHING;

ALTER TABLE reserved_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reserved_owner_only" ON reserved_characters FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text DEFAULT 'ambient',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Observer pool
CREATE TABLE IF NOT EXISTS observer_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  scores jsonb,
  status text DEFAULT 'waiting',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE observer_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observer_own" ON observer_pool FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "observer_owner_all" ON observer_pool FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Character assignment trigger (fires after 10th user_event)
CREATE OR REPLACE FUNCTION check_character_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count integer;
  v_faction text;
  v_character text;
BEGIN
  SELECT COUNT(*), p.faction, p.character_name
  INTO v_count, v_faction, v_character
  FROM profiles p
  LEFT JOIN user_events ue ON ue.user_id = p.id
  WHERE p.id = NEW.user_id
  GROUP BY p.faction, p.character_name;

  IF v_count >= 10 AND v_character IS NULL 
    AND v_faction IS NOT NULL AND v_faction != 'special' THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/assign-character',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('user_id', NEW.user_id, 'faction', v_faction)
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_user_event_insert ON user_events;
CREATE TRIGGER on_user_event_insert
  AFTER INSERT ON user_events
  FOR EACH ROW EXECUTE FUNCTION check_character_assignment();

-- Exam retake eligibility (30 days after becoming member)
CREATE OR REPLACE FUNCTION set_retake_eligibility()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'member' AND OLD.role != 'member' THEN
    UPDATE profiles SET exam_retake_eligible_at = now() + interval '30 days'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_member_activated
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_retake_eligibility();
```

### STEP 3B — EDGE FUNCTION

Create `supabase/functions/assign-character/index.ts`:

```typescript
import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { user_id, faction } = await req.json()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const geminiKey = Deno.env.get('GEMINI_API_KEY')!
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }

  if (faction === 'special') {
    return new Response(JSON.stringify({ error: 'Special Division assigned by owner only' }))
  }

  const [profile] = await (await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}&select=*`, { headers }
  )).json()

  if (!profile || profile.character_name) {
    return new Response(JSON.stringify({ error: 'Already assigned' }))
  }

  const reserved = await (await fetch(
    `${supabaseUrl}/rest/v1/reserved_characters?select=slug`, { headers }
  )).json()
  const reservedSlugs = reserved.map((r: any) => r.slug)

  const allChars = await (await fetch(
    `${supabaseUrl}/rest/v1/character_profiles?faction=eq.${faction}&select=*`, { headers }
  )).json()
  const characters = allChars.filter((c: any) => !reservedSlugs.includes(c.slug))

  const events = await (await fetch(
    `${supabaseUrl}/rest/v1/user_events?user_id=eq.${user_id}&select=event_type&limit=20`, { headers }
  )).json()

  const scores = profile.behavior_scores || {}
  const characterList = characters.map((c: any) =>
    `- ${c.name} [${c.slug}]: Power:${c.trait_power} Intel:${c.trait_intel} Loyalty:${c.trait_loyalty} Control:${c.trait_control} Type:${c.ability_type}`
  ).join('\n')

  const prompt = `
You are the ability registry for Yokohama in Bungo Stray Dogs.
Assign the best matching character for this ${faction} faction member.

BEHAVIOR SCORES: Power:${scores.power||0} Intel:${scores.intel||0} Loyalty:${scores.loyalty||0} Control:${scores.control||0}
ARENA VOTES: ${JSON.stringify(scores.arena_votes||{})}
DUEL STYLE: ${JSON.stringify(scores.duel_style||{})}
LORE TOPICS: ${JSON.stringify(scores.lore_topics||{})}
RECENT ACTIVITY: ${events.map((e:any)=>e.event_type).join(', ')}

ASSIGNABLE CHARACTERS:
${characterList}

Return ONLY this JSON:
{
  "character_slug": "slug",
  "character_name": "Name",
  "ability_type": "destruction|counter|manipulation|analysis",
  "confidence": 0.0,
  "reasoning": "one sentence",
  "registry_note": "Two sentences. First confirms designation formally. Second notes one behavioral trait."
}`

  let result
  try {
    const gData = await (await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    )).json()
    result = JSON.parse(gData.candidates[0].content.parts[0].text.replace(/```json|```/g,'').trim())
  } catch {
    // Distance calculation fallback
    const u = { power: scores.power||0, intel: scores.intel||0, loyalty: scores.loyalty||0, control: scores.control||0 }
    let closest = characters[0], lowest = Infinity
    for (const c of characters) {
      const d = Math.abs(u.power-c.trait_power)+Math.abs(u.intel-c.trait_intel)+Math.abs(u.loyalty-c.trait_loyalty)+Math.abs(u.control-c.trait_control)
      if (d < lowest) { lowest = d; closest = c }
    }
    result = {
      character_slug: closest.slug, character_name: closest.name,
      ability_type: closest.ability_type, confidence: 0.5,
      reasoning: 'Assigned by trait distance fallback',
      registry_note: `Ability signature confirms designation as ${closest.name}. Behavioral patterns have been recorded by the city registry.`
    }
  }

  const assigned = characters.find((c:any) => c.slug === result.character_slug) || characters[0]

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({
      character_name: result.character_name,
      character_match_id: result.character_slug,
      character_ability: assigned.ability_name,
      character_ability_jp: assigned.ability_name_jp,
      character_type: result.ability_type,
      character_description: result.registry_note,
      character_assigned_at: new Date().toISOString()
    })
  })

  await fetch(`${supabaseUrl}/rest/v1/faction_activity`, {
    method: 'POST', headers,
    body: JSON.stringify({
      faction, event_type: 'character_assigned',
      description: `Ability signature confirmed — ${result.character_name}`,
      actor_id: user_id
    })
  })

  await fetch(`${supabaseUrl}/rest/v1/notifications`, {
    method: 'POST', headers,
    body: JSON.stringify({
      user_id,
      message: 'The city has updated your registry file.',
      type: 'character_assigned'
    })
  })

  return new Response(JSON.stringify({ success: true, result }))
})
```

Deploy:
```bash
supabase functions deploy assign-character
supabase secrets set GEMINI_API_KEY=your_key_here
```

### STEP 3C — UTILITIES

**`lib/rank.ts`** — getRankInfo function
**`lib/ability-types.ts`** — type labels, colors, descriptions
**`lib/ability-signature.ts`** — deterministic SVG waveform generator (seed from username + characterSlug)
**`lib/behavior.ts`** — calculateBehaviorDelta for scoring actions

### STEP 3D — COMPONENTS TO CREATE

```
components/ui/RankUpFlash.tsx
  - Full screen faction color flood
  - Faction kanji springs in
  - Rank title fades in
  - "RANK ACHIEVED" appears
  - Auto-dismisses after 2.8s
  - Plays stamp sound
  - Triggered by Realtime rank change only
  - NEVER on initial page load

components/ui/FloatingAP.tsx
  - Floating +N AP number
  - Appears at action element position
  - Animates up and fades out 1.2s
  - triggerFloatingAP(element, amount) exported
  - FloatingAPLayer added to layout.tsx

components/ui/CharacterReveal.tsx
  - Full screen dark overlay
  - "THE CITY HAS COMPLETED ITS ANALYSIS"
  - Character name types letter by letter (GSAP)
  - Ability name fades in
  - Ability type badge appears
  - Registry note fades in
  - 6-8 seconds total
  - localStorage bsd_char_reveal_shown
  - Never shows again after first time

components/ui/NotificationBell.tsx
  - ○/◉ toggle in nav
  - Supabase Realtime subscription
  - Dropdown of recent notifications
  - "CITY TRANSMISSIONS" header
  - Cormorant italic for messages
  - Auto marks read on open

components/ui/ObservationMeter.tsx
  - Shows ONLY if character not yet assigned
  - AND role = member
  - 5 stages based on event count:
    0-2: "Presence noted"
    3-5: "Patterns emerging"
    6-7: "Signature forming"
    8:   "Behavioral analysis in progress"
    9:   "Assignment imminent" + pulsing red dot
  - No numbers shown ever
  - Hides completely once character assigned

components/ui/DailyLoginRitual.tsx
  - Fires ONCE per day via localStorage
  - Japanese date format (令和)
  - "YOKOHAMA ACKNOWLEDGES YOUR RETURN"
  - Streak count + "+5 AP"
  - Awards AP via Supabase
  - Auto-dismisses after 2.5s
  - Added to layout.tsx
```

### STEP 3E — FACTION PHILOSOPHIES

Add to `onboarding/result/page.tsx` — fades in at 2.5s in GSAP timeline:

**Agency:** "The city does not distinguish between the guilty and the desperate. We do. The Armed Detective Agency exists in the space between law and mercy — cases too dangerous for the police, too human for the military. We carry the weight of Yokohama's twilight."

**Mafia:** "Order is maintained by those willing to be its shadow. The Port Mafia does not pretend to be righteous. We are the reason Yokohama sleeps at night — not because the darkness is gone, but because we control it. You serve the city by serving us."

**Guild:** "Power without resources is theater. The Guild understands what others refuse to admit — that ability without capital is merely talent, and talent is abundant. We do not fight for Yokohama. We invest in it. Your presence here is either an asset or a liability."

**Hunting Dogs:** "The law is not a suggestion. The Hunting Dogs are the government's answer to those who believe otherwise. We are not merciful. We are not cruel. We are precise. Yokohama's ability users exist within a framework they did not create and cannot escape."

**Special Division:** "You were not supposed to be here. The quiz had no answer for you — which means the city sees something the factions cannot. The Special Division does not recruit. It observes. You have been observed. What happens next is not up to you."

### STEP 3F — PROFILE PAGE

`app/profile/[username]/page.tsx` — Client Component

Sections in order:
1. Identity plate (kanji + character name/??? + faction + username + rank + bio)
2. Ability signature SVG (character assigned only)
3. Observation meter (character NOT assigned + member only)
4. AP progress bar (own profile only)
5. Ability type badge (character assigned only)
6. Field record log (last 50 events)
7. Waitlist/Observer banners (conditional)
8. Exam retake section (bottom, own profile, conditions met only)

Realtime: subscribe to profiles table filtered by user id. On character_name change from null → trigger CharacterReveal (once via localStorage). On rank increase → trigger RankUpFlash.

Special Division ??? text: "Assignment pending. Ango-san will determine your designation."

Exam retake conditions (ALL must be true):
- exam_retake_used = false
- exam_retake_eligible_at is in the past
- ap_total >= 500
- Cost: 500 AP deducted
- Redirect to /onboarding/exam?retake=true
- Quiz API averages new scores with original scores

### STEP 3G — OWNER PANEL ADDITIONS

`app/owner/assign-character/page.tsx`
- Username search (live query)
- Reserved characters dropdown (unassigned only)
- On assign: update profiles + reserved_characters + notify user

`app/owner/page.tsx` additions:
- Reserved characters status panel
- Observer pool list
- "Grant Special Division Access" action

### STEP 3H — NAV FINAL STATE

```
Left:  Logo/site name
Center: Archive (always visible)
Right: [faction kanji] [@username] [🔔 bell] [○ SOUND] [夜明け 06:42]
       (logged in only)
```

Time theme indicator updates every minute. Shows current theme kanji + time.

### STEP 3 CRITICAL RULES

```
- CharacterReveal fires ONCE — localStorage gate
- DailyLoginRitual fires ONCE per day — localStorage gate  
- RankUpFlash NEVER on initial load — only live Realtime updates
- ObservationMeter hides completely once character assigned
- Reserved characters filtered BEFORE Gemini AND distance fallback
- Special Division: no auto assignment, different ??? text
- FloatingAPLayer in layout so it works from every page
- Exam retake passes original scores server-side only — never URL params
- All Realtime subscriptions cleaned up on unmount
- AP bar hidden on public profiles — rank title only
- Bio max 100 characters enforced client AND server
```

---

## PROMPT 4 — THE ARCHIVE

*Feed after Prompt 3 is complete and tested.*

Self-contained. Do not touch other pages.

### STEP 4A — DATABASE

```sql
CREATE TABLE IF NOT EXISTS archive_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  character_name text NOT NULL,
  character_name_jp text,
  faction text NOT NULL,
  ability_name text NOT NULL,
  ability_name_jp text,
  ability_type text,
  ability_description text,
  trait_power integer,
  trait_intel integer,
  trait_loyalty integer,
  trait_control integer,
  real_author_name text,
  real_author_dates text,
  real_author_bio text,
  literary_movement text,
  notable_works text,
  ability_literary_connection text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE archive_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archive_public_read" ON archive_entries 
  FOR SELECT USING (true);
CREATE POLICY "archive_owner_write" ON archive_entries 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','mod'))
  );
```

Then seed all characters. Each entry needs:
- Basic character info
- Ability description (2-3 sentences)
- Real author bio (2-3 sentences)
- Literary movement
- Notable works (comma separated)
- How the ability connects to their real writing

### STEP 4B — ARCHIVE PAGE

`app/archive/page.tsx` — fully public, no login required

Layout:
```
Left sidebar (240px fixed):
  ARCHIVE header in Space Mono
  Categories:
  ■ All Entries
  ■ Armed Detective Agency  [count]
  ■ Port Mafia              [count]
  ■ The Guild               [count]
  ■ Hunting Dogs            [count]
  ■ Special Division        [count]
  ■ Unaffiliated            [count]
  
  Filter by ability type:
  ○ All
  ○ Destruction
  ○ Counter
  ○ Manipulation
  ○ Analysis

Main content:
  Search bar (client-side filter)
  Grid of character cards
  Click → opens full case file view
```

Character card:
```
[Faction color left border]
[Character name — Cinzel]
[Faction name — Space Mono muted]
[Ability name — Cormorant italic faction color]
[Ability type badge]
[One line teaser from ability description]
```

Full case file view (`app/archive/[slug]/page.tsx`):

```
CASE FILE: [case number]           [faction kanji]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGNATION
[Character name — large Cinzel]
[JP name — Cormorant italic]

FACTION          ABILITY TYPE       STATUS
[faction name]   [type badge]       ACTIVE

REGISTERED ABILITY
[Ability name]  [JP name]
[Full ability description]

TRAIT ASSESSMENT
Power    ████░░  [n]/5
Intel    ████████ [n]/5
Loyalty  ██████░░ [n]/5
Control  ███░░░░░ [n]/5

LITERARY ORIGIN
Real author: [name] ([dates])
Movement: [literary movement]
Notable works: [works]
[2-3 sentence connection between 
 real writing and their ability]

REGISTRY NOTE
[One atmospheric line about this character
 written as an official city assessment]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Filed by: Special Division Registry
```

Hidden visit tracking (localStorage only):
```javascript
const key = `bsd_archive_visits_${slug}`
const count = parseInt(localStorage.getItem(key) || '0') + 1
localStorage.setItem(key, count.toString())

// If count >= 3 — show hidden line after 2s delay:
// "You have accessed this file [N] times.
//  The registry notes your interest."
// Cormorant italic, very muted, fade in slowly
```

### STEP 4C — ARCHIVE CRITICAL RULES

```
- Fully public — no login required for any archive page
- Static feel — no animations except hover states and hidden message
- All 24+ characters seeded before this prompt is considered done
- Search filters client-side only — no DB query on each keystroke
- Case file format must feel like a physical document
- Literary origin section is the most important part — 
  this is what makes BSD real as literature
- Mobile: sidebar becomes top tabs/dropdown
- Trait bars use CSS only — no chart library
```

---

## PROMPT 5 — THE REGISTRY

*Feed after Prompt 4 is complete and tested.*

The Registry is user-generated lore. Members write incident reports filling canon gaps. Mods approve. Gemini assists.

### STEP 5A — DATABASE

```sql
CREATE TABLE IF NOT EXISTS registry_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE,
  author_id uuid REFERENCES profiles(id),
  author_character text,
  author_faction text,
  author_rank text,
  title text NOT NULL,
  content text NOT NULL,
  district text,
  status text DEFAULT 'pending',
  featured boolean DEFAULT false,
  gemini_review jsonb,
  mod_note text,
  reviewed_by uuid REFERENCES profiles(id),
  word_count integer,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS registry_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  post_id uuid REFERENCES registry_posts(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Auto case number generator
CREATE SEQUENCE IF NOT EXISTS registry_seq;

CREATE OR REPLACE FUNCTION generate_case_number(
  faction text
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  initial text;
  seq integer;
BEGIN
  initial := CASE faction
    WHEN 'agency' THEN 'A'
    WHEN 'mafia' THEN 'M'
    WHEN 'guild' THEN 'G'
    WHEN 'dogs' THEN 'D'
    WHEN 'special' THEN 'S'
    ELSE 'X'
  END;
  seq := nextval('registry_seq');
  RETURN 'YKH-' || initial || '-' || 
         EXTRACT(YEAR FROM now())::text || '-' || 
         LPAD(seq::text, 4, '0');
END; $$;

ALTER TABLE registry_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registry_public_read" ON registry_posts
  FOR SELECT USING (status = 'approved');
CREATE POLICY "registry_own_read" ON registry_posts
  FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "registry_member_insert" ON registry_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('member','mod','owner')
      AND rank >= 2
    )
  );
CREATE POLICY "registry_mod_update" ON registry_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('mod','owner')
    )
  );

ALTER TABLE registry_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_own" ON registry_saves 
  FOR ALL USING (auth.uid() = user_id);
```

### STEP 5B — GEMINI EDGE FUNCTION: review-post

Create `supabase/functions/review-post/index.ts`:

Gemini receives: post title, content, author faction, word count.
Gemini returns JSON:
```json
{
  "canon_consistent": true,
  "canon_notes": "one sentence if issues found",
  "character_accurate": true,
  "character_notes": "one sentence if issues",
  "quality_score": 0.0,
  "recommendation": "approve|review|reject",
  "recommendation_reason": "one sentence"
}
```

This runs automatically on submission. Result saved to `registry_posts.gemini_review`. Mod sees it but makes the final call.

### STEP 5C — SUBMISSION FORM

`app/registry/submit/page.tsx` — members rank 2+ only

```
INCIDENT REPORT — NEW SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: [input]
District: [dropdown — Kannai/Chinatown/Harbor/
           Motomachi/Honmoku/Waterfront/Other]
Content: [textarea — min 200 words]
Word count: [live counter]

[SUBMIT REPORT]

Note below textarea in Cormorant italic muted:
"All submissions are reviewed by the city registry.
 The city does not publish inaccurate records."
```

On submit:
1. Validate min 200 words
2. Insert to registry_posts with status = 'pending'
3. Generate case number via generate_case_number()
4. Call review-post Edge Function
5. Save gemini_review result to post
6. Show confirmation: "Your report has been filed. Case [number]. Awaiting registry review."

### STEP 5D — PUBLIC REGISTRY FEED

`app/registry/page.tsx` — public, shows approved posts only

Layout:
```
Header: THE REGISTRY — YOKOHAMA INCIDENT REPORTS
Filters: All | Agency | Mafia | Guild | Dogs | Special
         All Districts | [district list]
         Sort: Recent | Most Saved | Featured

Post card:
[FEATURED stamp if featured]
[case number — Space Mono faction color]
[title — Cinzel]
[author character name] — [rank] — [faction]
[first 100 chars of content...]
[word count] words  [save count] saves  [district]
[timestamp]

Click → full case file view
```

Full post view (`app/registry/[caseNumber]/page.tsx`):
- Same case file format as Archive
- Save button (logs +10 AP to author)
- FEATURED stamp if featured (featured by mod)
- Author identity plate at bottom

### STEP 5E — MOD QUEUE

In faction space left column — below bulletin section for mods:

```
PENDING REPORTS  [count badge]
━━━━━━━━━━━━━━━━
[case number] [title]
[author] — [word count] words
Gemini: [recommendation badge — green/yellow/red]
[Gemini one-line reason]
[APPROVE] [REQUEST EDIT] [REJECT]
```

On approve:
- Set status = 'approved', approved_at = now()
- Insert user_events for author: event_type = 'lore_post', ap_awarded = 50
- Send notification to author: "Your incident report [case number] has been accepted into the Registry. The city remembers."
- Insert faction_activity: '[character] filed an incident report'

On reject:
- Set status = 'rejected'
- Mod must write a reason (required field)
- Send notification to author with reason

### STEP 5F — REGISTRY CRITICAL RULES

```
- Submission only for rank 2+ members (enforced DB + client)
- Minimum 200 words enforced both sides
- Gemini review runs automatically on submit — 
  never blocks submission, just informs mod
- Mod makes ALL final calls — Gemini is advisory only
- Save button awards AP to the author not the saver
- Case numbers never reused even if post deleted
- Featured stamp is mod action only — 
  grants +100 AP bonus to author (once per post)
- Public feed shows only approved posts
- Author can see their own pending/rejected posts
- No editing after submission — 
  only approve/reject/request edit cycle
- District tags feed into future Yokohama Map feature
```

---

## OPTIMISATION PROMPT

*Run this as a separate prompt BEFORE hosting. After all 5 prompts are complete.*

```
Run a complete performance optimisation pass.
Do all of the following:

1. Dynamic imports for heavy components:
   CharacterReveal, RankUpFlash, KanjiReveal
   All with ssr: false

2. React.memo on RainLayer
   Move DROPS array outside component function

3. will-change: transform on .rain-drop

4. All Supabase queries use specific .select() columns
   Never .select('*') except where all columns needed
   All list queries have .limit()

5. Add these indexes to Supabase:
   CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
   CREATE INDEX IF NOT EXISTS idx_faction_messages_faction_id ON faction_messages(faction_id, created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_faction_activity_faction_id ON faction_activity(faction_id, created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at ON notifications(user_id, read_at, created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
   CREATE INDEX IF NOT EXISTS idx_profiles_faction_ap_total ON profiles(faction, ap_total DESC);
   CREATE INDEX IF NOT EXISTS idx_registry_posts_status_created_at ON registry_posts(status, created_at DESC);

6. Audit every Framer Motion animation —
   Only animate: opacity, transform, scale, x, y
   Never animate: width, height, padding, margin
   Fix any violations

7. Error boundaries wrapping:
   faction space, profile page, quiz, registry
   On error show: "The registry is temporarily unavailable. The city is aware."
   Cormorant italic. No stack traces to users.

8. Every data-fetching page has a loading state:
   "ACCESSING REGISTRY..." in Space Mono centered

9. All Realtime subscriptions confirmed to have
   cleanup: return () => { supabase.removeChannel(channel) }
   Find and fix every missing cleanup

10. Add metadata to layout.tsx:
    title: 'BungouArchive — 文豪アーカイブ'
    description: 'A curated record of Yokohama's ability users. The city determines where you belong.'

11. Rate limiting on API routes:
    /api/quiz/submit — max 3 per hour per IP
    /api/character/assign — max 1 per user ever
    /api/behavior/update — max 60 per hour per user

12. next/font confirmed for all three fonts —
    no <link> tags for fonts anywhere

Report every change made.
```

---

## HOSTING CHECKLIST

Do not host until every box is checked:

```
PHASE 1 (Prompt 1-2) COMPLETE
□ Auth works end to end
□ Quiz assigns correct factions
□ Faction space: bulletin/feed/roster/chat working
□ RLS confirmed — cross-faction reads blocked
□ Realtime confirmed — chat updates without refresh
□ Time-based theme shifts correctly
□ Rain on landing page only
□ Sound toggle works

PHASE 2 (Prompt 3) COMPLETE
□ Profile identity plate correct
□ ObservationMeter shows/hides correctly
□ CharacterReveal plays once correctly
□ AP bar animates
□ RankUpFlash triggers on rank up only
□ DailyLoginRitual fires once per day
□ NotificationBell receives and shows notifications
□ FloatingAP appears on AP award
□ Faction philosophies on result screen

CONTENT COMPLETE
□ Archive has all characters seeded
□ Landing page narrative written
□ Chronicle Entry #001 written by you as Ango
□ Quiz questions working correctly (all 7)

OWNER SETUP COMPLETE
□ Deployed to Vercel
□ /setup/owner page works
□ Your owner account created and verified
□ Ango account created and set up via SQL
□ Inner circle recruited (4 people)
□ Reserved characters assigned to inner circle
□ faction_slots seeded (5 factions × 20 slots)
□ /owner panel accessible and working

TECHNICAL
□ npx tsc --noEmit passes
□ npm run build passes
□ Optimisation prompt complete
□ Supabase redirect URLs include Vercel URL
□ Confirm email turned ON
□ All environment variables set on Vercel
□ Tested on mobile — no horizontal scroll
□ Tested on slow connection
□ Edge Functions deployed and tested
```

---

## OWNER + ANGO ACCOUNT SETUP

### After Deploying to Vercel

**Step 1 — Create owner account**
- Open Chrome. Go to live site.
- Sign up with personal Gmail.
- Take quiz. Complete onboarding normally.
- Go to `yourdomain.vercel.app/setup/owner`
- Click the button. Page now returns 404 forever.
- Verify in Supabase: `SELECT role FROM profiles WHERE username = 'your-username'` → should be 'owner'

**Step 2 — Create Ango account**
- Open Firefox. Go to live site.
- Sign up with second Gmail.
- Username: `ango_sakaguchi`
- Complete quiz normally (it doesn't matter what faction you get)

**Step 3 — Set Ango up via SQL**

In Supabase SQL editor run:
```sql
UPDATE profiles
SET 
  role = 'mod',
  faction = 'special',
  character_name = 'Ango Sakaguchi',
  character_match_id = 'ango-sakaguchi',
  character_ability = 'Discourse on Decadence',
  character_ability_jp = '堕落論',
  character_type = 'analysis',
  character_description = 'The city registry identifies this signature as Sakaguchi Ango. All records pass through him. Nothing escapes his observation.',
  character_assigned_at = now(),
  exam_completed = true,
  exam_status = 'special_assigned'
WHERE username = 'ango_sakaguchi';
```

**Step 4 — Verify Ango**
- In Firefox, go to `/faction/special`. Loads? ✓
- Go to `/profile/ango_sakaguchi`. Shows Ango Sakaguchi with Discourse on Decadence? ✓

**Step 5 — Inner circle setup**
- For each trusted person:
  - They sign up normally, take quiz
  - From owner panel: assign their reserved character
  - SQL to set role = 'mod' for faction bosses

**Step 6 — Seed faction slots**
```sql
INSERT INTO faction_slots (faction, max_slots, active_count) VALUES
('agency', 20, 1),
('mafia', 20, 1),
('guild', 20, 1),
('dogs', 20, 1),
('special', 20, 1)
ON CONFLICT DO NOTHING;
-- Adjust active_count based on how many 
-- inner circle members are in each faction
```

---

## BROWSER SETUP

```
CHROME  → Ango account (always)
FIREFOX → Owner account (always)

Firefox bookmarks:
  /owner
  /owner/assign-character
  supabase.com/dashboard
  vercel.com/dashboard

Chrome bookmarks:
  /faction/special
  /profile/ango_sakaguchi
  /registry (mod queue)
  /chronicle
```

---

## MANAGING THE CITY AS ANGO

### The Golden Rules

```
1. NEVER break character publicly
   Technical issues get fixed silently from owner account.
   Ango does not announce maintenance.
   Ango does not apologize for downtime.
   The city simply resumes.

2. NEVER reveal the owner account exists
   Not to mods. Not to inner circle. Nobody.
   If asked who runs the site:
   "Ango manages the city registry."
   Nothing more.

3. NEVER post casually as Ango
   No "hey everyone", no "lol", no casual reactions.
   Every Ango post should feel like an event.
   Post 3-4 times per week maximum.
   Less is more.

4. ALWAYS respond as the character
   If someone challenges a decision:
   "The city's assessment stands."
   That is all.

5. KEEP BROWSERS SEPARATE
   Muscle memory will protect you.
   Chrome = Ango. Firefox = Owner. Always.
```

### Weekly Rhythm

**Monday (45 mins total):**
```
Owner account (Firefox):
□ Review Gemini Chronicle draft
□ Check observer pool — anyone ready for SD?
□ Check faction AP standings
□ Note Book chapter winner

Ango account (Chrome):
□ Edit and approve Chronicle in Ango's voice
□ Post new Book chapter on landing page (one paragraph, case file format)
□ Post one SD bulletin (formal, cold, atmospheric)
□ Check Registry mod queue — approve/reject pending posts
```

**Tuesday-Friday (15 mins/day):**
```
Chrome (Ango):
□ Check Transmission logs
□ Check notifications
□ Respond to any mod escalations
□ One atmospheric post if something worth saying

Firefox (Owner):
□ Check Vercel dashboard — any build failures?
□ Check Supabase — Edge Function errors?
□ Any technical issues to fix?
```

**Weekend (20 mins):**
```
Chrome (Ango):
□ Read best Registry posts from the week
□ Send "Ango-san has read your report." to the best author
□ Check observer pool for Special Division candidates

Firefox (Owner):
□ Hidden faction candidate notes
□ Easter egg planning
□ Any technical debt
```

### Monthly Tasks (1 hour)

```
□ Review inner circle activity — 
  anyone inactive 30+ days?
  Reach out privately before reclaiming character.

□ Hidden faction candidates:
  Rats → dark philosophical lore + Fyodor easter eggs
  Decay → chaotic participation, unpredictable patterns
  Clock Tower → most loyal, rank 5-6, months of activity

□ Set one new easter egg
  A hidden interaction anywhere on the site
  Never announce it. Let it be found.

□ One canon event — something happens in Yokohama
  Write it yourself. Not generated.
  "A character was seen near the waterfront."
  "An unregistered ability signature was detected."
  Post as Ango in the Chronicle.
  Make the world feel like it has history.

□ Check if faction leaders changed
  AP recalculates Monday automatically.
  New leader in a faction = a moment worth noting.
  One line from Ango in that faction's bulletin.
```

### How Ango Speaks

**Always:**
- Formal. Cold. Precise.
- Present tense. Short sentences.
- References "the city" not "the website"
- References "records" and "registry" not "posts"
- References "ability users" not "members"

**Example posts:**

Approving a Registry post:
> "Filed. The registry notes the accuracy of this account. YKH-A-2025-0041 is now a matter of public record."

Rejecting a Registry post:
> "Returned. Canon inconsistency — line 4. The registry does not accept inaccurate records."

Noticing a user:
> "Ango-san has read your report."
*(Just this. Nothing else. They will understand.)*

Posting a Chapter:
> "Chapter 14 — The Motomachi Incident
> An ability signature was detected near the commercial district at 0300. Origin unknown. The affected area remains under observation. Three factions have registered interest.
> The city is watching who moves first."

Speaking in Transmission Log:
> "The registry is aware of recent activity. Continue."

Or simply:
> "The city remembers."

---

## THE WORLD'S FUTURE — WHERE THIS GOES

### 6 Months After Launch

```
Phase 6 — The Yokohama Map
  SVG map of BSD districts
  Color fills as Registry posts tag districts
  Faction influence visible in real time
  Click district → see relevant posts

Phase 7 — The Book (weekly faction competition)
  One chapter per week on landing page
  Faction earning most AP that week holds The Book
  Book holder faction gets +10% AP bonus
  Creates organic weekly competition

Phase 8 — Arena
  Character voting system
  Weekly matchups
  Community debates (upvotable)
  AP rewards for participation

Phase 9 — Duels
  Character card system
  Async turn-based
  Gemini writes aftermath summaries
  Stored in Field Records
```

### When to Reveal Hidden Factions

```
Rats in the House of the Dead:
  Wait until you find someone who writes 
  genuinely dark philosophical lore.
  Who references Dostoevsky's real works.
  Who seems to understand the nihilist angle.
  Then: one cryptic notification.
  "You have been expected."
  Link to hidden faction page.
  Fyodor awakens in Yokohama.

Decay of the Angel:
  Watch for chaotic participation.
  High activity then sudden disappearance.
  Returns unpredictably.
  Engages with everything obliquely.
  They're not playing the game — they're watching it.
  That's your Decay member.

Clock Tower:
  Longest active members only.
  Rank 5-6. Months of consistent presence.
  These are the people who built the community.
  Clock Tower is their reward.
  Personal invitation. No other way in.
```

### The Bar Lupin Secret

When three users hold these characters simultaneously:
- Osamu Dazai (Agency member)
- Ango Sakaguchi (you)
- Sakunosuke Oda (when you add him to Agency roster)

A hidden channel unlocks. Private. Just those three. Named Bar Lupin. This is canon — the three Buraiha writers met at Bar Lupin in real life.

Build this when someone earns Dazai. It's the deepest easter egg on the site.

---

## LAUNCH ANNOUNCEMENT

Post this on BSD subreddits, Discord servers, Twitter/X:

```
"The Yokohama ability registry has reopened.

New signatures are being accepted.
Factions are not chosen.
The city determines where you belong.

100 slots. First come first assigned.

[your URL here]

横浜は、いつも雨が降っている。"
```

- No explanation of features
- No screenshots
- Post at night — Mafia hours — on purpose
- Let the mystery do the work

---

## QUICK REFERENCE — LOCKED DECISIONS

```
Username: 6-20 chars, alphanumeric + underscore only
Factions: Agency, Mafia, Guild, Hunting Dogs, Special Division
Quiz: 7 questions, server-side scoring, no back button
User cap: 100 (5 × 20 slots)
AP thresholds: 0/100/500/1500/4000/10000
Character assignment: 10 events → behavior scores → Gemini → fallback distance
Reserved: Mori, Fukuzawa, Fitzgerald, Fukuchi, Fyodor, Gogol, Ango
Special Division: no auto assignment, observer pool → owner invites
Faction locking: permanent, one transfer lifetime (30 days + 500 AP)
Hidden factions: Rats, Decay, Clock Tower — owner triggers only
Owner account: ghost, invisible, infrastructure only
Ango account: public face, character in the world, mod of Special Division
```

---

*BungouArchive — 文豪アーカイブ*
*横浜は、いつも雨が降っている。*
