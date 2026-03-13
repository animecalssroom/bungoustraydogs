export type DuelCharacterRule = {
  slug: string
  abilityType: 'destruction' | 'counter' | 'manipulation' | 'analysis'
  passive: string
  special: string
}

export const DUEL_CHARACTER_RULES: DuelCharacterRule[] = [
  { slug: 'atsushi-nakajima', abilityType: 'destruction', passive: 'Below 30 HP, Atsushi enters beast mode and his later damage surges for the rest of the duel.', special: 'Beast Beneath Moonlight deals a guaranteed heavy strike, but only when he is already cornered below 30 HP.' },
  { slug: 'osamu-dazai', abilityType: 'counter', passive: 'Dazai nullifies hostile ability effects and forces opponents back onto base combat where possible.', special: 'No Longer Human blanks the opponent special for the round; it is especially reliable against Akutagawa.' },
  { slug: 'doppo-kunikida', abilityType: 'analysis', passive: 'Every Strike from Kunikida carries extra damage through sheer method and precision.', special: 'Ideal Notebook negates all incoming damage for the round once per duel.' },
  { slug: 'ranpo-edogawa', abilityType: 'analysis', passive: 'Ranpo can read the shape of a round and gain direct insight into the opponent move pattern.', special: 'Super Deduction strips the opponent move of all effect for the round, once per duel.' },
  { slug: 'akiko-yosano', abilityType: 'counter', passive: 'At critical health Yosano drags herself back to fighting condition, restoring to 50 HP once.', special: 'Thou Shalt Not Die resets her to 50 HP on demand, once per duel.' },
  { slug: 'junichirou-tanizaki', abilityType: 'manipulation', passive: 'Tanizaki turns Stance into near-disappearance, reducing incoming damage harder than normal defense.', special: 'Light Snow makes him untargetable for the round, but he also deals no damage while hidden.' },
  { slug: 'kyouka-izumi', abilityType: 'destruction', passive: 'Kyouka shaves damage off nearly every hit that reaches her.', special: 'Demon Snow cuts through defenses and ignores ordinary mitigation.' },
  { slug: 'kenji-miyazawa', abilityType: 'destruction', passive: 'Below 20 HP, Kenji becomes completely immune to incoming damage.', special: 'Undefeated by Rain absorbs the whole round and reflects part of that force back once per duel.' },
  { slug: 'edgar-allan-poe', abilityType: 'manipulation', passive: 'Repeated habits feed Poe; if the opponent repeats moves, his trap logic turns against them.', special: 'Black Cat arms a delayed trap that detonates on the following round.' },
  { slug: 'chuuya-nakahara', abilityType: 'destruction', passive: 'Below 40 HP, Chuuya enters gravity overload: he hits harder, but every hit on him also deepens.', special: 'Upon the Tainted Sorrow lands brutal damage and ignores ordinary defense.' },
  { slug: 'ryunosuke-akutagawa', abilityType: 'destruction', passive: 'If Akutagawa withholds Special, pressure builds and later Strikes gain stacking brutality.', special: 'Rashomon tears through Stance and lands as direct force.' },
  { slug: 'kouyou-ozaki', abilityType: 'manipulation', passive: 'Kouyou has a chance to intercept an incoming special at the start of resolution and leave it empty.', special: 'Golden Demon strikes hard and reduces the opponent remaining special resources for the rest of the duel.' },
  { slug: 'gin-akutagawa', abilityType: 'counter', passive: 'In Strike versus Strike, Gin turns the clash in her favor as if the opponent overcommitted into her counterline.', special: 'Hannya makes Gin vanish for the round, dealing damage while taking none.' },
  { slug: 'ichiyou-higuchi', abilityType: 'counter', passive: 'Higuchi is built for team cover; in duels her passive stays mostly dormant.', special: 'Protect halves incoming damage in a duel, once per fight.' },
  { slug: 'michizou-tachihara', abilityType: 'destruction', passive: 'Tachihara wins Gambits more often than most fighters and thrives on reckless momentum.', special: 'Midwinter Memento hits hard and freezes the opponent Special for a later round.' },
  { slug: 'michizou-tachihara-dogs', abilityType: 'destruction', passive: 'Hunting Dogs Tachihara carries the same enhanced Gambit pressure as his Mafia counterpart.', special: 'Midwinter Memento hits hard and freezes the opponent Special for a later round.' },
  { slug: 'lucy-montgomery', abilityType: 'manipulation', passive: 'Lucy extracts advance knowledge of the opponent move category and fights around revealed intent.', special: "Anne's Room erases the opponent next move once the room closes around them." },
  { slug: 'john-steinbeck', abilityType: 'destruction', passive: "Steinbeck's plants deal steady passive damage from round to round.", special: 'Grapes of Wrath hits heavy and intensifies the next plant cycle.' },
  { slug: 'herman-melville', abilityType: 'destruction', passive: 'Melville opens with expanded maximum HP before the duel even settles.', special: 'Moby Dick lands catastrophic damage at the cost of self-harm.' },
  { slug: 'mark-twain', abilityType: 'manipulation', passive: "Mark's clone bleeds off a portion of incoming damage every round.", special: "Huck and Tom redirects the whole round's incoming damage into the clone." },
  { slug: 'louisa-alcott', abilityType: 'analysis', passive: 'Louisa can read exact enemy HP and fights on cleaner information than most.', special: 'Little Women heals her and strips active buffs from the opponent once per duel.' },
  { slug: 'tetchou-suehiro', abilityType: 'destruction', passive: 'Tetchou ignores most stun or freeze interference and keeps his attack line intact.', special: 'Plum Blossoms in Snow is a direct overwhelming cut built to end exchanges fast.' },
  { slug: 'saigiku-jouno', abilityType: 'analysis', passive: 'Jouno opens the duel already knowing the opponent ability type.', special: 'Puppeteer forces the opponent off their choice and into Recover once per duel.' },
  { slug: 'teruko-okura', abilityType: 'analysis', passive: 'Teruko reads exact HP totals and presses the duel like a controlled autopsy.', special: 'Gasp of Soul permanently lowers the opponent maximum HP for the rest of the duel.' },
  { slug: 'ango-sakaguchi', abilityType: 'analysis', passive: 'Ango sees the opponent behavior profile before the duel begins, though the advantage is mostly informational.', special: 'Discourse on Decadence seals the opponent Special for their next two rounds.' },
  { slug: 'yukichi-fukuzawa', abilityType: 'counter', passive: 'Fukuzawa shrugs off debuffs, freezes, and max-HP reduction entirely.', special: 'Agency Directive lands precise damage that ignores ordinary defense.' },
  { slug: 'ogai-mori', abilityType: 'manipulation', passive: 'Mori reads the opponent cooldown state at the start of the round.', special: "Elise's Command creates a limited shield body that absorbs the first 30 damage of the round." },
  { slug: 'francis-fitzgerald', abilityType: 'destruction', passive: 'Fitzgerald converts lost HP into rising offensive output the longer the duel drags on.', special: 'Dollar Conversion spends his own HP to land a devastating blow.' },
  { slug: 'fukuchi-ouchi', abilityType: 'analysis', passive: 'Fukuchi can reverse a round into Recover shortly after resolution, but only once per duel.', special: 'Time Slash becomes much deadlier if it catches a Strike head-on.' },
  { slug: 'fyodor-dostoevsky', abilityType: 'manipulation', passive: 'Fyodor reduces damage from direct-contact attacks, forcing opponents onto cleaner attrition.', special: 'The Demon Descends permanently carves away the opponent maximum HP.' },
  { slug: 'nikolai-gogol', abilityType: 'manipulation', passive: 'Gogol studies an opponent full duel history and thrives on destabilizing known patterns.', special: 'The Overcoat lets him borrow another character rule set for a single round.' },
  { slug: 'sakunosuke-oda', abilityType: 'counter', passive: 'Oda restores a little HP after rounds where he takes the worse exchange.', special: 'Flare sacrifices the present attack to guarantee a clean read on the next move type.' },
]

export function getDuelCharacterRule(slug: string | null | undefined) {
  return DUEL_CHARACTER_RULES.find((entry) => entry.slug === slug) ?? null
}
