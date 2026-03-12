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
}

export function getAbilityTypeForCharacter(
  characterSlug: string | null | undefined,
): AbilityType | null {
  if (!characterSlug) {
    return null
  }

  return CHARACTER_ABILITY_TYPES[characterSlug] ?? null
}
