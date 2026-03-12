文豪アーカイブ
CHARACTER ASSIGNMENT SYSTEM
The Role Exam · Behavioral Drift · Character Matching · Faction Transfer
How users get their character, how it changes over time, and how the result card works.


 
1. THE ACTUAL PROBLEMS TO SOLVE
Before designing solutions, the problems need to be stated precisely. There are four separate problems that look like one.

Problem	Why It's Hard	What Goes Wrong If We Get It Wrong
38 characters is too many to map from 5 questions	Simple majority-vote scoring gives you maybe 8 meaningful results, not 38	Users always get Dazai, Atsushi, or Chuuya. Everyone else is invisible.
5 questions can't measure all character dimensions	Characters differ on: moral axis, power style, emotional drive, social role, philosophy. 5 choices can't cover all axes simultaneously.	Two users answer completely differently but get the same character. Result feels random.
Character assignment should evolve, not be permanent	A one-time quiz freezes your identity at the moment you joined. People change. Behavior on the site reveals more than a quiz.	Old members feel stuck. New members feel their assignment was arbitrary.
Faction ≠ Character. Transfer is a separate system.	Someone might have the spirit of Chuuya (Port Mafia) but want to join the Agency. Faction and character match are different things with different rules.	If you tie character to faction permanently, faction transfers become identity-destroying.

  The core insight: the Role Exam should assign a FACTION first, then find the CLOSEST CHARACTER MATCH within the site's full roster. Character match is a lens, not a cage.
 
2. THE SYSTEM ARCHITECTURE
Three separate layers that work together. Each can be updated independently.

Layer	What It Does	When It Updates	Lives In
Role Exam (Trait Scoring)	12 questions, each scoring 8 dimension axes. Final scores determine faction + closest character match.	Once at signup. Can be retaken after 30 days.	Supabase: profiles.trait_scores (jsonb)
Behavioral Drift	Site activity shifts character match over time. Arena votes, lore topics, writing style, faction interactions.	Continuously — recalculated weekly	Supabase: profiles.behavior_scores (jsonb)
Final Character Score	Exam traits (60%) + Behavioral drift (40%) = composite score matched against all 38 characters.	Weekly recalc job	Supabase: profiles.character_match_id
Faction Assignment	Determined by exam. Stays with user. Changed only by Transfer Request (separate process).	Manually by user request	Supabase: profiles.faction
Transfer System	User requests faction transfer. Conditions must be met. Reviewed. Character match updates to best fit in new faction.	On approved transfer	Supabase: faction_transfers table
 
3. THE 8 TRAIT AXES
Every character in BSD can be mapped across 8 independent dimensions. The exam measures these. Behavior on the site drifts these. The final score is a vector in 8-dimensional space — the closest character vector wins.

Axis	What It Measures	Low Score (1)	High Score (10)	Key Characters
JUSTICE	Moral compass — rules vs outcome	Ends justify means. Power over principle.	Absolute moral code. Protect at all cost.	High: Kunikida, Tetchou, Fukuzawa. Low: Mori, Fyodor, Tachihara
POWER STYLE	How they apply their ability	Precise, controlled, surgical	Overwhelming, destructive, maximal	Controlled: Ranpo, Ango, Jouno. Maximal: Chuuya (Corruption), Melville, Goncharov
SOCIAL ROLE	Position in a group	Lone operative — works alone, trusts no one	Pillar — others depend on them, defines the group	Solo: Fyodor, Dazai (surface), Poe. Pillar: Fukuzawa, Fitzgerald, Kouyou
EMOTIONAL DRIVE	What motivates them at the core	Pure logic. Emotion is a liability.	Pure emotion. Logic is secondary.	Logic: Mori, Ranpo, Agatha. Emotion: Atsushi, Higuchi, Sigma
WORLD VIEW	How they see human nature	Humanity is corrupt. Strength or death.	Humanity is redeemable. Worth protecting.	Dark: Akutagawa, Fyodor, Teruko. Light: Kenji, Yosano, Atsushi
IDENTITY	Relationship with their own past	Defined by past. Cannot escape what made them.	Rewriting self constantly. Identity is chosen.	Defined: Chuuya, Akutagawa, Sigma. Fluid: Dazai, Ango, Gogol
METHOD	How they approach conflict	Patience, intelligence, information first	Direct. Physical. Immediate confrontation.	Patient: Fyodor, Mori, Agatha. Direct: Chuuya, Tetchou, Kenji
LOYALTY	Where their loyalty ultimately lies	To themselves and their own code alone	To a person, faction, or cause above self	Self: Dazai (true), Fyodor, Gogol. Other: Gin, Higuchi, Kunikida

  Every character in the roster has a score on each axis from 1-10. These are pre-set in the DB. The exam measures the user on the same axes. Distance calculation finds the closest match.
 
4. CHARACTER TRAIT VECTORS — ALL 38
These are the pre-set scores for every character. Store these in a characters_traits table or as a JSON column. These never change — they are canon. JUSTICE · POWER · SOCIAL · EMOTION · WORLD · IDENTITY · METHOD · LOYALTY

Format: [Justice, Power Style, Social Role, Emotional Drive, World View, Identity, Method, Loyalty]

Character	Faction	J	P	S	E	W	I	M	L
Nakajima Atsushi	agency	6	5	6	8	8	6	5	7
Osamu Dazai	agency	4	6	4	3	5	9	3	2
Doppo Kunikida	agency	9	6	7	5	8	8	5	8
Ranpo Edogawa	agency	7	2	5	2	7	6	2	5
Akiko Yosano	agency	8	7	7	6	8	7	6	8
Junichiro Tanizaki	agency	7	5	6	7	7	6	5	9
Naomi Tanizaki	agency	5	4	5	8	6	5	4	9
Kyouka Izumi	agency	7	7	5	7	7	7	6	8
Kenji Miyazawa	agency	9	8	6	9	9	4	7	7
Fukuzawa Yukichi	agency	9	7	9	4	8	7	3	9
Edgar Allan Poe	guild	6	4	2	6	5	5	2	4
Nakahara Chuuya	mafia	5	9	7	7	4	4	8	9
Akutagawa Ryūnosuke	mafia	3	9	4	8	2	3	8	7
Ōgai Mori	mafia	2	6	9	1	3	6	2	3
Ozaki Kōyō	mafia	5	7	8	4	4	6	5	7
Gin Akutagawa	mafia	4	8	3	3	3	4	8	10
Higuchi Ichiyō	mafia	6	3	4	9	6	5	4	10
Tachihara Michizou	mafia	6	6	4	6	5	4	5	6
F.S.K. Fitzgerald	guild	4	8	9	5	4	7	6	6
Lucy Montgomery	guild	5	5	3	8	6	5	4	6
John Steinbeck	guild	7	7	5	6	7	6	5	7
Herman Melville	guild	5	9	7	3	4	4	8	5
Mark Twain	guild	6	6	5	5	6	7	4	5
Louisa May Alcott	guild	7	5	7	7	7	6	4	8
Teruko Okura	dogs	2	9	6	2	2	3	9	4
Tetchou Suehiro	dogs	8	8	6	3	5	4	8	9
Jouno Saigiku	dogs	6	7	5	4	4	6	3	6
Fukuchi Ouchi	dogs	6	8	8	3	5	3	6	5
Ango Sakaguchi	special	5	4	4	3	5	7	2	3
Minoura Motoji	special	8	2	5	6	7	6	4	8
Fyodor Dostoevsky	rats	1	5	4	1	1	5	1	1
Alexander Pushkin	rats	2	6	3	2	2	5	2	3
Ivan Goncharov	rats	4	9	3	5	4	5	8	5
Nikolai Gogol	decay	3	7	3	6	3	9	6	2
Sigma	decay	6	4	3	8	6	8	4	6
Bram Stoker	decay	2	9	4	2	2	2	9	3
Agatha Christie	clock	6	5	8	2	5	6	1	5
Rudyard Kipling	clock	5	7	7	3	4	5	6	4
Oscar Wilde	clock	6	5	5	6	6	8	3	6
  J=Justice, P=Power Style, S=Social Role, E=Emotional Drive, W=World View, I=Identity, M=Method, L=Loyalty. Scale 1-10.
 
5. THE ROLE EXAM — 12 QUESTIONS
12 questions. Each has 4 options. Each option adds points to specific axes. No question mentions BSD characters or factions — the questions feel like a genuine psychological test about how you actually think and act.

After all 12 answers, each axis has a score from 0-40. Normalize to 1-10. Compare to the character vector table. Calculate Euclidean distance for each character. Lowest distance = your match.

  Why 12 not 5: 12 gives 2 dedicated measurements per axis with room for overlap. 5 questions cannot sample 8 axes meaningfully.


Question 1
"A person you have never met is about to be seriously hurt. Stopping it will cost you something meaningful — time, money, a relationship, or safety. Nobody would ever know if you looked away. What do you do?"

Option	Text	Axes Scored
A	I intervene without hesitation. The cost is irrelevant.	JUSTICE +3, WORLD +2, LOYALTY +1 (to principle)
B	I calculate whether the intervention is strategically worth it.	POWER -1, METHOD +2, EMOTION -2
C	I find a way to help that minimises my own cost first.	SOCIAL +1, IDENTITY +2, METHOD +1
D	I note the situation and move on. Not my problem to absorb.	JUSTICE -2, WORLD -2, SOCIAL -1


Question 2
"Your closest ally has just done something that violates what you believe in. Not illegal — but wrong by your standards. Nobody else noticed. You are the only one who knows."

Option	Text	Axes Scored
A	I confront them directly and immediately. Loyalty doesn't mean silence.	JUSTICE +2, LOYALTY +2 (to principle over person)
B	I say nothing now, but store the information. It may be useful later.	METHOD +2, IDENTITY +1, EMOTION -2
C	I understand why they did it. I protect them.	LOYALTY +3 (to person), EMOTION +2, JUSTICE -1
D	I distance myself quietly. I don't need people who do that.	SOCIAL -2, IDENTITY +2, WORLD -1


Question 3
"You discover you have a rare and powerful talent that most people don't. You can use it brilliantly — but only if you never explain how it works. If you explain it, it loses power. What do you do?"

Option	Text	Axes Scored
A	I keep it to myself completely. The mystery is part of the power.	POWER +2, METHOD +1, IDENTITY +2
B	I teach it selectively — to people who have earned access.	SOCIAL +2, LOYALTY +2, POWER +1
C	I find a way to use it openly. I don't want advantages nobody else can see.	JUSTICE +2, WORLD +2, IDENTITY -1
D	I document it privately and share it publicly later when the timing is right.	METHOD +2, SOCIAL +1, EMOTION -1


Question 4
"You are leading a group through a dangerous situation. One member is slowing you all down — not through fault of their own. Leaving them will save everyone else. What do you do?"

Option	Text	Axes Scored
A	We all make it or none of us do. There is no other option.	LOYALTY +3, WORLD +2, JUSTICE +1
B	I leave them and feel nothing. Sentiment is a liability in high stakes.	WORLD -3, EMOTION -2, METHOD +2
C	I send the group ahead and stay to carry them myself.	SOCIAL +1, LOYALTY +2, POWER +1
D	I buy them as much time as I can and give them a real chance. Then go.	JUSTICE +2, EMOTION +1, METHOD +1


Question 5
"If you could choose exactly one thing to be remembered for — what would it be? Not what you think you should say. What actually matters to you."

Option	Text	Axes Scored
A	That I was the best at what I did. Undeniably.	POWER +3, IDENTITY +2, WORLD -1
B	That I kept my word every single time.	LOYALTY +3, JUSTICE +2, EMOTION +1
C	That I made the right call when nobody else could.	METHOD +2, SOCIAL +2, POWER +1
D	That I changed something that needed to change.	WORLD +3, IDENTITY +2, JUSTICE +1


Question 6
"You have been wronged deeply. The person who did it is now in a position where they need your help. You are the only one who can give it."

Option	Text	Axes Scored
A	I help them. What happened between us has no bearing on what's right.	JUSTICE +3, WORLD +2, EMOTION -1
B	I help them, but they will owe me something after this.	METHOD +2, SOCIAL +1, LOYALTY -1
C	I refuse. Some things cannot be moved past.	IDENTITY +3, WORLD -2, LOYALTY +1 (to self)
D	I decide based on what helping them would cost the larger situation.	METHOD +3, EMOTION -2, JUSTICE +1


Question 7
"You are given access to information that most people never see — about how systems of power actually work. It's not illegal to have it. What do you do with it?"

Option	Text	Axes Scored
A	I use it to advance my position as quietly and effectively as possible.	METHOD +3, SOCIAL +2, IDENTITY +1
B	I make it public. People have a right to know how the world actually works.	JUSTICE +3, WORLD +2, LOYALTY -1
C	I hold it. Information held is information with infinite future value.	POWER +2, METHOD +2, IDENTITY +2
D	I give it to someone in a position to act on it properly.	SOCIAL +3, LOYALTY +2, JUSTICE +1


Question 8
"Someone tells you that the thing you've built your identity around is wrong. Not just disagreeing — presenting strong evidence. How do you respond?"

Option	Text	Axes Scored
A	I investigate the evidence seriously. If it's right, I change.	WORLD +2, IDENTITY +3, EMOTION -1
B	I defend my position. I have thought about this longer than they have.	IDENTITY -2, JUSTICE +1, WORLD -1
C	I become curious. I want to understand their entire framework.	EMOTION +2, METHOD +1, SOCIAL +1
D	I feel it but don't show it. I process alone and return with clarity.	IDENTITY +2, EMOTION -1, METHOD +1


Question 9
"You have the power to solve a problem permanently — but only if you cause real harm to someone who is, by most definitions, innocent. The problem affects many people. The innocent person affects only themselves."

Option	Text	Axes Scored
A	I cannot do it. There is a line and that is it.	JUSTICE +3, WORLD +3, METHOD -1
B	I do it. The math is clear. Emotion clouds what's obvious.	JUSTICE -3, WORLD -2, EMOTION -3
C	I find a third option. The question assumes a false binary.	METHOD +3, POWER +1, IDENTITY +2
D	I delay and investigate further. Permanent decisions need more information.	METHOD +2, EMOTION +1, SOCIAL +1


Question 10
"Your faction — the group you chose, the people who depend on you — is making a decision you believe is seriously wrong. You have spoken. They voted differently. What happens next?"

Option	Text	Axes Scored
A	I accept the decision and execute it. Collective decisions supersede mine.	LOYALTY +3, SOCIAL +2, IDENTITY -1
B	I accept the decision but work to change the outcome from inside.	SOCIAL +2, METHOD +2, IDENTITY +1
C	I refuse to participate in something I believe is wrong.	JUSTICE +2, IDENTITY +3, LOYALTY -2
D	I go around the decision without technically defying it.	METHOD +3, IDENTITY +2, SOCIAL -1


Question 11
"Two people who both matter to you need something, and you can only give it to one of them right now. One is suffering more. One would use it better."

Option	Text	Axes Scored
A	I give it to the one who is suffering more. Need comes first.	EMOTION +3, WORLD +2, LOYALTY +1
B	I give it to the one who will use it better. Outcome matters more than comfort.	METHOD +3, EMOTION -2, WORLD -1
C	I find a way to split it or delay until I can give both.	SOCIAL +2, JUSTICE +1, POWER -1
D	I give it to the one I'm more loyal to. Relationships are not interchangeable.	LOYALTY +3, IDENTITY +1, JUSTICE -1


Question 12
"The last question. Not a scenario. Just a direct question: What do you actually want? Not what you think you're supposed to want. What do you actually want, when nobody is watching?"

Option	Text	Axes Scored
A	To be undeniably excellent at something — and have the people worth impressing know it.	POWER +3, IDENTITY +2, SOCIAL +1
B	To protect the specific people I have chosen. Nothing else matters as much.	LOYALTY +3, EMOTION +2, WORLD +1
C	To understand how things actually work — and to use that understanding.	METHOD +3, POWER +1, IDENTITY +2
D	To make something that lasts after I'm gone.	WORLD +3, IDENTITY +2, JUSTICE +1
 
6. THE SCORING ALGORITHM
How raw answers become a character match. This is the implementation spec.

Step 1 — Collect Raw Scores
Each answer adds to axis totals. After 12 questions, each axis has a raw score from 0 to ~40.

  // Example: after all 12 answers
  const rawScores = {
    justice:  28,  // out of ~36
    power:    22,
    social:   31,
    emotion:  19,
    world:    25,
    identity: 17,
    method:   14,
    loyalty:  33,
  }

Step 2 — Normalize to 1–10
  const MAX_POSSIBLE = 36  // approximate max per axis
  
  function normalize(raw) {
    return Math.round((raw / MAX_POSSIBLE) * 9) + 1  // 1-10
  }
  
  const userVector = Object.fromEntries(
    Object.entries(rawScores).map(([k,v]) => [k, normalize(v)])
  )
  // { justice: 8, power: 6, social: 9, emotion: 5, world: 7, identity: 5, method: 4, loyalty: 9 }

Step 3 — Calculate Distance to Every Character
  // CHARACTER_VECTORS is your DB table of trait scores
  const AXES = ["justice","power","social","emotion","world","identity","method","loyalty"]
  
  function euclideanDistance(userVec, charVec) {
    return Math.sqrt(
      AXES.reduce((sum, axis) => {
        return sum + Math.pow((userVec[axis] || 5) - (charVec[axis] || 5), 2)
      }, 0)
    )
  }
  
  const ranked = characters.map(char => ({
    ...char,
    distance: euclideanDistance(userVector, char.trait_vector)
  })).sort((a, b) => a.distance - b.distance)
  
  // ranked[0] = closest match = your character
  // ranked[0-2] = top 3 matches (shown on result card)

Step 4 — Faction Assignment from Top Results
  // FACTION from top 3 matches — majority faction wins
  const top3 = ranked.slice(0, 3)
  const factionCounts = {}
  
  top3.forEach(char => {
    factionCounts[char.faction] = (factionCounts[char.faction] || 0) + 1
  })
  
  // Faction with most appearances in top 3 wins
  // Ties broken by ranked[0].faction
  const assignedFaction = Object.entries(factionCounts)
    .sort((a,b) => b[1] - a[1])[0][0]
  
  // Store: profiles.faction = assignedFaction
  // Store: profiles.character_match_id = ranked[0].id
  // Store: profiles.trait_scores = userVector (jsonb)

  Lore factions (rats, decay, clock) are excluded from initial assignment. A user can only get those through behavioral drift after significant time on site. The exam never places you there directly.
 
7. BEHAVIORAL DRIFT — CHARACTER EVOLVES
The exam gives the initial vector. What you actually do on the site drifts the vector over time. After 30 days of activity, the character match is recalculated. After 90 days, it may shift significantly.

User Action	Axis Drifted	Direction	Notes
Writes lore posts about characters who act on principle	JUSTICE	↑ +0.3	Author-connection posts especially
Writes lore posts framing power/strength as the core value	WORLD	↓ -0.2, POWER ↑ +0.2	
Consistently wins Arena debates with logic-based arguments	METHOD	↑ +0.3	Measured by upvotes on logical arguments
Consistently wins Arena by emotional/passionate arguments	EMOTION	↑ +0.3	
Arena votes — always picks the loner/solo character	SOCIAL	↓ -0.2	Tracked over 10+ votes
Arena votes — always picks the protector/group character	SOCIAL	↑ +0.2	
Participates in faction events and cross-faction discussions	SOCIAL	↑ +0.3	
Never interacts with others, only reads	SOCIAL	↓ -0.2, METHOD ↑ +0.1	
Posts in other factions' public spaces regularly	IDENTITY	↑ +0.2	Fluid identity signal
Never leaves own faction space	LOYALTY	↑ +0.3, SOCIAL ↓ -0.1	
Saves posts about redemption/change arcs	WORLD	↑ +0.2	
Saves posts about power/dominance arcs	WORLD	↓ -0.2	
Daily streak maintained for 60+ days	LOYALTY	↑ +0.3, IDENTITY ↓ -0.1	Consistency signal
Unlocks a Fyodor easter egg	IDENTITY	↑ +0.5 (large)	You were paying attention. That says something.

The Recalculation Formula
  // Weekly recalculation job (Supabase Edge Function or cron)
  
  function recalculateCharacterMatch(profile) {
    const examWeight    = 0.60  // exam score stays significant
    const behaviorWeight = 0.40 // behavior grows over time
  
    // After 90 days, shift weight toward behavior
    const daysSinceJoin = getDaysSince(profile.created_at)
    const adjustedBehaviorWeight = Math.min(0.60, 0.40 + (daysSinceJoin / 365) * 0.2)
    const adjustedExamWeight = 1 - adjustedBehaviorWeight
  
    const compositeVector = {}
    AXES.forEach(axis => {
      compositeVector[axis] = (
        (profile.trait_scores[axis] * adjustedExamWeight) +
        (profile.behavior_scores[axis] * adjustedBehaviorWeight)
      )
    })
  
    // Run distance calc against all characters
    // If new top match differs from current: update + notify user
    const newMatch = findClosestCharacter(compositeVector)
    if (newMatch.id !== profile.character_match_id) {
      notifyCharacterShift(profile.id, profile.character_match_id, newMatch.id)
      updateProfile(profile.id, { character_match_id: newMatch.id })
    }
  }

  Character shifts are shown to the user as a notification: "Your ability signature has changed. The city sees you differently now." Never shown as a negative — always framed as growth or evolution.
 
8. FACTION TRANSFER SYSTEM
Faction and character match are separate. You can change faction without losing your character identity. You can also keep your faction while your character match drifts. They are independent systems.

Transfer Rules
Rule	Detail
Eligibility	User must have been in current faction for minimum 30 days and have at least rank 2 (completed exam).
Request	User submits transfer request with a written reason (min 50 words). This is an in-universe framing — "why does your character belong elsewhere?"
Cooldown	Transfer can only happen once every 90 days. No faction hopping.
Approval	Faction Admin of the destination faction reviews and approves. They can decline if the user doesn't meet the faction's entry conditions.
Character update	On transfer approval, run distance calculation restricted to characters in the new faction. Assign the closest match within that faction.
AP	AP does not reset. Rank in new faction starts at 1. Previous faction rank is stored in history.
Lore factions	Cannot be transferred to directly. Lore factions (rats/decay/clock) are unlocked only through hidden conditions.
Double agent	A special mechanic (Phase 4) that allows secondary membership without leaving primary faction.

Transfer DB Schema
  CREATE TABLE faction_transfers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid REFERENCES profiles(id),
    from_faction    text NOT NULL,
    to_faction      text NOT NULL,
    reason          text NOT NULL CHECK (length(reason) >= 50),
    status          text NOT NULL DEFAULT 'pending',  -- pending | approved | declined
    reviewed_by     uuid REFERENCES profiles(id),  -- faction admin id
    review_note     text,
    requested_at    timestamptz DEFAULT now(),
    resolved_at     timestamptz,
    previous_rank   integer,
    previous_char   text REFERENCES characters(id)
  );
  
  -- Row level security: users see only their own rows
  -- Faction admins see requests for their faction
 
9. THE RESULT CARD — DESIGN SPEC
This is the most shareable moment in the product. It needs to feel like receiving your ability in the BSD world. Not "your personality type is..." — but "the city has registered your ability."

Card Layout — What Shows
Element	Content	Style Notes
Header eyebrow	能力者判定 · Ability Registry · Case #[random 4-digit number]	Tiny Space Mono, accent color
Character name	Full name in Cinzel, large	36px Cinzel bold
Japanese name	JP name in Noto Serif JP below	0.7rem, light weight, spaced
Ability name	English ability name in IM Fell English italic	1.3rem italic, accent color
Ability JP	Japanese ability name + reading	0.6rem Noto Serif JP
Faction badge	Faction name + kanji with faction color accent	Colored border-left or background tint
Starting rank	Rank 1 title for assigned faction + "City sees you as..."	0.6rem Space Mono
Match description	2-3 sentences personalised to the user's dominant axes	IM Fell English italic, 0.95rem
Trait bars	4 dominant traits shown as labeled bars at their scored values	Animated, faction color
Secondary matches	"The city also considered: [char2], [char3]" — subtle	Very small, text3 color
Share button	Copies a formatted text string to clipboard	btn-secondary style
Retake notice	Exam can be retaken after 30 days. Shows countdown if within cooldown.	Very small, text4

The Match Description — How to Write It
The 2-3 sentence description must reference the user's actual dominant axes, not just read back a canned character bio. It is generated from a template system.

  // Template components based on top 2 axes
  const AXIS_PHRASES = {
    justice:  { high: "The city reads your moral clarity as absolute.",
                low:  "You move in spaces where outcomes matter more than rules." },
    power:    { high: "Your ability registers as maximal — overwhelming when unleashed.",
                low:  "Your power is precise. Quiet. Surgical." },
    social:   { high: "Others anchor to you without knowing why.",
                low:  "You work alone. The city notes your independence." },
    emotion:  { high: "The registry records: driven by conviction, not calculation.",
                low:  "Cold. Precise. Emotion held at a distance." },
    world:    { high: "You believe people are worth protecting. The city agrees.",
                low:  "You have seen what the world is. You work with that reality." },
    identity: { high: "Your ability signature shifts with you. You are not finished.",
                low:  "Your ability is rooted in what you were. Stable. Certain." },
    method:   { high: "Information first. You think before you act.",
                low:  "Direct. The city records: acts immediately, processes later." },
    loyalty:  { high: "The registry notes: you have chosen your people. You do not waver.",
                low:  "Your loyalty is to your own code. Transferable to no one." },
  }
  
  // Sort user's axes by score, take top 2, assemble description
  function generateDescription(userVector, character) {
    const sorted = Object.entries(userVector).sort((a,b) => b[1]-a[1])
    const [top1, top2] = sorted.slice(0,2)
    return [
      `The ability registry has processed your signature.`,
      AXIS_PHRASES[top1[0]][top1[1] >= 7 ? "high" : "low"],
      AXIS_PHRASES[top2[0]][top2[1] >= 7 ? "high" : "low"],
    ].join(" ")
  }

Share Text (Clipboard)
  // What copies to clipboard when user hits Share
  function buildShareText(profile, character, faction) {
    return [
      `文豪アーカイブ · 能力者判定`,
      ``,
      `Character Match: ${character.name} · ${character.name_jp}`,
      `Ability: ${character.ability} · ${character.ability_jp}`,
      `Faction: ${faction.name} · ${faction.name_jp}`,
      ``,
      `The city has registered my ability signature.`,
      `bungouarchive.com/exam`,
    ].join("\n")
  }
 
10. IMPLEMENTATION ORDER
Build in this exact order. Each step is functional on its own. Do not skip ahead.

Step	What To Build	Codex Task? / Manual?	Depends On
1	Add trait_vector columns to characters table (8 integer columns J/P/S/E/W/I/M/L)	Manual — SQL in Supabase	Nothing
2	Seed all 38 character trait vectors from Section 4 of this doc	Manual — run seed SQL	Step 1
3	Add trait_scores (jsonb), behavior_scores (jsonb), character_match_id (text) to profiles table	Manual — SQL	Nothing
4	Add faction_transfers table from schema in Section 8	Manual — SQL	Nothing
5	Build the Role Exam UI — 12 questions, scoring, distance calc, result card	Codex task	Steps 1-3
6	Build the result card display component with trait bars and share button	Codex task	Step 5
7	Wire exam result to save profile: faction + character_match_id + trait_scores	Codex task (needs auth)	Steps 5, auth
8	Build behavioral drift tracking: log events to behavior_events table	Codex task	Auth
9	Build weekly recalc Edge Function in Supabase	Codex task (Supabase Edge Function)	Steps 7-8
10	Build faction transfer request UI and admin review flow	Codex task	Auth + Step 4

  For the MVP (matching the preview): only Steps 1-6 are needed. Steps 7-10 require authentication to be built first. The exam can work fully client-side for the preview build — just don't save to DB yet.

Codex Prompt for Step 5 + 6 (Exam + Result Card)
Build the Role Exam page at /exam. The exam has 12 questions hardcoded in the component (no DB fetch needed). Each question has 4 options. Each option adds points to specific axes from this set: justice, power, social, emotion, world, identity, method, loyalty. Track cumulative axis scores as the user answers. Show a progress bar (12 pips). No going back — commit like an ability activation. After question 12, normalize each axis score to 1-10, then fetch all characters from /api/character (which includes their trait vectors as char.traits.justice etc.). Calculate Euclidean distance from user vector to each character. Closest match wins. Show the result card with: character name (Cinzel font, large), JP name (Noto Serif JP), ability name (IM Fell English italic, accent color), ability JP, faction badge with faction color, a 3-sentence match description generated from the user's top 2 scoring axes using template phrases, 4 animated trait bars showing the user's scores, a "Secondary matches" line showing the 2nd and 3rd closest characters (small, muted), and a Share button that copies a formatted text string to clipboard. The exam questions and axis scores are in the component as static data.



文豪アーカイブ · Character Assignment System · Full Design Spec
横浜は、いつも雨が降っている。
