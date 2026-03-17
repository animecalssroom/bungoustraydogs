-- Migration: Global Content Enrichment
-- Date: 2026-03-17
-- Enriching major characters with deep lore and technical analysis

-- 1. Atsushi Nakajima
UPDATE archive_entries SET
    designation = 'The Man-Tiger / The Guided Soul',
    clearance_level = 'Level 1 (Active Asset)',
    ability_analysis = 'Metamorphosis into a white tiger of legendary proportions. The transformation grants inhuman strength, speed, and a high-speed regenerative factor capable of regrowing limbs in seconds. Interestingly, the tiger''s claws can "cut" through the concept of abilities themselves.',
    lore_background = 'Orphaned and cast out, Atsushi was found by Dazai and recruited into the Agency. He represents the city''s hope for redemption. His value to the city exceeds even his own understanding, as he remains the primary target for several international organizations.',
    physical_evidence = ARRAY[
      'A torn orphanage identification tag: Found in the Suribachi district.',
      'A single white tiger whisker: Retrieved after the "Guild War" conflict.',
      'A small, hand-painted wooden figurine: Gift from Kyouka.'
    ],
    narrative_hook = 'The city didn''t give him a choice, but it gave him a purpose. To save others so he can finally save himself.',
    registry_note = 'The Subject responds strongest to the preservation of life. Combat data indicates a 40% increase in output when protecting non-combatants.'
WHERE slug = 'nakajima-atsushi';

-- 2. Osamu Dazai
UPDATE archive_entries SET
    designation = 'The Anti-Ability Paradox / Former Executive',
    clearance_level = 'Level 5 (Classified / Redacted)',
    ability_analysis = 'Absolute nullification of any supernatural manifestation upon physical contact. The ability operates on a constant, passive frequency, making it impossible for any "gift" to affect him directly, even those meant to heal.',
    lore_background = 'A man whose past remains a series of redacted entries. Formerly the youngest executive in Port Mafia history, he now serves as the tactical heart of the Agency. His playful exterior hides a mind that calculates every possible outcome of a conflict before it even begins.',
    physical_evidence = ARRAY[
      'Battered copy of "A Comprehensive Guide to Suicide": Heavily annotated.',
      'Antique handcuffs: Confiscated from a Port Mafia holding cell.',
      'A pack of discarded bandages: Found at the Lupin Bar, dated 4 years ago.'
    ],
    narrative_hook = 'Yokohama''s shadow doesn''t fear the light; it fears the man who can turn the light off.',
    registry_note = 'Subject is strictly prohibited from entering any high-density ability storage facilities. His mere presence causes systemic frequency collapse.'
WHERE slug = 'dazai-osamu';

-- 3. Ryunosuke Akutagawa
UPDATE archive_entries SET
    designation = 'The Silent Mad Dog / Hell''s Sentinel',
    clearance_level = 'Level 4 (High Lethality)',
    ability_analysis = 'Rashomon. His coat transforms into a multi-dimensional predator that can devour space itself. It is capable of both absolute defense (by eating the space between him and an attack) and absolute offense (piercing any known armor).',
    lore_background = 'Raised in the slums, he was molded by Dazai into a weapon of pure destruction. He seeks only one thing: validation from his mentor. His cough is a constant reminder of the physical toll his ability takes on his body.',
    physical_evidence = ARRAY[
      'A tattered black cravat: Retained from his early days in the slums.',
      'A blood-stained medical report: REDACTED - Pulmonary complications noted.',
      'A cracked tea cup: Recovered from a high-stakes meeting at the Port.'
    ],
    narrative_hook = 'He is the storm that moves through the city''s veins, leaving only silence in his wake.',
    registry_note = 'Extreme caution advised. Subject does not recognize surrender. If engagement is necessary, prioritize psychological displacement.'
WHERE slug = 'akutagawa-ryunosuke';

-- 4. Chuuya Nakahara
UPDATE archive_entries SET
    designation = 'The Vessel of Gravity / Arahabaki',
    clearance_level = 'Level 4 (Mafia Executive)',
    ability_analysis = 'Control over the gravitons of anything he touches. He can increase his own weight to crush buildings or nullify gravity to fly at supersonic speeds. His "Corruption" state is a theoretical catastrophic event where he releases the full, unbridled power of a god.',
    lore_background = 'A former leader of the ''Sheep'' gang who was brought into the Mafia during the "Dragon''s Head Conflict." Despite his small stature, he is arguably the city''s most formidable physical combatant. He operates with a code of honor that is rare in the criminal underworld.',
    physical_evidence = ARRAY[
      'A custom-made fedora: Specifically weighted for high-gravity combat.',
      'A bottle of 1 wine: 1974 Petrus (empty).',
      'A set of reinforced leather gloves: Heavily worn from combat.'
    ],
    narrative_hook = 'You don''t fight the man. You fight the gravity of the choices he''s made.',
    registry_note = 'Avoid close-quarters combat at all costs. If Subject activates "Corruption", immediate evacuation of the surrounding 5km radius is mandated.'
WHERE slug = 'nakahara-chuuya';

-- 5. Ranpo Edogawa
UPDATE archive_entries SET
    designation = 'The World''s Greatest Detective',
    clearance_level = 'Level 5 (Special Advisor)',
    ability_analysis = 'A cognitive faculty so refined it mimics high-level supernatural analysis. Though he claims it is an ability triggered by his glasses, the Registry has confirmed he possesses no ability signature. He is simply... humanly impossible.',
    lore_background = 'The man who keeps the peace by solving what others cannot even see. He is the reason the Armed Detective Agency exists. Without him, the city''s complex criminal webs would have collapsed into chaos years ago.',
    physical_evidence = ARRAY[
      'A pair of black-rimmed glasses: Simple, non-optical lenses.',
      'A variety of high-sugar candy wrappers: Discarded during investigative sessions.',
      'A marble from an "Alexander" mineral bottle.'
    ],
    narrative_hook = 'He doesn''t look for clues. He looks for the reality that the rest of us are too slow to observe.',
    registry_note = 'Do not attempt to lie to this file. It is inefficient and frankly embarrassing for all parties.'
WHERE slug = 'ranpo-edogawa';
