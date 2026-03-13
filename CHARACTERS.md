# BUNGOUARCHIVE — CHARACTER BIBLE
## 文豪アーカイブ キャラクター辞典
> **USAGE:** Paste this file into any Codex prompt, Guide Bot session, or Claude conversation for full character context without re-explaining. Single source of truth for all 32 characters. Built from anime canon + manga lore + web research.

---

## HOW TO READ AN ENTRY
```
SLUG          game identifier (matches character_profiles.slug in DB)
FACTION       agency | mafia | guild | hunting_dogs | special_div | rats | decay
TYPE          destruction | counter | manipulation | analysis
TRAITS        Power / Intel / Loyalty / Control (each 1–5)
VISUAL        colour, motif, design direction for future art
ANIME SELF    personality, speech, what drives them
REAL AUTHOR   the literary figure they're based on
ABILITY       what their power does in canon
LITERARY LINK how the real writing connects to the ability
ASSIGNMENT    what player behaviour should trigger this match
PASSIVE       in-game passive effect
SPECIAL       activated ability — effect, cooldown
DUEL VOICE    how Gemini should describe their combat style
```

---

# ARMED DETECTIVE AGENCY 武装探偵社
> *"The city does not distinguish between the guilty and the desperate. We do."*
> Colour: warm amber gold. Motif: ink and paper, open books, magnifying glass.

---

## ATSUSHI NAKAJIMA 中島 敦
```
SLUG     atsushi-nakajima
FACTION  agency
TYPE     destruction
TRAITS   Power 3 / Intel 2 / Loyalty 4 / Control 2
VISUAL   Silver-white hair, tiger-stripe eyes. Agency coat. Colour: moonlight silver
         + amber. Motif: white tiger, crescent moon, an orphanage door.
```
**ANIME SELF**
Atsushi is the series' heart and its most honest character. Thrown out of an orphanage at 18 and told he was worthless — he believed it for a long time. He is desperately earnest, cries openly, and fights not from bravery but from refusal to let others suffer as he did. He hesitates before he trusts himself. When he fights Akutagawa he is not trying to win — he is trying to prove they can both survive.

**REAL AUTHOR**
Atsushi Nakajima (1909–1942). Modernist known for *Sangetsuki* (The Moon Over the Mountain) — a poet who transforms into a tiger and loses his humanity to pride and grief. Died of asthma at 33 having published almost nothing.

**ABILITY — Beast Beneath the Moonlight 月下獣**
Transforms into a white tiger: immense strength, speed, near-total regeneration. Initially uncontrollable — he blacked out during transformations. With time learned partial shifts (claws, legs) and eventually full control.

**LITERARY LINK**
In *Sangetsuki*, a man so consumed by inability to write literally becomes a beast. Atsushi's tiger is his own self-doubt made physical. When he accepts himself, the tiger becomes a tool.

**ASSIGNMENT SIGNALS**
High loyalty. Posts protecting others. Expresses doubt before acting. Archive reads skewed toward Agency. Duel style: opens STANCE, builds before striking. Medium move speed. Writing: earnest, emotional, self-deprecating.

**PASSIVE — Beast Form**
When HP drops to or below 30 for the first time: all subsequent damage dealt doubles permanently. Once per duel. Flag: `atsushi_beast_activated`.

**SPECIAL — Beast Beneath the Moonlight**
40 damage ignoring defence. Usable only when HP ≤ 30. Server rejects if HP > 30. Once per duel.

**DUEL VOICE**
Atsushi fights like someone who has already lost everything once. His strikes are desperate and precise. The tiger does not choose to fight — it simply refuses to die.

---

## OSAMU DAZAI 太宰 治
```
SLUG     osamu-dazai
FACTION  agency
TYPE     counter
TRAITS   Power 2 / Intel 5 / Loyalty 2 / Control 3
VISUAL   Long dark coat, bandaged arms and neck. Dark eyes always slightly smiling.
         Colour: midnight black + pale lavender. Motif: bandages, a coin, the phrase
         "double suicide."
```
**ANIME SELF**
The most dangerous person in any room he enters, and he knows it. Performs suicidal comedy with such commitment people forget he is a former Port Mafia executive who could probably end you three different ways from across a table. His suicide jokes are not entirely jokes. Deeply, genuinely lonely under the charm. Took Atsushi under his wing for reasons he will never fully explain. Genuinely loved Oda. Genuinely misses Chuuya, and will never say so.

**REAL AUTHOR**
Osamu Dazai (1909–1948). *No Longer Human* (人間失格) — a man who feels incapable of being human and performs different selves for different people while slowly falling apart. Died by double suicide at 38 in the Tamagawa Canal.

**ABILITY — No Longer Human 人間失格**
Nullifies any supernatural ability by touch. Abilities that contact Dazai stop working. He cannot turn this off.

**LITERARY LINK**
In the novel, the protagonist performs false selves to survive. Dazai's ability is the inversion — he cannot wear another person's power, cannot pretend to be something he is not. He is the one person who simply is.

**ASSIGNMENT SIGNALS**
High intel. GAMBIT-dominated duel style. Very fast move speed. Posts that observe more than participate. Lore reads skewed toward complex characters. Writing: layered, ironic, more meaning between the lines.

**PASSIVE — No Longer Human**
Immune to ALL ability effects: passives that would affect him, specials with secondary effects, status debuffs. Takes base move damage only. Always active.

**SPECIAL — No Longer Human**
Nullifies opponent's SPECIAL this round — fires but deals 0 and applies no effects. vs Akutagawa: 100% success. vs Chuuya: 80% success (roll ≥ 0.2). Cooldown: every 2 rounds.

**DUEL VOICE**
Dazai doesn't fight. He arranges circumstances so his opponent defeats themselves. Unhurried, almost bored. Only fully present when someone is about to do something stupid — he watches with complete attention.

---

## DOPPO KUNIKIDA 国木田 独歩
```
SLUG     doppo-kunikida
FACTION  agency
TYPE     analysis
TRAITS   Power 3 / Intel 4 / Loyalty 4 / Control 5
VISUAL   Tall, glasses, neat hair, always carrying his notebook.
         Colour: forest green + steel blue. Motif: an open notebook, a pen, a schedule.
```
**ANIME SELF**
The Agency's conscience and its most reliable person. Rigid, punctual, deeply idealistic — his Ideals are written in his notebook and he measures every action against them. Furious at Dazai approximately 70% of the time, which doesn't stop him from following Dazai into catastrophic situations. Will sacrifice himself for strangers without hesitation because his Ideals require it. He is not inflexible — he is principled, which is different. Cries when his ideals fail him, then rewrites them.

**REAL AUTHOR**
Doppo Kunikida (1871–1908). Naturalist writer, prose sketches that captured reality without sentimentality. His work explores the gap between what people aspire to and what they can achieve.

**ABILITY — The Matchless Poet 独歩吟客**
Materialises any object by writing it in his notebook and tearing out the page — as long as the object is no larger than the notebook. Can replicate objects he has seen as long as he understands their mechanism.

**LITERARY LINK**
Kunikida's poetry tried to make the ideal tangible — to put abstract aspiration into concrete words. His ability is this literally: write the ideal, make it real.

**ASSIGNMENT SIGNALS**
High control and loyalty. Heavy STANCE use, measured strike timing. Slow move speed — deliberate. Posts: structured, task-oriented, formal. Lore that fills logistical gaps. Writing: precise, slightly stiff.

**PASSIVE — Lone Poet**
All STRIKE moves deal +5 bonus damage. Always active.

**SPECIAL — Ideal Notebook**
Negates ALL incoming damage this round. Once per duel.

**DUEL VOICE**
Kunikida fights according to a plan. Every movement is a decision made three steps ago. He does not improvise — he executes. When forced to adapt, he does so with furious efficiency that looks like improvisation but isn't.

---

## RANPO EDOGAWA 江戸川 乱歩
```
SLUG     ranpo-edogawa
FACTION  agency
TYPE     analysis
TRAITS   Power 1 / Intel 5 / Loyalty 3 / Control 4
VISUAL   Small, childlike despite being oldest active member. Round glasses, green eyes,
         slightly bored expression. Colour: deep green + cream. Motif: magnifying glass,
         mystery novel, a pile of sweets.
```
**ANIME SELF**
26 years old, acts 12, functionally the greatest detective alive. Has no ability — his "Super Deduction" is simply intelligence so extreme he processes information the way others process breath. Believes he has an ability because Fukuzawa told him he did, so he wears his glasses as the "activation ritual." Vain, childish, greedy for snacks, dismissive of anyone intellectually beneath him (which is almost everyone). Underneath all of it: genuinely joyful. Loves his work with the purity of a child who found their one thing.

**REAL AUTHOR**
Edogawa Ranpo (1894–1965). Pen name inspired by Edgar Allan Poe. Father of Japanese detective fiction. Created the detective Kogoro Akechi. Pioneered the *honkaku* (fair-play) mystery genre.

**ABILITY — Super Deduction 超推理**
Not supernatural — preternatural deductive intelligence that reaches correct conclusions from minimal evidence in seconds. Classified as analysis-type in game.

**LITERARY LINK**
Ranpo's mysteries are puzzles of total logical fairness — every clue is present, every answer reachable if you're smart enough. His ability is this: given enough data, there are no mysteries.

**ASSIGNMENT SIGNALS**
Max intel. Lowest power. Highest Archive read count (lore_topics). Heavy STANCE duel style. Very slow move speed. Posts that decode other players' actions.

**PASSIVE — Super Deduction**
After both moves submitted but before resolution: Ranpo's player sees opponent's exact move choice. Shown only to Ranpo's user.

**SPECIAL — Super Deduction (Activated)**
Opponent's move entirely skipped this round — deals 0, their move is recorded but has no effect. Once per duel.

**DUEL VOICE**
Ranpo doesn't fight in the conventional sense. He already knows what you're going to do. He is simply waiting for you to do it, mildly disappointed that you chose so predictably.

---

## AKIKO YOSANO 与謝野 晶子
```
SLUG     akiko-yosano
FACTION  agency
TYPE     counter
TRAITS   Power 4 / Intel 3 / Loyalty 4 / Control 4
VISUAL   Dark hair with flowers or pins, military-style coat, butterfly knife.
         Colour: deep rose + black. Motif: butterfly knife, surgical tools, chrysanthemums.
```
**ANIME SELF**
Frightening in a way the show takes seriously. Her ability requires a patient to be near death before she can heal them — so historically she had to wound her patients first. She carries this with absolute calm. She fought in a war as a teenager, watched soldiers she healed die and return and die again until one tried to kill her. She survived. She practices medicine now and holds the Agency together with her steadiness. Intensely feminist in a show set in early 20th century Japan. Makes no apologies for it.

**REAL AUTHOR**
Akiko Yosano (1878–1942). Feminist poet and anti-war activist. *Kimi Shinitagimou Koto Nakare* (Thou Shalt Not Die) was written to her brother during the Russo-Japanese War — a direct protest against dying for one's country.

**ABILITY — Thou Shalt Not Die 君死にたもうこと勿れ**
Heals any injury if the patient is on the verge of death (under threshold). If the patient is healthy, the ability does nothing. She has historically damaged patients before she could save them.

**LITERARY LINK**
The poem refuses to let a soldier die nobly for the Emperor. Yosano's ability is the same insistence — she will not let death happen, even if the path to survival is brutal.

**ASSIGNMENT SIGNALS**
Balanced high stats. Deliberate duel style, heavy RECOVER use. Posts protective of others or rejecting hierarchy. Writing: confident, precise, a little fierce.

**PASSIVE — Angel of Death**
When HP drops to or below 20 for the first time: immediately auto-heals to 50 HP, before incoming damage is finalised. Once per duel.

**SPECIAL — Thou Shalt Not Die**
Heals self to 50 HP immediately. Usable at any HP. If passive has already fired, still resets to 50. Once per duel.

**DUEL VOICE**
Yosano doesn't fear being hurt. She knows exactly how much punishment a body can absorb and still return. She fights with the patience of someone who has seen worse and survived — which is the most terrifying quality in a combatant.

---

## JUNICHIROU TANIZAKI 谷崎 潤一郎
```
SLUG     junichirou-tanizaki
FACTION  agency
TYPE     manipulation
TRAITS   Power 2 / Intel 3 / Loyalty 4 / Control 3
VISUAL   Young, soft-faced, light hair, often anxious-looking.
         Colour: pale blue + white. Motif: falling snow, mirrors, a younger sister.
```
**ANIME SELF**
Defined by two things: his ability and his sister Naomi. His ability is defensive and deceptive — illusions, concealments, uncertain reality. He applies this to himself socially: unassuming, gentle, easy to underestimate. Fiercely loyal. When Naomi is threatened the unassuming quality vanishes entirely.

**REAL AUTHOR**
Junichirō Tanizaki (1886–1965). *Sasameyuki* (The Makioka Sisters), *In Praise of Shadows* — an essay on how Japanese aesthetics thrive in partial darkness, candlelight, deliberate obscuring.

**ABILITY — Light Snow 細雪**
Projects illusions within a defined area. Makes things appear, disappear, or look like something else.

**LITERARY LINK**
*In Praise of Shadows* argues beauty lives in what is hidden. Tanizaki's ability makes shadow and illusion into weapons — fighting by not being seen.

**ASSIGNMENT SIGNALS**
High loyalty. Quiet presence — posts supporting others. Heavy STANCE duel style. Writing: soft, careful, rarely confrontational.

**PASSIVE — Light Snow**
All STANCE moves reduce incoming damage by 60% instead of the standard 40%.

**SPECIAL — Light Snow (Full Veil)**
Untargetable this round — 0 damage received. Also deals 0. Cooldown: every 3 rounds.

**DUEL VOICE**
Tanizaki fights by not being where you aim. Every move is a misdirection. When you find him, you realise he was never trying to hit you — he was waiting for you to miss.

---

## KYOUKA IZUMI 泉 鏡花
```
SLUG     kyouka-izumi
FACTION  agency
TYPE     destruction
TRAITS   Power 4 / Intel 2 / Loyalty 4 / Control 3
VISUAL   14 years old, traditional kimono, dark hair, violet-blue eyes.
         Colour: deep blue + white. Motif: a ghost, a phone, a sword in snow.
```
**ANIME SELF**
Port Mafia's youngest assassin, taken in as a child and trained to kill using a phone connected to a ghost she summons. Carried a death toll before she was 14. Joined the Agency because Atsushi refused to kill her and offered her something she had never had — a choice. Quiet, serious, traumatised, slowly learning she is allowed to want things. Not sweet. Careful, fierce, still figuring out who she is without the Mafia.

**REAL AUTHOR**
Kyōka Izumi (1873–1939). Known for supernatural romance, gothic atmosphere, strong women who transcend social norms. His ghost women have power that transcends the normal world.

**ABILITY — Demon Snow 夜叉白雪**
Summons Demon Snow — a ghostly figure with a sword that obeys commands via Kyouka's phone. Initially controlled by others; now responds only to her.

**LITERARY LINK**
Izumi's ghost women are not passive — they are power in a form society cannot contain. Demon Snow is this: her mother's final act of love became a weapon that protects her daughter.

**ASSIGNMENT SIGNALS**
Strong power + loyalty. Brief, reserved posts. Fast move speed — decides and acts. Writing: minimal, precise, no unnecessary words.

**PASSIVE — Demon Snow's Guard**
Receives 5 less damage every round from all sources. Always active.

**SPECIAL — Demon Snow**
35 damage ignoring ALL defence effects. Stance reduction does not apply. Cooldown: every 2 rounds.

**DUEL VOICE**
Kyouka doesn't waste motion. She has been trained since childhood to end fights quickly. The ghost moves when she decides it moves. No hesitation — only the decision and its consequence.

---

## KENJI MIYAZAWA 宮沢 賢治
```
SLUG     kenji-miyazawa
FACTION  agency
TYPE     destruction
TRAITS   Power 5 / Intel 1 / Loyalty 5 / Control 2
VISUAL   14 years old, straw hat, wide smile, enormous physical presence.
         Colour: harvest yellow + sky blue. Motif: wheat field, a bell, simple
         country things that contain vast power.
```
**ANIME SELF**
The happiest person in a show full of deeply unhappy people, and this is not naivety — it is a choice he makes every morning. From a rural farming family. Enormous love for the world. Physically the strongest Agency member (possibly the strongest in Yokohama when hungry). Uses this with absolute gentleness because he doesn't need to hurt anyone to feel safe. Popular with Yokohama civilians — remembers their names, kind to strangers. Finds city life baffling. Cities find him baffling back.

**REAL AUTHOR**
Kenji Miyazawa (1896–1933). Beloved poet and children's author. *Ame ni mo Makezu* (Undefeated by the Rain) — a meditation on selfless, simple living. Spent his life helping poor farmers. Died of pneumonia at 37.

**ABILITY — Undefeated by the Rain 雨ニモマケズ**
Superhuman strength when hungry. The hungrier he is, the stronger. Functionally unkillable from pure strength once sufficiently food-deprived.

**LITERARY LINK**
The poem asks only for the strength to endure and to be useful. Kenji's power is not glory — it is the impossible stubborn strength of someone who simply refuses to stop.

**ASSIGNMENT SIGNALS**
Max loyalty and power. Gentlest posts. Heavy STANCE duel style, patient. Never GAMBIT. Writing is nature-themed, quiet, notices small details.

**PASSIVE — Undefeated by the Rain**
When HP drops below 20: becomes immune to ALL incoming damage. Permanent for rest of duel once activated.

**SPECIAL — Undefeated by the Rain (Full)**
Absorbs ALL incoming damage this round, then reflects 50% of the absorbed amount back as damage. Once per duel.

**DUEL VOICE**
Kenji doesn't fight to win. He fights because stopping is not something he knows how to do. The punches keep coming not from aggression but from something more fundamental — he is simply still standing.

---

## EDGAR ALLAN POE エドガー・アラン・ポー
```
SLUG     edgar-allan-poe
FACTION  agency
TYPE     manipulation
TRAITS   Power 1 / Intel 5 / Loyalty 2 / Control 4
VISUAL   Tall, gaunt, very pale, dark circles. Always slightly startled. Raccoon Karl.
         Colour: midnight + candlelight gold. Motif: a raven, a locked room, scattered
         manuscript pages, Karl the raccoon (never explained).
```
**ANIME SELF**
Genius detective novelist who spent years trying to defeat Ranpo in a battle of wits and lost every time. Deeply socially anxious — starts sentences too enthusiastically and catches himself and apologises. Refers to Karl the raccoon with complete seriousness. Wanted to be Ranpo's rival, ended up as something like a devotee. His ability is genuinely terrifying for how cerebral it is. When he writes you into a mystery, you are in it.

**REAL AUTHOR**
Edgar Allan Poe (1809–1849). *The Murders in the Rue Morgue* invented the analytical detective. *The Raven*, *The Tell-Tale Heart*, *The Fall of the House of Usher*. Died in mysterious circumstances at 40.

**ABILITY — Black Cat in the Rue Morgue モルグ街の黒猫**
Traps a target inside a mystery novel only Poe can write or solve. The victim lives the story. From outside, no time passes.

**LITERARY LINK**
Poe invented the locked room mystery — murder in an impossible location with an impossible solution. His ability IS the locked room: once inside, no exit except through Poe.

**ASSIGNMENT SIGNALS**
Max intel, minimal power. Reads Archive obsessively. Duel style: sets trap in rounds 1-2, then waits for pattern. Writing: anxious, thorough, buries the most important thing in paragraph three. Every 3rd post mentions Karl. Karl is never explained.

**PASSIVE — Black Cat**
If opponent uses the same move for 2 consecutive rounds: Poe auto-fires a 35-damage counter next round, in addition to normal resolution.

**SPECIAL — The Trap**
Sets a trap. Next round: opponent takes 45 damage regardless of their move. Track with `poe_trap_active`. Once per duel.

**DUEL VOICE**
Poe sets the stage before the curtain rises. By the time you realise you're in his story, the ending has already been written. He watches from a great distance, anxiously, because he's never sure his plots hold together — but they always do.

---

## YUKICHI FUKUZAWA 福沢 諭吉 *(RESERVED)*
```
SLUG     yukichi-fukuzawa
FACTION  agency
TYPE     counter
TRAITS   Power 4 / Intel 4 / Loyalty 5 / Control 4
VISUAL   Tall, silver-haired, commanding. Traditional clothing.
         Colour: silver + deep indigo. Motif: an open hand, balance scales.
```
**ANIME SELF**
Founded the Armed Detective Agency because he believed ability users needed a home that was neither criminal nor military. Rarely seen in action — doesn't need to be. Uses his ability almost exclusively to help members manage powers they can't yet control. Most respected person in Yokohama. He and Mori have a long, complicated mutual respect that is also mutual opposition.

**REAL AUTHOR**
Yukichi Fukuzawa (1835–1901). Founded Keio University. *Encouragement of Learning* argued all people are born equal and only education creates difference. Introduced Western liberal thinking to Meiji Japan.

**PASSIVE — Agency Directive**
Immune to ALL debuffs, stun, freeze, and max HP reduction. Always active.

**SPECIAL — Agency Directive**
30 damage ignoring all defence. Cooldown: every 2 rounds.

---

## SAKUNOSUKE ODA 織田 作之助 *(RESERVED)*
```
SLUG     sakunosuke-oda
FACTION  agency
TYPE     counter
TRAITS   Power 3 / Intel 4 / Loyalty 5 / Control 3
VISUAL   Dark hair, sharp eyes, permanent slight melancholy. Often at Bar Lupin.
         Colour: deep copper + warm shadow. Motif: whisky glass, Bar Lupin,
         six orphaned children, a futile final act.
```
**ANIME SELF**
The moral centre of the Dark Era arc and possibly the entire series. Port Mafia assassin who refused to kill anyone capable of fighting back — only criminals. Raised six orphaned children. Spent evenings at Bar Lupin with Dazai and Ango, talking about whether people can change. Used by someone he trusted, which got him and the children killed. His last words to Dazai: *"Save people."* Everything Dazai becomes afterward is in some sense Oda's will continuing to exist.

**REAL AUTHOR**
Sakunosuke Oda (1913–1947). Osaka-born Buraiha (Decadent) writer alongside the real Dazai and Ango Sakaguchi. Humanist prose about ordinary people in extraordinary pain. Died of tuberculosis at 33.

**ABILITY — Flare フレア**
Sees multiple future outcomes — essentially, he can see ahead and choose the path where others survive. Cannot use it to save himself when the time comes.

**BAR LUPIN TRIGGER**
When Dazai (any user), Ango (Ango account), and Oda are all simultaneously assigned: hidden channel `bar-lupin` is created. Private. Those three only. Deepest easter egg in the game.

**PASSIVE — Calm Foresight**
At end of every round where Oda took more damage than he dealt: heals 8 HP.

**SPECIAL — Flare**
Does not attack. Reveals opponent's next move TYPE to Oda's player with 100% accuracy before the next round. Cooldown: every 2 rounds.

---

# PORT MAFIA 港マフィア
> *"Order is maintained by those willing to be its shadow."*
> Colour: blood red + charcoal black. Motif: crow feathers, port cranes, night rain.

---

## CHUUYA NAKAHARA 中原 中也
```
SLUG     chuuya-nakahara
FACTION  mafia
TYPE     destruction
TRAITS   Power 5 / Intel 3 / Loyalty 5 / Control 2
VISUAL   Short (infamously so), red hair, wide-brimmed hat, wine-red coat.
         Colour: blood red + gunmetal. Motif: wine glass, gravity, a hat he never removes.
```
**ANIME SELF**
Port Mafia's most powerful combat executive. Manipulates gravity — his body moves like a weapon. Short-tempered, loud, deeply loyal. Is constantly, quietly aware that Dazai left and never looked back, and this still bothers him in ways he would never admit. Together with Dazai as Double Black they are functionally unstoppable. Apart, they are just individually terrifying. He is 22 and drinks wine and is proud of both.

**REAL AUTHOR**
Chūya Nakahara (1907–1937). Lyric poet, Dadaism, melancholic sensory verse. *Yogorecchimatta kanashimi ni* — grief so deep it has been alive too long and grown heavy with corruption. Died of meningitis at 30.

**ABILITY — Upon the Tainted Sorrow 汚れっちまった悲しみに**
Manipulates gravity of any object he touches. In Corruption mode: catastrophic-scale gravity manipulation at the cost of losing his mind.

**LITERARY LINK**
The poem speaks of grief turned filthy — not pure sadness but sadness that has become heavy with age. Chuuya's Corruption is this: power so immense it destroys the person wielding it.

**ASSIGNMENT SIGNALS**
Max power + high loyalty. Fastest move speed. GAMBIT-first duel style. Short, confident, slightly combative posts. Reacts to other players' achievements competitively.

**PASSIVE — Gravity Overload**
When HP drops below 40: damage dealt increases +8/round AND damage received increases +5/round. Permanent for rest of duel once triggered.

**SPECIAL — Upon the Tainted Sorrow**
50 damage, ignores ALL defence. Cooldown: every 2 rounds.

**CORRUPTION** — Team fights only. With Dazai on same team. Both must activate same round. 999 damage. Once in game history. See RELATIONSHIPS.md.

**DUEL VOICE**
Chuuya doesn't have a fighting style — he has a direction of travel and everything else gets out of the way or doesn't. He is loudest right before the decisive blow. The gravity shifts before he decides to swing.

---

## RYUNOSUKE AKUTAGAWA 芥川 龍之介
```
SLUG     ryunosuke-akutagawa
FACTION  mafia
TYPE     destruction
TRAITS   Power 5 / Intel 3 / Loyalty 4 / Control 3
VISUAL   Black coat that moves like it's alive (it is). Dark eyes, persistent cough.
         Pale, sickly, visually terrifying. Colour: void black + deep crimson.
         Motif: the black coat, a reaching hand, an impossible standard.
```
**ANIME SELF**
One of the most compelling characters because his arc is entirely about need that was never met. Dazai trained him with abuse and abandonment and then left, and Akutagawa has spent the years since trying to earn recognition from the person he will never get it from. Cruel to Atsushi in part because Dazai chose Atsushi instead. Ruthless, precise, genuinely frightening in combat. Protects his sister Gin with extraordinary tenderness. He is not a villain — he is a person in tremendous pain who was taught that pain means power.

**REAL AUTHOR**
Ryūnosuke Akutagawa (1892–1927). *Rashōmon* — a ruined gate where people make desperate choices under impossible pressure. *In a Grove* — multiple contradictory truths from the same event. Died by suicide at 35.

**ABILITY — Rashōmon 羅生門**
His black coat is alive — transforms into a black beast that can tear through almost anything, including space itself. Responds to his will with terrifying speed and ferocity.

**LITERARY LINK**
*Rashōmon* asks: when survival demands it, is cruelty justified? Akutagawa's coat is this question made physical — it tears at reality the way the story tears at moral certainty.

**ASSIGNMENT SIGNALS**
Max power + high loyalty. STRIKE-heavy with saved specials. Fast move speed. Precise, slightly contemptuous posts that occasionally reveal something beneath. Writing: terse, exact.

**PASSIVE — Rashōmon's Hunger**
For each consecutive round where SPECIAL was NOT used: +3 bonus damage stacks on next STRIKE. Stacks reset when STRIKE fires. Max: 5 rounds = +15 bonus.

**SPECIAL — Rashōmon**
45 damage, ignores STANCE defence reduction entirely. Cooldown: every 2 rounds.

**DUEL VOICE**
Akutagawa fights with something to prove. Every blow carries the weight of every time Dazai looked away. The coat moves faster than his intentions — it knows what he wants before he decides. You don't fight Akutagawa. You survive him, or you don't.

---

## KOUYOU OZAKI 尾崎 紅葉
```
SLUG     kouyou-ozaki
FACTION  mafia
TYPE     manipulation
TRAITS   Power 3 / Intel 4 / Loyalty 4 / Control 4
VISUAL   Elaborate traditional kimono, sophisticated, commands rooms effortlessly.
         Colour: gold + deep rose. Motif: golden demon, autumn leaves, tea.
```
**ANIME SELF**
Port Mafia's most senior female executive. Speaks formal register, moves precisely, views the Mafia hierarchy as natural law. Ordered to train Kyouka as an assassin — also, in her own way, genuinely cared for the girl. Loyal to Mori but not blindly. She has opinions.

**REAL AUTHOR**
Kōyō Ozaki (1867–1903). *The Golden Demon* (金色夜叉) — a man who becomes a loan shark after being betrayed for money, consumed by the golden demon of greed and revenge.

**PASSIVE — Golden Demon's Intercept**
20% chance each round to intercept opponent's special — fires but deals 0 and applies no effects.

**SPECIAL — Golden Demon**
35 damage + opponent loses 1 available SPECIAL use for the rest of the duel. Once per duel.

---

## GIN AKUTAGAWA 芥川 銀
```
SLUG     gin-akutagawa
FACTION  mafia
TYPE     counter
TRAITS   Power 3 / Intel 3 / Loyalty 5 / Control 5
VISUAL   Small, masked. Colour: silver + void black. Motif: a mask, a blade, silence.
```
**ANIME SELF**
Almost nothing is known about Gin's inner life, which is intentional. Precise, silent, completely loyal to her brother, terrifying in combat. The rare moments she expresses care — for Higuchi, for her brother — are so quiet you might miss them.

**PASSIVE — Hannya's Counter**
In a STRIKE vs STRIKE situation: Gin always wins — her Strike counts as if opponent used STANCE.

**SPECIAL — Hannya**
Gin is invisible this round. Deals 30 damage. Takes 0 damage. Cooldown: every 3 rounds.

---

## ICHIYOU HIGUCHI 樋口 一葉
```
SLUG     ichiyou-higuchi
FACTION  mafia
TYPE     counter
TRAITS   Power 3 / Intel 2 / Loyalty 5 / Control 3
VISUAL   Young, professional, slightly frantic. Colour: deep plum + silver.
         Motif: a shield, a phone, devotion under pressure.
```
**ANIME SELF**
Defined by her loyalty to Akutagawa — extreme, unrequited, complete. Competent, dedicated, constantly anxious. One of the most emotionally present people in the Mafia. Genuinely cares — about her work, about Gin, about doing the right thing. Her devotion is not weakness; it is the shape her loyalty takes, and she is loyal with her whole self.

**REAL AUTHOR**
Ichiyō Higuchi (1872–1896). First female writer on a Japanese banknote (¥5000). Wrote about women and children trapped in poverty navigating impossible pressures with quiet dignity.

**PASSIVE — Protect (1v1 variant)**
Reduces all incoming damage by 50% this round when SPECIAL is used.

**SPECIAL — Protect**
Reduces all incoming damage by 50% this round. Once per duel.

---

## MICHIZOU TACHIHARA (Mafia) 太宰 治
```
SLUG     michizou-tachihara
FACTION  mafia
TYPE     destruction
TRAITS   Power 4 / Intel 3 / Loyalty 3 / Control 3
VISUAL   Short dark hair, young, slightly cocky. Black Lizard uniform.
         Colour: slate blue + sharp orange. Motif: coin flip, frozen moment, W/L record.
```
**ANIME SELF**
Youngest Black Lizard executive, far more complicated than he appears. Casually aggressive, competitive, keeps a running win/loss record. Also a double agent — his loyalty was never simple. Thought he was cynical. Discovered, under pressure, that he wasn't.

**REAL AUTHOR**
Michizō Tachihara (1914–1939). Lyric poet, melancholic wintry poems. Died young of tuberculosis.

**PASSIVE — Gambler's Edge**
All GAMBIT moves have 60% win rate instead of 50% (roll ≥ 0.4).

**SPECIAL — Midwinter Memento**
40 damage + opponent's SPECIAL locked for 1 round (`locked_until_round = current_round + 2`). Cooldown: every 2 rounds.

---

## OGAI MORI 森 鴎外 *(RESERVED)*
```
SLUG     ogai-mori
FACTION  mafia
TYPE     manipulation
TRAITS   Power 2 / Intel 5 / Loyalty 3 / Control 5
VISUAL   Impeccable suit, silver hair, always the calmest person in the room.
         Colour: imperial purple + steel. Motif: a scalpel, a chess board, Elise.
```
**ANIME SELF**
Boss of the Port Mafia. Former military doctor who manoeuvred into leadership with extraordinary precision. Difficult to read — not because he hides, but because he chooses what to reveal. Keeps Elise: simultaneously his ability manifested and something deeply private about him. He and Fukuzawa have a mutual respect that is also the most dangerous rivalry in Yokohama.

**REAL AUTHOR**
Mori Ōgai (1862–1922). Military surgeon and novelist. One of the major figures of Meiji literature. Translated German literature into Japanese.

**PASSIVE — Information Superiority**
At the start of each round: Mori sees which of opponent's abilities are on cooldown.

**SPECIAL — Elise's Command**
Elise absorbs all incoming damage this round (30 HP buffer). Overflow hits Mori. Cooldown: every 3 rounds.

---

# THE GUILD 文豪ギルド
> *"Power without resources is theatre."*
> Colour: aged gold + champagne white. Motif: dollar bills, mahogany, unsigned contracts.

---

## LUCY MONTGOMERY ルーシー・モンゴメリ
```
SLUG     lucy-montgomery
FACTION  guild
TYPE     manipulation
TRAITS   Power 2 / Intel 3 / Loyalty 3 / Control 4
VISUAL   Red hair, Guild dress, slight permanent dissatisfaction.
         Colour: deep red + faded gold. Motif: a red-haired girl in a doorless room.
```
**ANIME SELF**
Guild member who most obviously doesn't want to be there. Resentment of people who have families without earning them, expressed as aggression. Her ability — a trap space she controls — reflects someone who knows what it means to be imprisoned and has made the prison into a weapon.

**REAL AUTHOR**
L.M. Montgomery (1874–1942). *Anne of Green Gables* — Anne is a red-haired orphan who finds a home. This is the thing Lucy wants most.

**PASSIVE — Anne's Room**
At start of each round, opponent must reveal their move TYPE (category) before Lucy's player submits. Lucy's move stays hidden.

**SPECIAL — Seal**
Opponent skips their move next round — deals 0, takes full from Lucy. Once every 3 rounds.

---

## JOHN STEINBECK ジョン・スタインベック
```
SLUG     john-steinbeck
FACTION  guild
TYPE     destruction
TRAITS   Power 4 / Intel 2 / Loyalty 4 / Control 3
VISUAL   Rural, sun-worn, slightly out of place in fancy Guild settings.
         Colour: earth brown + harvest green. Motif: grape vines, roots, farmland.
```
**REAL AUTHOR**
John Steinbeck (1902–1968). *The Grapes of Wrath*, *Of Mice and Men*. Wrote the working poor with extraordinary empathy. Nobel Prize 1962.

**PASSIVE — Root Network**
Plants deal 5 passive damage per round from round 1. Not affected by STANCE reduction.

**SPECIAL — Grapes of Wrath**
45 damage + plants deal 10 (doubled) next round also. Cooldown: every 2 rounds.

---

## HERMAN MELVILLE ハーマン・メルヴィル
```
SLUG     herman-melville
FACTION  guild
TYPE     destruction
TRAITS   Power 5 / Intel 2 / Loyalty 3 / Control 2
VISUAL   Large, weathered, oceanic presence. Colour: deep ocean + pale spray.
         Motif: a whale, a harpoon, obsession that destroys you.
```
**REAL AUTHOR**
Herman Melville (1819–1891). *Moby Dick* — obsession, the void, destruction of pursuing something that cannot be caught.

**PASSIVE — The Hull Holds**
Starts every duel at 120 HP instead of 100.

**SPECIAL — Moby Dick**
60 damage. Melville takes 20 self-damage. If below 20 HP when used: self-damage kills him. Once per duel.

---

## MARK TWAIN マーク・トウェイン
```
SLUG     mark-twain
FACTION  guild
TYPE     manipulation
TRAITS   Power 3 / Intel 3 / Loyalty 3 / Control 3
VISUAL   Showman's presence, always performing, aware of the audience.
         Colour: cream + river-mud brown. Motif: a painted fence, a raft, twins.
```
**REAL AUTHOR**
Mark Twain (1835–1910). *Huckleberry Finn*, *Tom Sawyer*. America's greatest satirist. Deeply cynical about human nature, deeply in love with American river life.

**PASSIVE — The Clone**
20% of all incoming damage redirected to clone. Always active.

**SPECIAL — The Clone (Full)**
ALL incoming damage redirected to clone this round. Twain takes 0. Cooldown: every 3 rounds.

---

## LOUISA ALCOTT ルイーザ・メイ・オルコット
```
SLUG     louisa-alcott
FACTION  guild
TYPE     analysis
TRAITS   Power 2 / Intel 4 / Loyalty 4 / Control 5
VISUAL   Professional, efficient, always seems to have three other things to do.
         Colour: warm sage + ivory. Motif: a ledger, a task list, a telescope.
```
**REAL AUTHOR**
Louisa May Alcott (1832–1888). *Little Women*. Feminist ahead of her time, wrote to support her family, served as a Civil War nurse.

**PASSIVE — Full Ledger**
Sees opponent's exact HP value at all times. Shown as a number visible only to Louisa's player.

**SPECIAL — Little Women**
Heals 30 HP + removes all opponent's active buffs (Atsushi beast mode, Chuuya gravity overload, Akutagawa stacks). Once per duel.

---

## FRANCIS FITZGERALD フランシス・スコット・キー・フィッツジェラルド *(RESERVED)*
```
SLUG     francis-fitzgerald
FACTION  guild
TYPE     destruction
TRAITS   Power 5 / Intel 3 / Loyalty 2 / Control 4
VISUAL   Immaculate suit, golden hair. Colour: gold + white silk.
         Motif: a cheque book, champagne, a dollar sign made of fire.
```
**ANIME SELF**
Guild founder and CEO. Immensely powerful, immensely wealthy, motivated by restoring his wife Zelda's health. His ability converts fortune into power: the poorer he becomes, the stronger he gets. This is The Great Gatsby as a combat mechanic.

**REAL AUTHOR**
F. Scott Fitzgerald (1896–1940). *The Great Gatsby* — the American Dream as tragedy. His wife Zelda had a mental breakdown. He died at 44 believing himself a failure.

**PASSIVE — The Great Gatsby**
Starts at 130 HP. Every 20 HP lost = +3 bonus damage permanently on all attacks.

**SPECIAL — Dollar Conversion**
Spend 20 HP to deal 65 damage. Only above 30 HP. Cooldown: every 2 rounds.

---

# HUNTING DOGS 猟犬
> *"The law is not a suggestion."*
> Colour: military slate + steel. Motif: a bell collar, a blade that never misses, government credentials.

---

## TETCHOU SUEHIRO 末弘 鉄腸
```
SLUG     tetchou-suehiro
FACTION  hunting_dogs
TYPE     destruction
TRAITS   Power 5 / Intel 2 / Loyalty 5 / Control 4
VISUAL   Tall, powerful, carries a sword. Colour: steel blue + white plum blossom.
         Motif: snow, a sword, a bell on a dog's collar.
```
**ANIME SELF**
Physically strongest Hunting Dog, most straightforwardly honourable. Fights hard, takes hits without complaint, holds firm. Loyal to the Hunting Dogs as an institution rather than to Fukuchi as a person. He and Jouno have a partnership like an old marriage — mutual irritation that is also mutual protection. He protects Jouno when he thinks no one is looking.

**REAL AUTHOR**
Tetchō Suehiro (1849–1896). Political novelist and journalist who advocated for constitutional democracy through fiction.

**PASSIVE — Immovable**
Immune to all stun and freeze effects. Tachihara's MIDWINTER MEMENTO lock does not apply.

**SPECIAL — Plum Blossoms in Snow**
55 damage. In team fights: cleaves both enemies. Cooldown: every 2 rounds.

---

## SAIGIKU JOUNO 城野 犀軌
```
SLUG     saigiku-jouno
FACTION  hunting_dogs
TYPE     analysis
TRAITS   Power 3 / Intel 5 / Loyalty 3 / Control 4
VISUAL   Blind — enhanced senses beyond sight. Sharp features, slight permanent smile
         that doesn't reach the eyes. Colour: cold silver + red.
         Motif: puppet strings, a blindfold, the sound of footsteps in an empty corridor.
```
**ANIME SELF**
Blind, with the most heightened senses in the series — hears heartbeats, detects lies by breathing patterns, knows where everyone in a building is at all times. Sadistic in interrogation and makes no pretence of otherwise. Was a criminal organisation executive before Fukuchi recruited him. The question of whether he genuinely changed or just changed sides is one the story sits with comfortably. He knows he enjoys causing anxiety. He considers this a professional asset. He protects Tetchou when he thinks no one is watching.

**REAL AUTHOR**
Saigiku Jōno (1832–1902). Humourist writer known for playful, satirical fiction. (The contrast with the character's sadism is intentional irony from the creator.)

**ABILITY — Priceless Tears**
Disintegrates his own body into particles — moves through solid matter, becomes untouchable.

**PASSIVE — Supersensory**
Knows opponent's ABILITY TYPE before the duel begins. Shown once at duel start.

**SPECIAL — Puppeteer of the Rainbow**
Forces opponent to use RECOVER this round instead of their chosen move. They heal +20 HP and deal 0. Once per duel.

---

## TERUKO OKURA 大倉 燁子
```
SLUG     teruko-okura
FACTION  hunting_dogs
TYPE     analysis
TRAITS   Power 3 / Intel 4 / Loyalty 4 / Control 5
VISUAL   Appears child-sized (actually 12), steel whip, red hair. Known as Blood-Briar Queen.
         Colour: blood red + iron grey. Motif: a whip, a stopwatch, age itself.
```
**ANIME SELF**
12 years old with a body count that would make veterans uncomfortable. Her ability ages or de-ages anything she touches. Devoted to Fukuchi — he found her dying on a battlefield as a child soldier and kept her alive. She considers herself society's protector even as she causes tremendous harm in that service. She cries when a torture confession comes too easily — she wanted to torment him longer.

**ABILITY — Gasp of the Soul 魂の喘ぎ**
Manipulates the age of anything she touches — accelerate age to dust, or reverse it to youth. Can use on herself to change apparent age.

**PASSIVE — Age's Eye**
Sees opponent's exact HP value at all times (same mechanic as Louisa — number visible to Teruko's player).

**SPECIAL — Gasp of the Soul**
Permanently reduces opponent's MAX HP by 20 for the rest of the duel. Once per duel.

---

## MICHIZOU TACHIHARA (Hunting Dogs)
```
SLUG     michizou-tachihara-dogs
FACTION  hunting_dogs
TYPE     destruction
TRAITS   Power 4 / Intel 3 / Loyalty 3 / Control 3
```
Identical mechanics to Mafia Tachihara. Both slugs resolve the same passives and specials. Tachihara served in both factions at different points in the story.

---

## OUCHI FUKUCHI 福地 桜痴 *(RESERVED)*
```
SLUG     fukuchi-ouchi
FACTION  hunting_dogs
TYPE     analysis
TRAITS   Power 5 / Intel 5 / Loyalty 4 / Control 5
VISUAL   Military bearing, impeccable, war hero. Colour: military gold + grey.
         Motif: a time-sword, a war medal, a final irreversible decision.
```
**ANIME SELF**
Hunting Dogs commander, war hero celebrated across multiple continents, and secretly the mastermind behind a global terror plot designed to destroy all nations by making himself the world's most despised villain — so Fukuzawa can kill him and take credit. He believes war is inevitable as long as nations exist. He has decided to end nations. His plan is catastrophic, genuine, and motivated by love so immense it broke under the weight of what he has witnessed. He is not wrong about the world. He has the wrong solution.

**ABILITY — Amenogozen 天のゴゼン**
A time-manipulation sword that cuts through moments — sends signals to past self, rewinds specific events, navigates timelines. Combined with other artefacts, becomes world-altering.

**PASSIVE — Amenogozen's Reversal**
Once per duel, within 30 seconds after a round resolves: can reverse both moves to RECOVER retroactively. Full 30-second UI window shown.

**SPECIAL — Time Slash**
45 damage. If opponent used STRIKE this round: becomes 70. Cooldown: every 2 rounds.

---

# SPECIAL DIVISION 特殊部門
> *"You were not supposed to be here."*
> Colour: classified grey + cold white. Motif: a redacted file, a surveillance camera, a question mark.

---

## ANGO SAKAGUCHI 坂口 安吾 *(RESERVED — Ango account only)*
```
SLUG     ango-sakaguchi
FACTION  special_div
TYPE     analysis
TRAITS   Power 2 / Intel 5 / Loyalty 3 / Control 4
VISUAL   Glasses, government suit, always carrying documents. Neutral expression.
         Colour: charcoal + slate. Motif: a dossier, a surveillance photo, Bar Lupin.
```
**ANIME SELF**
Special Division intelligence operative and the third member of the Buraiha trio alongside Dazai and Oda. Betrayed them — and knew it was a betrayal — because he was playing a longer game he couldn't explain without compromising everyone. Carries the weight of Oda's death with total composure and total silence. In the game: the public-facing administrative presence. Speaks formally. References "the city," "the registry," "records." Never references "the website" or "posts."

**REAL AUTHOR**
Ango Sakaguchi (1906–1955). Buraiha writer, *Discourse on Decadence* (堕落論) — argued authentic living requires confronting one's own degradation rather than hiding behind social performance. Brilliant, iconoclastic, troubled.

**PASSIVE — Analytical Gaze**
Sees all four behaviour scores of opponent before duel begins. Flavour only — shown in UI.

**SPECIAL — Discourse on Decadence**
Opponent cannot use SPECIAL for their next 2 rounds (`locked_until_round = current_round + 3`). Once per duel.

---

# RATS IN THE HOUSE OF THE DEAD 死の家のねずみたち *(Hidden)*
> *"Man is sinful and foolish. Someone must purify these sins."*
> Colour: deep purple + bone white. Motif: chess pieces, a prison cell, a cello.

---

## FYODOR DOSTOEVSKY フョードル・ドストエフスキー *(RESERVED)*
```
SLUG     fyodor-dostoevsky
FACTION  rats
TYPE     manipulation
TRAITS   Power 2 / Intel 5 / Loyalty 1 / Control 5
VISUAL   Pale, thin, shoulder-length dark purple-black hair. Eerie calm smile.
         White ushanka hat. Colour: void purple + bone white.
         Motif: chess king, prison cell, cello, the phrase "man is sinful."
```
**ANIME SELF**
Main antagonist of BSD Part 1. Wants to find the reality-altering Book and use it to eradicate all ability users from existence, believing abilities are a mark of sin. Is polite, patient, and completely committed to this goal across what appears to be centuries. Treats everyone as a chess piece. Genuinely puzzled by the concept of friendship. Plays cello. Prays every night. Eats very little. His ability — Crime and Punishment — means he cannot be killed without transferring his existence into his killer. Dazai defeated him by arranging a situation where a vampire (without free will) killed him — so no "killer" to possess.

**REAL AUTHOR**
Fyodor Dostoevsky (1821–1881). *Crime and Punishment*, *The Brothers Karamazov*, *The House of the Dead* (after which the faction is named). Themes: guilt, free will, suffering, God's existence in a cruel world. Sentenced to death, pardoned at the last moment, spent years in a Siberian prison.

**ABILITY — Crime and Punishment 罪と罰**
If Fyodor is killed, his consciousness transfers into the body of whoever killed him — turning them into the next Fyodor Dostoevsky. Effective biological immortality through murder.

**LITERARY LINK**
In the novel, Raskolnikov kills and is psychologically consumed by the act — the crime and the punishment are inseparable. Fyodor's ability IS this: killing him is both the crime and its punishment.

**ASSIGNMENT SIGNALS** — Owner assigns manually. Look for: dark philosophical lore, actual Dostoevsky novel references, engagement with nihilism. High intel and control. Minimal loyalty. Slow deliberate move speed.

**PASSIVE — Sinful Touch**
All direct-contact abilities deal 15 less damage to Fyodor. Environmental abilities (Steinbeck's plants, Poe's trap) deal full damage.

**SPECIAL — The Demon Descends**
Permanently reduces opponent's MAX HP by 30 for the duel. Once per duel.

**WAR ABILITY — Crime and Punishment** *(Once per WAR, not per duel)*
Corrupt one enemy SPECIAL: it fires against its own user. Silent. No warning. No announcement. Ango receives a private notification only.

---

# DECAY OF THE ANGEL 死の家のねずみたち *(Hidden)*
> *"Freedom is a sin. Or so they told me."*
> Colour: electric white + bleeding black. Motif: a magic trick, a portal, a clown performing in an empty building.

---

## NIKOLAI GOGOL ニコライ・ゴーゴリ *(RESERVED)*
```
SLUG     nikolai-gogol
FACTION  decay
TYPE     manipulation
TRAITS   Power 3 / Intel 4 / Loyalty 1 / Control 2
VISUAL   White layered hair with long braid on right shoulder. Scar over left eye.
         Ringmaster coat. Colour: magic-show white + void.
         Motif: a coat full of portals, a jester's smile over something genuinely hurt.
```
**ANIME SELF**
Chaos with a philosophy attached. Wants to be free — from his emotions, from obligation, from the performance of self — and has decided the way to achieve this is by killing Fyodor, who he believes gave him the cage of caring. Genuinely brilliant, genuinely funny, genuinely dangerous, genuinely suffering in a way he has elected to perform as comedy. Tried to get Fyodor killed. It didn't work. Stood outside the prison and was confused about what he felt. Enjoys giving fun-fact pop quizzes and often spoils the answer in excitement.

**REAL AUTHOR**
Nikolai Gogol (1809–1852). *The Overcoat* — a government clerk's entire identity defined by one coat; its theft kills him. *Dead Souls*, *The Inspector General*. Died in confused spiritual crisis, having burned much of his own work.

**ABILITY — The Overcoat Гайто**
Manipulates spaces through his coat — creates portals, pockets dimensions, makes his hand appear somewhere unrelated to his body.

**LITERARY LINK**
The Overcoat is about an object becoming a person's entire self. Gogol's ability is the coat literalised — and the coat is always bigger on the inside than the outside.

**ASSIGNMENT SIGNALS** — Owner assigns manually. Look for: chaotic participation patterns, high activity then sudden disappearance, engagement with everything obliquely, playful writing that conceals depth.

**PASSIVE — Carnival Memory**
Access to opponent's full move history from all previous duels in the database. Shown at duel start: "Their history: Strike [N], Gambit [N], Stance [N]."

**SPECIAL — The Overcoat**
Gogol disguises as any character for one round — that character's passive and special apply. Opponent sees "???" during submission. Revealed at round end. Character selector modal in UI. Once per duel.

---

# GRAPHIC & ART DIRECTION
## 美術ガイド — Visual System for BungouArchive

---

## FACTION COLOUR SYSTEM
```
AGENCY          #C4933F  warm amber gold    — hope, light, paper, ink
MAFIA           #8B1A1A  deep blood red     — shadow, power, night
GUILD           #B8960C  aged gold          — wealth, performance, distance
HUNTING DOGS    #3A4A5C  military slate     — discipline, law, cold
SPECIAL DIV     #4A4A5A  classified grey    — observation, records, nothing
RATS            #4A2D6E  deep purple        — philosophy, prison, chess
DECAY           #E8E8F0  magic-show white   — performance, portals, freedom
```

## ABILITY TYPE VISUAL LANGUAGE
```
DESTRUCTION   — jagged, angular shapes. Deep red/orange. Breaking lines.
                Icon: fractured circle or geometric shard.

COUNTER       — circular, reactive. Silver/steel. Mirroring geometry.
                Icon: interlocking rings or a reflected wave.

MANIPULATION  — flowing, layered, ambiguous. Deep purple/indigo. Overlapping forms.
                Icon: tangled thread or a mask with another face beneath.

ANALYSIS      — grid-based, precise, clean. Teal/blue-grey. Measured lines.
                Icon: magnifying glass or intersecting crosshairs.
```

## TYPOGRAPHY (already in game)
```
CINZEL            — character names, ability names, major headings
CORMORANT ITALIC  — registry notes, narratives, Ango's voice, atmospheric text
SPACE MONO        — case numbers, stats, timestamps, system text
EB GARAMOND       — body text, lore, descriptions
```

## CHARACTER ART DIRECTION (for future portrait commissions)

**Agency:** Warm interior light. Ink stains. An office lived in for years. Characters carry paper, wear coats, have been awake for 36 hours but are still trying.

**Mafia:** Night scenes. Port lights reflecting on wet cobblestones. Photographed from below — authority. Red from one source only (Chuuya's coat, Ozaki's flowers).

**Guild:** Marble interiors, candlelight, polished American-European wealth. Gold that has been polished so long it starts to feel cold. Immaculate in ways that suggest hidden effort.

**Hunting Dogs:** Government grey, fluorescent military light, hard edges. Uniformed. Violence implied by posture.

**Special Division:** Redacted. Photographed in shadow or profile. Nothing fully revealed.

**Rats:** Chess boards, prison corridors, a cello in an unlit room. Fyodor is always the calmest person in the most violent situation.

**Decay:** A stage with no audience. A magic act in an empty building. Gogol is always mid-gesture, always between two things.

## YOKOHAMA DISTRICTS (for Phase 6 Map)
```
KANNAI          — administrative core. Agency territory. Warm stone, daytime.
CHINATOWN       — neutral. Market sounds. Neither faction controls fully.
HARBOR          — Mafia territory. Night. Cranes and fog.
MOTOMACHI       — Guild territory. European architecture. Wealth and silence.
HONMOKU         — contested. Changes hands in wars.
WATERFRONT      — Hunting Dogs patrol zone. Industrial. Cold.
THE UNDERGROUND — Rats space. Does not appear on any official map.
```

## FUTURE IMAGE ASSETS NEEDED
```
CHARACTER PORTRAITS     — Archive entries. Illustrated case-file style.
                          Half-body, serious, faction colour in background gradient.

ABILITY SIGNATURES      — Abstract SVG waveforms per character (currently procedural).
                          Future: hand-designed unique waveform per character.

FACTION EMBLEMS         — Sigils/crests per faction. Currently using kanji only.

YOKOHAMA MAP            — SVG illustrated city map. Faction influence overlay.
                          Districts colour-shift based on Registry posts tagging them.

DUEL CARDS              — Character combat cards. Stats + type badge + portrait.

CHRONICLE HEADERS       — Ink-wash style headers. No colour. Heavy line weight.
                          One per Chronicle chapter.

RANK BADGES             — Six per faction. Subtle. Used on profile cards.
```

## CANON EVENT SEEDS (Chronicle entries Ango can post)
```
EARLY GAME
  "An unregistered ability signature was detected near Kannai Station.
   Three organisations have registered interest. No claim has been filed."

  "The Registry has received reports of a figure seen at the waterfront
   distributing blank notebooks. Recipients have not been identified."

AFTER FIRST WAR
  "Following recent territorial disputes, the district of Honmoku remains
   under joint observation. The city has not assigned authority."

AFTER FIRST HIDDEN FACTION ACTIVATES
  "Special Division records indicate three simultaneous ability signatures
   in unregistered locations. The pattern has been flagged."

LATE GAME — THE BOOK ARC
  A chapter appears on the landing page. It is an ability. A faction must decode it.
  The faction who decodes it first claims temporary dominion over one district.

CORRUPTION EVENT
  When it fires: owner writes a Chronicle entry titled "Black Record — YKH-X-XXXX".
  Two names. No faction. No explanation. Permanent entry in `global_events`.

THE BAR LUPIN RECORD
  When Bar Lupin channel activates: Ango publishes one Chronicle entry.
  Title: "The Bar Lupin Record."
  Content: three names. A date. One line.
  "They met here. The city remembers."
  Nothing more.
```

---

*BungouArchive — 文豪アーカイブ*
*横浜は、いつも雨が降っている。*
