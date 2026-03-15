export const ABILITY_TYPE_LABELS = {
  destruction: 'Destruction',
  counter: 'Counter',
  manipulation: 'Manipulation',
  analysis: 'Analysis',
} as const

export type AbilityType = keyof typeof ABILITY_TYPE_LABELS

export const ABILITY_TYPE_COLORS: Record<AbilityType, string> = {
  destruction: 'var(--color-mafia)',
  counter: 'var(--color-dogs)',
  manipulation: 'var(--color-guild)',
  analysis: 'var(--color-agency)',
}

export const ABILITY_TYPE_DESC: Record<AbilityType, string> = {
  destruction: 'Overwhelming force, impact-first tactics, and direct pressure.',
  counter: 'Reactive defense, denial, and reversal once an opponent commits.',
  manipulation: 'Control through positioning, conditions, and battlefield pressure.',
  analysis: 'Pattern recognition, information leverage, and precise judgment.',
}

export const CHARACTER_ABILITY_TYPES: Record<string, AbilityType> = {
  'nakajima-atsushi': 'destruction',
  'dazai-osamu': 'counter',
  'kunikida-doppo': 'analysis',
  'ranpo-edogawa': 'analysis',
  'akiko-yosano': 'counter',
  'junichiro-tanizaki': 'manipulation',
  'naomi-tanizaki': 'manipulation',
  'kyouka-izumi': 'destruction',
  'kenji-miyazawa': 'destruction',
  'fukuzawa-yukichi': 'analysis',
  'edgar-allan-poe': 'analysis',
  'nakahara-chuuya': 'destruction',
  'akutagawa-ryunosuke': 'destruction',
  'mori-ogai': 'analysis',
  'ozaki-kouyou': 'manipulation',
  'gin-akutagawa': 'counter',
  'higuchi-ichiyo': 'counter',
  'tachihara-michizou': 'destruction',
  fitzgerald: 'manipulation',
  'lucy-montgomery': 'manipulation',
  'john-steinbeck': 'destruction',
  'herman-melville': 'destruction',
  'mark-twain': 'manipulation',
  'louisa-may-alcott': 'analysis',
  'teruko-okura': 'analysis',
  'tetchou-suehiro': 'destruction',
  'jouno-saigiku': 'analysis',
  'fukuchi-ouchi': 'destruction',
  'ango-sakaguchi': 'analysis',
  'minoura-motoji': 'analysis',
  'taneda-santoka': 'analysis',
  'fyodor-dostoevsky': 'analysis',
  'alexander-pushkin': 'manipulation',
  'ivan-goncharov': 'destruction',
  'nikolai-gogol': 'manipulation',
  sigma: 'analysis',
  'bram-stoker': 'destruction',
  'agatha-christie': 'analysis',
  'rudyard-kipling': 'manipulation',
  'oscar-wilde': 'manipulation',
  clock_tower: 'manipulation',
}

export const CHARACTER_ABILITY_NAMES: Record<string, string> = {
  'nakajima-atsushi': 'Beast Beneath the Moonlight',
  'dazai-osamu': 'No Longer Human',
  'kunikida-doppo': 'Lone Poet',
  'ranpo-edogawa': 'Ultra-Deduction',
  'akiko-yosano': 'Thou Shalt Not Die',
  'junichiro-tanizaki': 'Light Snow',
  'naomi-tanizaki': 'Classified Ability',
  'kyouka-izumi': 'Demon Snow',
  'kenji-miyazawa': 'Undefeated by the Rain',
  'fukuzawa-yukichi': 'All Men Are Equal',
  'edgar-allan-poe': 'Black Cat in the Rue Morgue',
  'nakahara-chuuya': 'For the Tainted Sorrow',
  'akutagawa-ryunosuke': 'Rashomon',
  'mori-ogai': 'Vita Sexualis',
  'ozaki-kouyou': 'Golden Demon',
  'gin-akutagawa': 'Classified Ability',
  'higuchi-ichiyo': 'Classified Ability',
  'tachihara-michizou': 'Midwinter Memento',
  fitzgerald: 'The Great Fitzgerald',
  'lucy-montgomery': 'Anne of Abyssal Red',
  'john-steinbeck': 'The Grapes of Wrath',
  'herman-melville': 'Moby-Dick',
  'mark-twain': 'Huckleberry Finn and Tom Sawyer',
  'louisa-may-alcott': 'Little Women',
  'teruko-okura': 'Classified Ability',
  'tetchou-suehiro': 'Plum Blossoms in Snow',
  'jouno-saigiku': 'Priceless Tears',
  'fukuchi-ouchi': 'Mirror Lion',
  'ango-sakaguchi': 'Discourse on Decadence',
  'fyodor-dostoevsky': 'Crime and Punishment',
  'nikolai-gogol': 'The Overcoat',
  sigma: 'Information Exchange',
  'bram-stoker': 'Dracula',
  'agatha-christie': 'And Then There Were None',
  'rudyard-kipling': 'The Jungle Book',
  'oscar-wilde': 'The Picture of Dorian Gray',
}

export function getAbilityTypeForCharacter(
  characterSlug: string | null | undefined,
): AbilityType | null {
  if (!characterSlug) {
    return null
  }

  return CHARACTER_ABILITY_TYPES[characterSlug] ?? null
}
