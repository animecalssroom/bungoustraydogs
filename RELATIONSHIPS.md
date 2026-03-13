# BUNGOUARCHIVE — RELATIONSHIPS BIBLE
## 文豪アーカイブ 関係辞典
> **USAGE:** All canon rivalries, bonds, hidden connections, the Corruption rule, and Bar Lupin. This file governs how characters interact in duels, lore, and the evolving story.

---

# CANON RIVALRIES IN DUELS

These apply automatically in the resolver whenever both characters are present. Check character slugs at duel creation and set `canon_rivalries` array on the duel record.

---

## ATSUSHI vs AKUTAGAWA 虎 vs 羅生門
```
CHARACTERS   atsushi-nakajima  ×  ryunosuke-akutagawa
EFFECT       Both deal +10 bonus damage to each other every round.
             Always active. No trigger needed.
```
**The relationship:**
Dazai abandoned Akutagawa as a mentor and took Atsushi under his wing instead. Akutagawa resents Atsushi for existing in the space he thought was his. Atsushi resents Akutagawa for being everything he's afraid of becoming. They are each other's shadow and mirror simultaneously. Their canon team-up "Shin Soukoku" (New Double Black) is the series' promise that these two might, eventually, become something different.

**In duels:**
Fights between Atsushi and Akutagawa are the most personal duels in the game. They aren't fighting for territory. They are fighting to prove something to a third person who isn't there.

**Lore implications:**
If both are assigned simultaneously in the game, Chronicle entries can reference this. Ango might note: "Two registered signatures were detected in the same district. The registry awaits the outcome."

---

## DAZAI vs CHUUYA 双黒
```
CHARACTERS   osamu-dazai  ×  chuuya-nakahara
EFFECT       Both deal +5 bonus damage to each other every round. Always active.
             Dazai's nullify drops from guaranteed to 80% success vs Chuuya only.
```
**The relationship:**
They were Double Black — the Port Mafia's most powerful team. Dazai manipulates gravity nullification (touching Chuuya stops Corruption). Chuuya provides the power. Together they are functionally unstoppable. They argue constantly. Dazai left the Mafia and never explained why. Chuuya is still annoyed about this. The real Chuuya Nakahara died at 30. The real Dazai Osamu wrote about double suicide. Their relationship in BSD is somewhere between the most loving thing in the story and the most unresolved.

**In duels:**
Dazai cannot fully nullify Chuuya — only 80%. This is the only opponent against whom Dazai's most reliable ability becomes unreliable. This is narrative and mechanical: Chuuya is the exception to Dazai's pattern.

**CORRUPTION — see below.**

---

## DAZAI vs AKUTAGAWA 師弟
```
CHARACTERS   osamu-dazai  ×  ryunosuke-akutagawa
EFFECT       Dazai's nullify is 100% success vs Akutagawa (overrides standard logic).
             Akutagawa gets +5 rage damage per round (his desperation/drive vs Dazai).
```
**The relationship:**
Dazai trained Akutagawa with abuse and then left. Akutagawa has never stopped trying to earn recognition from someone who gave it once, cruelly, and then walked away. Dazai knows exactly what he did. His guilt around Akutagawa is one of the things that drives him toward Atsushi — he is trying to do better.

**In duels:**
Dazai can perfectly nullify Akutagawa. Akutagawa cannot get through Dazai's counter. But Akutagawa deals extra damage from rage. The fight is not even — Dazai wins strategically, Akutagawa wins in volume.

---

## ODA vs AKUTAGAWA 鎮魂
```
CHARACTERS   sakunosuke-oda  ×  ryunosuke-akutagawa
EFFECT       Oda deals +8 damage to Akutagawa every round. Always active.
```
**The relationship:**
Oda's death shaped Akutagawa permanently — not because they had a relationship, but because Oda was who Dazai loved before Dazai chose the Agency. Akutagawa knows of Oda through Dazai. The weight of Oda's death is present every time Akutagawa tries to be something better.

**In duels:**
Oda's Flare ability was a counter type — he sees what is coming. The +8 damage reflects this: Oda sees through Akutagawa's patterns in a way Akutagawa cannot account for.

---

## ODA + DAZAI + ANGO — The Buraiha Trio 無頼派
```
CHARACTERS   sakunosuke-oda  ×  osamu-dazai  ×  ango-sakaguchi
NO DUEL EFFECT — this is a world event.
```
**BAR LUPIN TRIGGER:**
When all three characters are simultaneously assigned to players:
- A hidden faction_channel named `bar-lupin` is created automatically
- Access: ONLY the three players who hold these characters
- Private. Permanent.
- Ango posts the Chronicle entry: "The Bar Lupin Record — Three names. A date. The city remembers."
- This is the deepest easter egg in the game. Never announce it. Let it be found.

**The relationship:**
In real literary history, Osamu Dazai, Ango Sakaguchi, and Sakunosuke Oda were part of the Buraiha (Decadent) literary movement. They drank together. They argued about literature and human nature. They were friends in the way brilliant, self-destructive people are friends — intensely, briefly, memorably.

In BSD, the Dark Era arc shows Dazai and Ango at Bar Lupin with Oda. It is the last time Dazai was happy. Oda died before it ended. Bar Lupin is where Dazai decided to change.

---

## TETCHOU vs JOUNO 猟犬の絆
```
CHARACTERS   tetchou-suehiro  ×  saigiku-jouno
NO MECHANICAL EFFECT IN DUELS — narrative only.
```
**The relationship:**
They bicker constantly. Jouno announces he wishes Tetchou would drop dead. In the same scene he will deflect bullets to protect Tetchou from a trajectory he would have survived anyway. Tetchou takes hits stoically and makes no observations. They have been partners long enough that their dynamic is essentially marital. In the anime, one of the most understated protections in the series is Jouno using his ability to deflect bullets that weren't going to kill Tetchou anyway — and saying nothing about it.

**Lore implications:**
If both are assigned to players simultaneously, Chronicle entries can reference their patrols appearing in the same districts. Ango might note their combined sightings.

---

# THE CORRUPTION RULE
## 双黒の禁術 — The Sacred Rule

This is the most significant mechanic in the entire game. It happens once. It cannot happen again.

### What It Is
In BSD canon, Chuuya's Corruption (堕落) is the activation of his ability's true form — manipulating gravity on a catastrophic scale, in exchange for losing his mind. Dazai must touch him to end it. Together, they are called Double Black (双黒) because one without the other is incomplete.

In BungouArchive, Corruption is a team fight mechanic that honours this precisely.

### How It Works
**Conditions:**
- This is a TEAM FIGHT only (2v2 or 3v3 duel, not 1v1)
- Dazai and Chuuya must be on the SAME team
- In the same round, BOTH players must manually activate Corruption

**What happens:**
- 999 damage to ALL enemies
- Instant team win
- The duel ends immediately

**The consequence:**
After it fires:
```sql
INSERT INTO global_events (event_type, description, occurred_at)
VALUES ('corruption', 
  'Corruption was unleashed by Double Black. Yokohama will not forget.', 
  now());
```
- `corruption_used = true` stored permanently
- If `corruption_used` is already true when either player tries to activate: server rejects (400)
- UI shows: "This ability has already been spent. Double Black has fired once. The city recorded it."
- Owner receives a private notification when it fires

**The Chronicle:**
After Corruption fires, Ango publishes a Chronicle entry. Written by the owner, not generated. Short. Precise.

> *"Black Record — YKH-X-[year]-CORR*
> *The registry has detected an event of the highest known ability class.*
> *Two registered signatures. Simultaneous activation. The district of [district] is still.*
> *The event has been classified. The city does not forget.*
> *Double Black. Once."*

**Why once:**
The real Dazai and Chuuya use Corruption in the anime twice — but the second time nearly kills Chuuya. In BungouArchive, we honour the weight by making it once, ever. This is not a mechanical limit. It is a narrative limit. It matters more because it cannot be repeated.

---

# FYODOR vs DAZAI — The Great Game
```
CHARACTERS   fyodor-dostoevsky  ×  osamu-dazai
TYPE         Not a duel rivalry with mechanical bonuses — a lore dynamic.
```
**The relationship:**
They are mirrors. Both are the most intelligent people in any room. Both are comfortable performing lesser versions of themselves to misdirect opponents. Fyodor believes abilities are sinful. Dazai can nullify abilities. They have fought each other across an entire arc using chess metaphors — Dazai as the white king, Fyodor as the black king, other characters as pieces.

Fyodor's fundamental mistake: he trusted his own intelligence over everyone else's. Dazai defeated him not by being smarter but by being willing to be wrong.

**In the game:**
If both Fyodor and Dazai are simultaneously assigned (which requires the owner to have both active), the Chronicle should note it. Ango posts one line:

> *"Two intelligence-class signatures are active in Yokohama simultaneously. The city is watching."*

No mechanical effect. The narrative weight is sufficient.

---

# RESERVED CHARACTER RELATIONSHIPS

These are not rivalries but critical notes for how reserved characters interact with each other and with regular players.

## Mori and Fukuzawa
The most consequential non-combat relationship in Yokohama. They are the leaders of the two largest factions. They have a mutual respect that has never translated into alliance and a mutual opposition that has never translated into open war. They maintain the city's balance not through agreement but through the tension of their opposition.

If both are assigned (extreme rarity), Ango's Chronicle entry:
> *"Both registered. The city notes the convergence. The balance requires observation."*

## Fukuchi and the Hunting Dogs
Fukuchi's plan — the one that makes him the villain — required absolute loyalty from his unit followed by the willingness to betray him when the moment came. The Hunting Dogs who survived did not know they were following a plan that required their eventual defection. Tetchou and Jouno's arcs are about learning this and deciding what loyalty means when the authority demanding it was lying.

**Lore expansion opportunity:**
A Chronicle entry late in the game's life could reference the revelation — written carefully, in Ango's voice, suggesting that some records have been reclassified.

---

# HIDDEN FACTION DISCOVERY SIGNALS

These are the patterns to watch for as owner. They are not quiz results. They are months of observation.

## Rats in the House of the Dead
```
PATTERN: Dark philosophical lore. References to guilt, sin, the nature of ability.
         Actual Dostoevsky content in their writing.
         High intel, low loyalty in behaviour scores.
         Engages with moral complexity seriously rather than performatively.
         Move speed: slow and deliberate.
         Posts: sparse, long, constructed.
TRIGGER: One notification from owner account.
         "You have been expected."
         Link to hidden faction page.
         Fyodor awakens in Yokohama.
```

## Decay of the Angel
```
PATTERN: Chaotic participation. High activity then sudden silence.
         Returns unpredictably and engages immediately.
         Engages with everything at the same enthusiastic level.
         Posts that are genuinely funny AND genuinely unsettling.
         Impossible to predict what they'll do next — but they always do something.
TRIGGER: One notification.
         "The registry has flagged your file as unusual."
         Link to hidden faction page.
         Gogol appears.
```

## Clock Tower *(Future — after months of play)*
```
PATTERN: Longest-standing active members. Rank 5 or 6. Consistent presence.
         They have been here since near the beginning.
         They know the lore well enough to spot inconsistencies.
         They are the community.
TRIGGER: Personal message. Not a notification. A private message from Ango:
         "The registry has reviewed your extended service record.
          A separate classification is available.
          Your prior designation remains unchanged."
         Link to Clock Tower page.
```

---

# FACTION WAR LORE PRINCIPLES

When writing Chronicle entries for war outcomes, Ango follows these principles:

**The war happened. Say it plainly.**
> *"Following three days of registered conflict, the district of Honmoku has passed to [faction] authority."*

**Note the human cost briefly.**
> *"The registry records [number] certified duels. [number] contested posts. The conclusion was [word]."*

**End with a line that means more than it says.**
> *"The city continues to observe."*
Or:
> *"Three factions have noted the outcome."*
Or:
> *"The registry remains open."*

**Never dramatise. Never celebrate. Never condemn.**
Ango is the record. Records do not have opinions. The fact that everyone who reads the record has opinions is sufficient.

---

# EASTER EGGS AND HIDDEN INTERACTIONS

These are designed to be discovered, not announced. Plant them. Let the community find them.

## The Dazai Archive Visit
If a player reads Dazai's Archive entry 5 or more times:
The hidden line appears after a 3-second delay:
*"You have accessed this file [N] times. The registry notes your interest. — Ango-san"*
Different text than other Archive easter eggs. Signed.

## The Jouno Prediction
The Jouno bot (if active) should once per week post something that references something you have already planned to trigger. Not a prediction — a record of something Jouno saw. Written past-tense. The community will not know if it is real until it is.

## The Poe-Ranpo File
If Poe is assigned to one player and Ranpo to another, both Archive entries get a hidden note:
*"Cross-reference: [Ranpo/Poe]. Status: ongoing."*
Visible only to the holder of the other character.

## Ivan Goncharov
The wanderer bot. Once per week he posts something that mirrors what Ango posted — hours later, different angle, zero acknowledgment. If someone pays attention long enough to notice, they are the kind of player the Rats faction was made for.

---

*BungouArchive — 文豪アーカイブ*
*横浜は、いつも雨が降っている。*
