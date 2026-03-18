import type { BSDTheme, FactionId } from '@/backend/types'
import {
  AXIS_LABELS,
  CHARACTER_ASSIGNMENT_POOL,
  FACTION_ASSIGNMENT_META,
  type AssignmentCharacter,
  type TraitAxis,
} from '@/frontend/lib/bsd-character-update'

export type HomeCharacterFilter = 'all' | FactionId | 'lore'

export interface HomeThemeContent {
  heroKanji: string
  label: string
  quote: string
  attr: string
}

export interface HomeFactionCard {
  id: FactionId
  name: string
  nameJp: string
  kanji: string
  color: string
  status: string
  rank: string
  apDisplay: string
  memberDisplay: string
  barPercent: number
  description: string
  theme: BSDTheme
  joinable: boolean
  philosophy: string
  rankTitle: string
}

export interface HomeCharacterCard {
  slug: string
  name: string
  nameJp: string
  ability: string
  abilityJp: string
  faction: FactionId
  filter: Exclude<HomeCharacterFilter, 'all'>
  factionBadge: string
  accentColor: string
  summary: string
  quote: string
  authorNote: string
  symbol: string
  abilityType: 'Destruction' | 'Counter' | 'Support' | 'Special' | 'Defense'
  stats: {
    power: number
    intel: number
    loyalty: number
    control: number
  }
}

export interface HomeLorePost {
  slug: string
  category: string
  title: string
  excerpt: string
  meta: string
  featured?: boolean
}


const traitPhrase: Record<
  TraitAxis,
  {
    high: string
    low: string
  }
> = {
  justice: {
    high: 'principle-first',
    low: 'outcome-driven',
  },
  power: {
    high: 'overwhelming',
    low: 'surgical',
  },
  social: {
    high: 'group-defining',
    low: 'solitary',
  },
  emotion: {
    high: 'emotion-led',
    low: 'cold-blooded',
  },
  world: {
    high: 'protective',
    low: 'unsentimental',
  },
  identity: {
    high: 'self-reinventing',
    low: 'past-bound',
  },
  method: {
    high: 'calculated',
    low: 'immediate',
  },
  loyalty: {
    high: 'deeply loyal',
    low: 'self-directed',
  },
}

const factionPhilosophies: Record<FactionId, string> = {
  agency:
    'The Agency exists because some cases are too violent for police, too human for military. They occupy a space that shouldn\'t exist and do so with extraordinary conviction to protect the city\'s vulnerable.',
  mafia:
    'The Mafia maintains Yokohama\'s order by being the most organised expression of its darkness. They do not pretend to be righteous, for they are the reason the city is alive: they control what others cannot.',
  guild:
    'The Guild treats influence like capital and strategy like art. Resources enable everything else — they do not fight for honor, they invest in outcomes.',
  hunting_dogs:
    'The enforcement of law is not a matter of preference, but of duty. Surgeons of justice, they are the blade that makes the framework of society real.',
  special_div:
    'Special Division is not a faction, but an observer. They are the city\'s official memory, recording the supernatural cost of existence without taking a side.',
  rats: ' Fyodor believes abilities are a mark of sin. The Rats seek to purify humanity through a controlled collapse of the current ability-saturated reality.',
  decay: 'Chaos practitioners who move obliquely, the Decay frame their actions as theater and sabotage, watching the city\'s reaction from within the wreckage.',
  clock_tower: 'An overseas aristocray of power that recognizes only long-standing consistency. They are the foundation upon which the global ability community is built.',
}

const factionDescriptions: Record<FactionId, string> = {
  agency:
    'Justice is not handed to you. You build it, case by case, with what little you have.',
  mafia:
    'Power is the only language Yokohama understands. The Port Mafia speaks it fluently.',
  guild:
    'The Guild treats influence like capital and strategy like art.',
  hunting_dogs:
    'The military does not question its orders. It executes them.',
  special_div:
    'Between the law and the lawless, someone still has to keep the file open.',
  rats:
    'A sealed theological file tied to extermination, guilt, and controlled collapse.',
  decay:
    'A destabilizing registry signature marked for catastrophe, theater, and sabotage.',
  clock_tower:
    'An overseas file where aristocratic control and long-range planning override sentiment.',
}

const factionLabels: Record<FactionId, string> = {
  agency: 'Armed Detective Agency',
  mafia: 'Port Mafia',
  guild: 'The Guild',
  hunting_dogs: 'Hunting Dogs',
  special_div: 'Special Division',
  rats: 'Rats · Lore Faction',
  decay: 'Decay · Lore Faction',
  clock_tower: 'Clock Tower · Lore Faction',
}

const factionKanji: Record<FactionId, string> = {
  agency: '探',
  mafia: '港',
  guild: '富',
  hunting_dogs: '犬',
  special_div: '務',
  rats: '鼠',
  decay: '衰',
  clock_tower: '塔',
}

const factionEmoji: Record<FactionId, string> = {
  agency: '🔎',
  mafia: '🌑',
  guild: '💰',
  hunting_dogs: '⚔',
  special_div: '🗂',
  rats: '🐀',
  decay: '🎭',
  clock_tower: '🕰',
}

const characterOverrides: Record<
  string,
  Partial<Pick<HomeCharacterCard, 'summary' | 'quote' | 'authorNote' | 'stats' | 'symbol' | 'abilityType'>>
> = {
  'nakajima-atsushi': {
    summary:
      'Transforms into a white tiger with regenerative power. Born from abandonment, the signature reads like survival forced into something fierce.',
    quote: '"I do not want to die. That is all I ever had."',
    authorNote:
      'Based on Nakajima Atsushi (1909-1942) — Master of lyrical prose whose work explored the bridge between beast and human.',
    abilityType: 'Destruction',
    stats: { power: 85, intel: 55, loyalty: 70, control: 45 },
    symbol: '虎',
  },
  'dazai-osamu': {
    summary:
      'Nullifies any ability with a single touch. The file reads like brilliance sharpened by self-erasure and a refusal to stay still long enough to be understood.',
    quote: '"I want to die with a beautiful woman. Know any candidates?"',
    authorNote:
      'Based on Osamu Dazai (1909-1948) — Father of Japanese decadence and author of No Longer Human.',
    abilityType: 'Special',
    stats: { power: 30, intel: 98, loyalty: 40, control: 95 },
    symbol: '無',
  },
  'kunikida-doppo': {
    summary:
      'Manifests any object written in his notebook as reality. His ability is only as exacting as the ideals he refuses to compromise.',
    quote: '"An ideal is not a dream. It is a blueprint."',
    authorNote:
      'Based on Kunikida Doppo (1871-1908) — A pioneer of Japanese naturalism whose journals of integrity survive in the series.',
    abilityType: 'Support',
    stats: { power: 65, intel: 85, loyalty: 95, control: 90 },
    symbol: '詩',
  },
  'nakahara-chuuya': {
    summary:
      'Controls gravity itself. At full release the file stops reading like a person and starts reading like a natural disaster.',
    quote: '"Gravity is the one truth that never lies. Everything falls eventually."',
    authorNote:
      'Based on Nakahara Chuuya (1907-1937) — The quintessential "Bohemian" poet whose Tainted Sorrow provides the title for this signature.',
    abilityType: 'Destruction',
    stats: { power: 98, intel: 72, loyalty: 100, control: 85 },
    symbol: '重',
  },
  'akutagawa-ryunosuke': {
    summary:
      'Rashomon turns cloth into a devouring void-beast. Hunger, violence, and the need to be acknowledged all arrive in the same cut.',
    quote: '"Weak people have no right to live. That is the only truth I know."',
    authorNote:
      'Based on Akutagawa Ryunosuke (1892-1927) — The Father of Japanese short fiction and a writer of dark, sharp-edged moralism.',
    abilityType: 'Destruction',
    stats: { power: 92, intel: 78, loyalty: 88, control: 75 },
    symbol: '羅',
  },
  fitzgerald: {
    summary:
      'Converts wealth into raw physical power. The file treats money not as status, but as a weapon system built to rewrite the room.',
    quote:
      '"Everything I do, I do for my wife and my dream. Is that not the most human thing of all?"',
    authorNote:
      'Based on F. Scott Fitzgerald (1896-1940) — American author who captured the Jazz Age\'s brilliance and eventual ruin.',
    abilityType: 'Destruction',
    stats: { power: 95, intel: 80, loyalty: 65, control: 70 },
    symbol: '富',
  },
  'fyodor-dostoevsky': {
    summary:
      'Kills an ability user with a single touch. The registry marks the file as theological, hostile, and terrifyingly calm.',
    quote: '"God and I have an understanding. He created sin. I simply remove it."',
    authorNote:
      'Based on Fyodor Dostoevsky (1821-1881) — Russian philosopher-novelist whose work explored the psychological depth of guilt and redemption.',
    abilityType: 'Counter',
    stats: { power: 40, intel: 100, loyalty: 20, control: 99 },
    symbol: '罰',
  },
  'nikolai-gogol': {
    summary:
      'Creates a dimensional space inside the overcoat. The file reads like theater weaponized into freedom and panic at the same time.',
    quote:
       '"Freedom is not a destination. It is the burning of every map you have ever been given."',
    authorNote:
       'Based on Nikolai Gogol (1809-1852) — A master of surrealism and absurdism whose work breaks the boundaries of reality.',
    abilityType: 'Special',
    stats: { power: 25, intel: 98, loyalty: 25, control: 95 },
    symbol: '外',
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function filterForFaction(faction: FactionId): Exclude<HomeCharacterFilter, 'all'> {
  if (faction === 'rats' || faction === 'decay' || faction === 'clock_tower') {
    return 'lore'
  }

  return faction
}

function buildGeneratedSummary(character: AssignmentCharacter) {
  const dominantAxes = Object.entries(character.traits)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2) as [TraitAxis, number][]

  const [firstAxis, secondAxis] = dominantAxes
  const firstTone = traitPhrase[firstAxis[0]][firstAxis[1] >= 7 ? 'high' : 'low']
  const secondTone = traitPhrase[secondAxis[0]][secondAxis[1] >= 7 ? 'high' : 'low']

  return `${character.ability} registers as a ${firstTone}, ${secondTone} signature. ${factionDescriptions[character.faction]}`
}

function buildGeneratedQuote(character: AssignmentCharacter) {
  const dominantAxis = (Object.entries(character.traits).sort(
    (left, right) => right[1] - left[1],
  )[0] ?? ['justice', 5]) as [TraitAxis, number]

  return `Registry note: ${AXIS_LABELS[dominantAxis[0]]} trends ${dominantAxis[1] >= 7 ? 'high' : 'low'} on this file.`
}

function buildGeneratedAuthorNote(character: AssignmentCharacter) {
  return `BSD cross-reference file: ${character.name} is routed through the literary namesake that gives the character their signature.`
}

function deriveStats(character: AssignmentCharacter) {
  return {
    power: clamp(40 + character.traits.power * 6, 35, 99),
    intel: clamp(30 + character.traits.method * 7, 30, 99),
    loyalty: clamp(20 + character.traits.loyalty * 8, 20, 99),
    control: clamp(25 + character.traits.identity * 7.5, 25, 99),
  }
}

function deriveAbilityType(character: AssignmentCharacter): HomeCharacterCard['abilityType'] {
  if (character.traits.power >= 8) return 'Destruction'
  if (character.traits.method >= 8) return 'Counter'
  if (character.traits.social >= 7) return 'Support'
  if (character.traits.identity >= 8) return 'Special'
  return 'Defense'
}

function symbolForCharacter(character: AssignmentCharacter) {
  return character.nameJp.slice(0, 1) || factionKanji[character.faction]
}

export const HOME_THEME_CONTENT: Record<BSDTheme, HomeThemeContent> = {
  light: {
    heroKanji: '文豪',
    label: '夜明け · Dawn · Agency Grounds',
    quote:
      '"No matter how many mistakes you make, no matter how slow your progress - you are still ahead of everyone who is not trying."',
    attr: '— Doppo Kunikida · 国木田独歩',
  },
  neutral: {
    heroKanji: '野心',
    label: "黄昏 · Twilight · The Guild's Hour",
    quote:
      '"The world belongs to those willing to pay the price. I simply know my worth."',
    attr: '— F. Scott Fitzgerald · フィッツジェラルド',
  },
  dark: {
    heroKanji: '暗黒',
    label: '深夜 · Midnight · Mafia Territory',
    quote:
      '"Humans are foolish creatures. They seek strength yet shatter at the slightest blow."',
    attr: '— Ryunosuke Akutagawa · 芥川龍之介',
  },
}

export const HOME_FACTIONS: HomeFactionCard[] = [
  {
    id: 'mafia',
    name: 'Port Mafia',
    nameJp: 'ポートマフィア',
    kanji: '港',
    color: '#cc1a1a',
    status: 'Joinable · Dark',
    rank: '01',
    rankTitle: 'Foot Soldier',
    apDisplay: '92,441 AP',
    memberDisplay: '2,841 members',
    barPercent: 92,
    description: factionDescriptions.mafia,
    philosophy: factionPhilosophies.mafia ?? '',
    theme: 'dark',
    joinable: true,
  },
  {
    id: 'agency',
    name: 'Armed Detective Agency',
    nameJp: '武装探偵社',
    kanji: '探',
    color: '#8b6020',
    status: 'Joinable · Light',
    rank: '02',
    rankTitle: 'Unaffiliated Detective',
    apDisplay: '78,230 AP',
    memberDisplay: '3,412 members',
    barPercent: 88,
    description: factionDescriptions.agency,
    philosophy: factionPhilosophies.agency ?? '',
    theme: 'light',
    joinable: true,
  },
  {
    id: 'guild',
    name: 'The Guild',
    nameJp: 'ザ・ギルド',
    kanji: '富',
    color: '#c8a020',
    status: 'Joinable · Neutral',
    rank: '03',
    rankTitle: 'Associate',
    apDisplay: '61,880 AP',
    memberDisplay: '1,955 members',
    barPercent: 64,
    description: factionDescriptions.guild,
    philosophy: factionPhilosophies.guild ?? '',
    theme: 'neutral',
    joinable: true,
  },
  {
    id: 'hunting_dogs',
    name: 'Hunting Dogs',
    nameJp: '猟犬部隊',
    kanji: '犬',
    color: '#4a6a8a',
    status: 'Joinable · Dark',
    rank: '04',
    rankTitle: 'Recruit',
    apDisplay: '55,120 AP',
    memberDisplay: '842 members',
    barPercent: 41,
    description: factionDescriptions.hunting_dogs,
    philosophy: factionPhilosophies.hunting_dogs ?? '',
    theme: 'dark',
    joinable: true,
  },
  {
    id: 'special_div',
    name: 'Special Division',
    nameJp: '特務課',
    kanji: '務',
    color: '#4a5a6a',
    status: 'Joinable · Light',
    rank: '05',
    rankTitle: 'Flagged',
    apDisplay: '42,660 AP',
    memberDisplay: '1,102 members',
    barPercent: 28,
    description: factionDescriptions.special_div,
    philosophy: factionPhilosophies.special_div ?? '',
    theme: 'light',
    joinable: true,
  },
  {
    id: 'rats',
    name: 'Rats in the House of the Dead',
    nameJp: '死の家の鼠',
    kanji: '鼠',
    color: '#6a1a6a',
    status: 'Lore · Dark · Unlock Required',
    rank: '—',
    rankTitle: 'Initiate',
    apDisplay: '???',
    memberDisplay: '---',
    barPercent: 12,
    description: factionDescriptions.rats,
    philosophy: factionPhilosophies.rats ?? '',
    theme: 'dark',
    joinable: false,
  },
  {
    id: 'decay',
    name: 'Decay of the Angel',
    nameJp: '天人五衰',
    kanji: '衰',
    color: '#3a5a7a',
    status: 'Lore · Neutral · Unlock Required',
    rank: '—',
    rankTitle: 'Actor',
    apDisplay: '???',
    memberDisplay: '---',
    barPercent: 8,
    description: factionDescriptions.decay,
    philosophy: factionPhilosophies.decay ?? '',
    theme: 'neutral',
    joinable: false,
  },
  {
    id: 'clock_tower',
    name: 'Order of the Clock Tower',
    nameJp: '時計塔',
    kanji: '塔',
    color: '#5a4a2a',
    status: 'Lore · Neutral · Unlock Required',
    rank: '—',
    rankTitle: 'Page',
    apDisplay: '???',
    memberDisplay: '---',
    barPercent: 4,
    description: factionDescriptions.clock_tower,
    philosophy: factionPhilosophies.clock_tower ?? '',
    theme: 'neutral',
    joinable: false,
  },
]

export const HOME_CHARACTER_FILTERS: {
  id: HomeCharacterFilter
  label: string
}[] = [
  { id: 'all', label: 'All · 全員' },
  { id: 'agency', label: '探偵社 · Agency' },
  { id: 'mafia', label: 'Port Mafia · 港' },
  { id: 'guild', label: 'The Guild · 富' },
  { id: 'hunting_dogs', label: 'Hunting Dogs · 犬' },
  { id: 'special_div', label: 'Special Div. · 務' },
  { id: 'lore', label: 'Lore Factions · ???' },
]

export const HOME_CHARACTERS: HomeCharacterCard[] = CHARACTER_ASSIGNMENT_POOL.map(
  (character) => {
    const override = characterOverrides[character.slug]

    return {
      slug: character.slug,
      name: character.name,
      nameJp: character.nameJp,
      ability: character.ability,
      abilityJp: character.abilityJp,
      faction: character.faction,
      filter: filterForFaction(character.faction),
      factionBadge: `${factionEmoji[character.faction]} ${factionLabels[character.faction]}`,
      accentColor: FACTION_ASSIGNMENT_META[character.faction].color,
      summary: override?.summary ?? buildGeneratedSummary(character),
      quote: override?.quote ?? buildGeneratedQuote(character),
      authorNote: override?.authorNote ?? buildGeneratedAuthorNote(character),
      symbol: override?.symbol ?? symbolForCharacter(character),
      stats: override?.stats ?? deriveStats(character),
      abilityType: override?.abilityType ?? deriveAbilityType(character),
    }
  },
)

export const RESERVED_SLUGS = [
  'mori-ogai',
  'fukuzawa-yukichi',
  'fitzgerald',
  'fukuchi-ouchi',
  'fyodor-dostoevsky',
  'fyodor-dostoyevsky',
  'natsume-soseki',
  'nikolai-gogol',
  'ango-sakaguchi',
  'sakunosuke-oda',
]

export const HOME_LORE_POSTS: HomeLorePost[] = [
  {
    slug: 'dazai-osamu-the-architect-of-every-single-arc',
    category: 'Staff · Deep Dive',
    title: 'Dazai Osamu: The Architect of Every Single Arc',
    excerpt:
      'From youngest Port Mafia executive to the Agency\'s most unpredictable asset - how one man engineered every major conflict in Yokohama without anyone fully grasping his endgame. The real Osamu Dazai attempted suicide six times. BSD turns that history into a narrative pressure point.',
    meta: 'archive_staff · 18 min read · 1,240 saves · 太宰治',
    featured: true,
  },
  {
    slug: 'why-bsd-author-names-are-the-deepest-lore',
    category: 'Theory',
    title: "Why BSD's Author Names Are the Deepest Lore",
    excerpt:
      'Every character\'s ability directly mirrors what their real author wrote about. That is not garnish - it is the load-bearing architecture of the series.',
    meta: 'literary_detective · 9 min · 892 saves',
  },
  {
    slug: 'soukoku-a-partnership-built-on-mutual-destruction',
    category: 'Character Study',
    title: 'Soukoku: A Partnership Built on Mutual Destruction',
    excerpt:
      'Double Black is not just powerful. It is two people who are more honest with each other through violence than they ever could be with words.',
    meta: 'soukoku_archivist · 12 min · 2,104 saves',
  },
  {
    slug: 'decay-of-angels-why-the-agencys-darkest-hour-is-bsds-masterwork',
    category: 'Arc Review',
    title: "Decay of Angels: Why the Agency's Darkest Hour Is BSD's Masterwork",
    excerpt:
      'The arc where everything the series built is systematically dismantled, then reassembled around identity, guilt, and spectacle.',
    meta: 'yokohama_watcher · 15 min · 678 saves',
  },
]

