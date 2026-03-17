import type { FactionId, CharacterClass } from '@/backend/types'

export const TRAIT_AXES = [
  'justice',
  'power',
  'social',
  'emotion',
  'world',
  'identity',
  'method',
  'loyalty',
] as const

export type TraitAxis = (typeof TRAIT_AXES)[number]
export type TraitVector = Record<TraitAxis, number>

export interface TraitQuestionOption {
  key: 'A' | 'B' | 'C' | 'D'
  text: string
  delta: Partial<TraitVector>
}

export interface TraitQuestion {
  id: number
  prompt: string
  options: TraitQuestionOption[]
}

export interface AssignmentCharacter {
  slug: string
  name: string
  nameJp: string
  ability: string
  abilityJp: string
  faction: FactionId
  traits: TraitVector
  class_tag: CharacterClass
}

export interface RankedCharacter extends AssignmentCharacter {
  distance: number
}

export interface RankedFaction {
  faction: FactionId
  traits: TraitVector
  distance: number
}

export interface DominantTrait {
  axis: TraitAxis
  label: string
  value: number
}

export interface CharacterExamResult {
  caseNumber: string
  assignedFaction: FactionId
  factionRankings: RankedFaction[]
  factionCandidates: RankedCharacter[]
  normalizedScores: TraitVector
  dominantTraits: DominantTrait[]
  description: string
  shareText: string
}

export const AXIS_LABELS: Record<TraitAxis, string> = {
  justice: 'Justice',
  power: 'Power Style',
  social: 'Social Role',
  emotion: 'Emotional Drive',
  world: 'World View',
  identity: 'Identity',
  method: 'Method',
  loyalty: 'Loyalty',
}

export const FACTION_ASSIGNMENT_META: Record<
  FactionId,
  {
    name: string
    nameJp: string
    kanji: string
    color: string
    startRank: string
    joinable: boolean
  }
> = {
  agency: {
    name: 'Armed Detective Agency',
    nameJp: '武装探偵社',
    kanji: '探',
    color: '#8b6020',
    startRank: 'Rank 1 · Agency Associate',
    joinable: true,
  },
  mafia: {
    name: 'Port Mafia',
    nameJp: 'ポートマフィア',
    kanji: '港',
    color: '#cc1a1a',
    startRank: 'Rank 1 · Port Initiate',
    joinable: true,
  },
  guild: {
    name: 'The Guild',
    nameJp: 'ザ・ギルド',
    kanji: '富',
    color: '#c8a020',
    startRank: 'Rank 1 · Contract Holder',
    joinable: true,
  },
  hunting_dogs: {
    name: 'Hunting Dogs',
    nameJp: '猟犬部隊',
    kanji: '犬',
    color: '#4a6a8a',
    startRank: 'Rank 1 · Blade Candidate',
    joinable: true,
  },
  special_div: {
    name: 'Special Division',
    nameJp: '特務課',
    kanji: '務',
    color: '#4a5a6a',
    startRank: 'Rank 1 · Records Officer',
    joinable: true,
  },
  rats: {
    name: 'Rats in the House of the Dead',
    nameJp: '死の家の鼠',
    kanji: '鼠',
    color: '#6a1a6a',
    startRank: 'Locked · Drift Only',
    joinable: false,
  },
  decay: {
    name: 'Decay of the Angel',
    nameJp: '天人五衰',
    kanji: '衰',
    color: '#3a5a7a',
    startRank: 'Locked · Drift Only',
    joinable: false,
  },
  clock_tower: {
    name: 'Order of the Clock Tower',
    nameJp: '時計塔',
    kanji: '塔',
    color: '#5a4a2a',
    startRank: 'Locked · Drift Only',
    joinable: false,
  },
}

const PHRASE_BY_AXIS: Record<
  TraitAxis,
  {
    high: string
    low: string
  }
> = {
  justice: {
    high: 'The city reads your moral clarity as absolute.',
    low: 'You move in spaces where outcomes matter more than rules.',
  },
  power: {
    high: 'Your ability registers as maximal: overwhelming when unleashed.',
    low: 'Your power is precise, quiet, and surgical.',
  },
  social: {
    high: 'Others anchor to you without knowing why.',
    low: 'You work alone, and the city notes your independence.',
  },
  emotion: {
    high: 'The registry records a signature driven by conviction, not calculation.',
    low: 'Cold, precise, emotion held at a distance.',
  },
  world: {
    high: 'You believe people are worth protecting. The city agrees.',
    low: 'You have seen what the world is, and you work with that reality.',
  },
  identity: {
    high: 'Your ability signature shifts with you. You are not finished.',
    low: 'Your ability is rooted in what you were: stable and certain.',
  },
  method: {
    high: 'Information first. You think before you act.',
    low: 'Direct. The city records: acts immediately, processes later.',
  },
  loyalty: {
    high: 'The registry notes that you have chosen your people and do not waver.',
    low: 'Your loyalty is to your own code and transferable to no one.',
  },
}

const CLASSIFIED_ABILITY = {
  name: 'Classified Ability',
  nameJp: '機密指定',
}

export const CHARACTER_ASSIGNMENT_POOL: AssignmentCharacter[] = [
  {
    slug: 'nakajima-atsushi',
    name: 'Nakajima Atsushi',
    nameJp: '中島敦',
    ability: 'Beast Beneath the Moonlight',
    abilityJp: '月下獣',
    faction: 'agency',
    traits: { justice: 6, power: 5, social: 6, emotion: 8, world: 8, identity: 6, method: 5, loyalty: 7 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'dazai-osamu',
    name: 'Osamu Dazai',
    nameJp: '太宰治',
    ability: 'No Longer Human',
    abilityJp: '人間失格',
    faction: 'agency',
    traits: { justice: 4, power: 6, social: 4, emotion: 3, world: 5, identity: 9, method: 3, loyalty: 2 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'kunikida-doppo',
    name: 'Doppo Kunikida',
    nameJp: '国木田独歩',
    ability: 'Lone Poet',
    abilityJp: '独歩吟客',
    faction: 'agency',
    traits: { justice: 9, power: 6, social: 7, emotion: 5, world: 8, identity: 8, method: 5, loyalty: 8 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'ranpo-edogawa',
    name: 'Ranpo Edogawa',
    nameJp: '江戸川乱歩',
    ability: 'Ultra-Deduction',
    abilityJp: '超推理',
    faction: 'agency',
    traits: { justice: 7, power: 2, social: 5, emotion: 2, world: 7, identity: 6, method: 2, loyalty: 5 },
    class_tag: 'INTEL',
  },
  {
    slug: 'akiko-yosano',
    name: 'Akiko Yosano',
    nameJp: '与謝野晶子',
    ability: 'Thou Shalt Not Die',
    abilityJp: '君死給勿',
    faction: 'agency',
    traits: { justice: 8, power: 7, social: 7, emotion: 6, world: 8, identity: 7, method: 6, loyalty: 8 },
    class_tag: 'SUPPORT',
  },
  {
    slug: 'junichiro-tanizaki',
    name: 'Junichiro Tanizaki',
    nameJp: '谷崎潤一郎',
    ability: 'Light Snow',
    abilityJp: '細雪',
    faction: 'agency',
    traits: { justice: 7, power: 5, social: 6, emotion: 7, world: 7, identity: 6, method: 5, loyalty: 9 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'naomi-tanizaki',
    name: 'Naomi Tanizaki',
    nameJp: '谷崎ナオミ',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'agency',
    traits: { justice: 5, power: 4, social: 5, emotion: 8, world: 6, identity: 5, method: 4, loyalty: 9 },
    class_tag: 'SUPPORT',
  },
  {
    slug: 'kyouka-izumi',
    name: 'Kyouka Izumi',
    nameJp: '泉鏡花',
    ability: 'Demon Snow',
    abilityJp: '夜叉白雪',
    faction: 'agency',
    traits: { justice: 7, power: 7, social: 5, emotion: 7, world: 7, identity: 7, method: 6, loyalty: 8 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'kenji-miyazawa',
    name: 'Kenji Miyazawa',
    nameJp: '宮沢賢治',
    ability: 'Undefeated by the Rain',
    abilityJp: '雨ニモマケズ',
    faction: 'agency',
    traits: { justice: 9, power: 8, social: 6, emotion: 9, world: 9, identity: 4, method: 7, loyalty: 7 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'fukuzawa-yukichi',
    name: 'Fukuzawa Yukichi',
    nameJp: '福沢諭吉',
    ability: 'All Men Are Equal',
    abilityJp: '人上人不造',
    faction: 'agency',
    traits: { justice: 9, power: 7, social: 9, emotion: 4, world: 8, identity: 7, method: 3, loyalty: 9 },
    class_tag: 'INTEL',
  },
  {
    slug: 'edgar-allan-poe',
    name: 'Edgar Allan Poe',
    nameJp: 'エドガー・アラン・ポオ',
    ability: 'Black Cat in the Rue Morgue',
    abilityJp: '黒猫',
    faction: 'guild',
    traits: { justice: 6, power: 4, social: 2, emotion: 6, world: 5, identity: 5, method: 2, loyalty: 4 },
    class_tag: 'INTEL',
  },
  {
    slug: 'nakahara-chuuya',
    name: 'Nakahara Chuuya',
    nameJp: '中原中也',
    ability: 'For the Tainted Sorrow',
    abilityJp: '汚れつちまつた悲しみに',
    faction: 'mafia',
    traits: { justice: 5, power: 9, social: 7, emotion: 7, world: 4, identity: 4, method: 8, loyalty: 9 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'akutagawa-ryunosuke',
    name: 'Akutagawa Ryunosuke',
    nameJp: '芥川龍之介',
    ability: 'Rashomon',
    abilityJp: '羅生門',
    faction: 'mafia',
    traits: { justice: 3, power: 9, social: 4, emotion: 8, world: 2, identity: 3, method: 8, loyalty: 7 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'mori-ogai',
    name: 'Ougai Mori',
    nameJp: '森鴎外',
    ability: 'Vita Sexualis',
    abilityJp: 'ヰタ・セクスアリス',
    faction: 'mafia',
    traits: { justice: 2, power: 6, social: 9, emotion: 1, world: 3, identity: 6, method: 2, loyalty: 3 },
    class_tag: 'SUPPORT',
  },
  {
    slug: 'ozaki-kouyou',
    name: 'Kouyou Ozaki',
    nameJp: '尾崎紅葉',
    ability: 'Golden Demon',
    abilityJp: '金色夜叉',
    faction: 'mafia',
    traits: { justice: 5, power: 7, social: 8, emotion: 4, world: 4, identity: 6, method: 5, loyalty: 7 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'gin-akutagawa',
    name: 'Gin Akutagawa',
    nameJp: '芥川銀',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'mafia',
    traits: { justice: 4, power: 8, social: 3, emotion: 3, world: 3, identity: 4, method: 8, loyalty: 10 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'higuchi-ichiyo',
    name: 'Ichiyo Higuchi',
    nameJp: '樋口一葉',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'mafia',
    traits: { justice: 6, power: 3, social: 4, emotion: 9, world: 6, identity: 5, method: 4, loyalty: 10 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'tachihara-michizou',
    name: 'Michizou Tachihara',
    nameJp: '立原道造',
    ability: 'Midwinter Memento',
    abilityJp: '真冬のメメント',
    faction: 'mafia',
    traits: { justice: 6, power: 6, social: 4, emotion: 6, world: 5, identity: 4, method: 5, loyalty: 6 },
    class_tag: 'INTEL',
  },
  {
    slug: 'fitzgerald',
    name: 'F. Scott Fitzgerald',
    nameJp: 'F・S・フィッツジェラルド',
    ability: 'The Great Fitzgerald',
    abilityJp: '華麗なるフィッツジェラルド',
    faction: 'guild',
    traits: { justice: 4, power: 8, social: 9, emotion: 5, world: 4, identity: 7, method: 6, loyalty: 6 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'lucy-montgomery',
    name: 'Lucy Maud Montgomery',
    nameJp: 'ルーシー・M',
    ability: 'Anne of Abyssal Red',
    abilityJp: '深淵の赤毛のアン',
    faction: 'guild',
    traits: { justice: 5, power: 5, social: 3, emotion: 8, world: 6, identity: 5, method: 4, loyalty: 6 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'john-steinbeck',
    name: 'John Steinbeck',
    nameJp: 'ジョン・スタインベック',
    ability: 'The Grapes of Wrath',
    abilityJp: '怒りの葡萄',
    faction: 'guild',
    traits: { justice: 7, power: 7, social: 5, emotion: 6, world: 7, identity: 6, method: 5, loyalty: 7 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'herman-melville',
    name: 'Herman Melville',
    nameJp: 'ハーマン・メルヴィル',
    ability: 'Moby-Dick',
    abilityJp: '白鯨',
    faction: 'guild',
    traits: { justice: 5, power: 9, social: 7, emotion: 3, world: 4, identity: 4, method: 8, loyalty: 5 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'mark-twain',
    name: 'Mark Twain',
    nameJp: 'マーク・トウェイン',
    ability: 'Huckleberry Finn and Tom Sawyer',
    abilityJp: 'ハックルベリ・フィン&トム・ソーヤー',
    faction: 'guild',
    traits: { justice: 6, power: 6, social: 5, emotion: 5, world: 6, identity: 7, method: 4, loyalty: 5 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'louisa-may-alcott',
    name: 'Louisa May Alcott',
    nameJp: 'ルイーザ・メイ・オルコット',
    ability: 'Little Women',
    abilityJp: '若草物語',
    faction: 'guild',
    traits: { justice: 7, power: 5, social: 7, emotion: 7, world: 7, identity: 6, method: 4, loyalty: 8 },
    class_tag: 'INTEL',
  },
  {
    slug: 'teruko-okura',
    name: 'Teruko Okura',
    nameJp: '大倉燁子',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'hunting_dogs',
    traits: { justice: 2, power: 9, social: 6, emotion: 2, world: 2, identity: 3, method: 9, loyalty: 4 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'tetchou-suehiro',
    name: 'Tetchou Suehiro',
    nameJp: '末広鐵腸',
    ability: 'Plum Blossoms in Snow',
    abilityJp: '雪中梅',
    faction: 'hunting_dogs',
    traits: { justice: 8, power: 8, social: 6, emotion: 3, world: 5, identity: 4, method: 8, loyalty: 9 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'jouno-saigiku',
    name: 'Saigiku Jouno',
    nameJp: '条野採菊',
    ability: 'Priceless Tears',
    abilityJp: '千金の涙',
    faction: 'hunting_dogs',
    traits: { justice: 6, power: 7, social: 5, emotion: 4, world: 4, identity: 6, method: 3, loyalty: 6 },
    class_tag: 'INTEL',
  },
  {
    slug: 'fukuchi-ouchi',
    name: 'Ouchi Fukuchi',
    nameJp: '福地桜痴',
    ability: 'Mirror Lion',
    abilityJp: '鏡獅子',
    faction: 'hunting_dogs',
    traits: { justice: 6, power: 8, social: 8, emotion: 3, world: 5, identity: 3, method: 6, loyalty: 5 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'ango-sakaguchi',
    name: 'Ango Sakaguchi',
    nameJp: '坂口安吾',
    ability: 'Discourse on Decadence',
    abilityJp: '堕落論',
    faction: 'special_div',
    traits: { justice: 5, power: 4, social: 4, emotion: 3, world: 5, identity: 7, method: 2, loyalty: 3 },
    class_tag: 'INTEL',
  },
  {
    slug: 'minoura-motoji',
    name: 'Motoji Minoura',
    nameJp: '箕浦基之',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'special_div',
    traits: { justice: 8, power: 2, social: 5, emotion: 6, world: 7, identity: 6, method: 4, loyalty: 8 },
    class_tag: 'INTEL',
  },
  {
    slug: 'taneda-santoka',
    name: 'Santoka Taneda',
    nameJp: '種田山頭火',
    ability: CLASSIFIED_ABILITY.name,
    abilityJp: CLASSIFIED_ABILITY.nameJp,
    faction: 'special_div',
    traits: { justice: 7, power: 3, social: 8, emotion: 4, world: 7, identity: 6, method: 3, loyalty: 7 },
    class_tag: 'INTEL',
  },
  {
    slug: 'fyodor-dostoevsky',
    name: 'Fyodor Dostoevsky',
    nameJp: 'フョードル・ドストエフスキー',
    ability: 'Crime and Punishment',
    abilityJp: '罪と罰',
    faction: 'rats',
    traits: { justice: 1, power: 5, social: 4, emotion: 1, world: 1, identity: 5, method: 1, loyalty: 1 },
    class_tag: 'INTEL',
  },
  {
    slug: 'alexander-pushkin',
    name: 'Alexander Pushkin',
    nameJp: 'アレクサンドル・プーシキン',
    ability: 'The Shot',
    abilityJp: '射手',
    faction: 'rats',
    traits: { justice: 2, power: 6, social: 3, emotion: 2, world: 2, identity: 5, method: 2, loyalty: 3 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'ivan-goncharov',
    name: 'Ivan Goncharov',
    nameJp: 'イワン・ゴンチャロフ',
    ability: 'The Precipice',
    abilityJp: '断崖',
    faction: 'rats',
    traits: { justice: 4, power: 9, social: 3, emotion: 5, world: 4, identity: 5, method: 8, loyalty: 5 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'nikolai-gogol',
    name: 'Nikolai Gogol',
    nameJp: 'ニコライ・ゴーゴリ',
    ability: 'The Overcoat',
    abilityJp: '外套',
    faction: 'decay',
    traits: { justice: 3, power: 7, social: 3, emotion: 6, world: 3, identity: 9, method: 6, loyalty: 2 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'sigma',
    name: 'Sigma',
    nameJp: 'シグマ',
    ability: 'Information Exchange',
    abilityJp: '情報交換',
    faction: 'decay',
    traits: { justice: 6, power: 4, social: 3, emotion: 8, world: 6, identity: 8, method: 4, loyalty: 6 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'bram-stoker',
    name: 'Bram Stoker',
    nameJp: 'ブラム・ストーカー',
    ability: 'Dracula',
    abilityJp: 'ドラキュラ',
    faction: 'decay',
    traits: { justice: 2, power: 9, social: 4, emotion: 2, world: 2, identity: 2, method: 9, loyalty: 3 },
    class_tag: 'ANOMALY',
  },
  {
    slug: 'agatha-christie',
    name: 'Agatha Christie',
    nameJp: 'アガサ・クリスティ',
    ability: 'And Then There Were None',
    abilityJp: 'そして誰もいなくなった',
    faction: 'clock_tower',
    traits: { justice: 6, power: 5, social: 8, emotion: 2, world: 5, identity: 6, method: 1, loyalty: 5 },
    class_tag: 'INTEL',
  },
  {
    slug: 'rudyard-kipling',
    name: 'Rudyard Kipling',
    nameJp: 'ラドヤード・キップリング',
    ability: 'The Jungle Book',
    abilityJp: 'ジャングル・ブック',
    faction: 'clock_tower',
    traits: { justice: 5, power: 7, social: 7, emotion: 3, world: 4, identity: 5, method: 6, loyalty: 4 },
    class_tag: 'BRUTE',
  },
  {
    slug: 'oscar-wilde',
    name: 'Oscar Wilde',
    nameJp: 'オスカー・ワイルド',
    ability: 'The Picture of Dorian Gray',
    abilityJp: 'ドリアン・グレイの肖像',
    faction: 'clock_tower',
    traits: { justice: 6, power: 5, social: 5, emotion: 6, world: 6, identity: 8, method: 3, loyalty: 6 },
    class_tag: 'ANOMALY',
  },
]

export const TRAIT_QUESTIONS: TraitQuestion[] = [
  {
    id: 1,
    prompt:
      'A person you have never met is about to be seriously hurt. Stopping it will cost you something meaningful. Nobody would ever know if you looked away. What do you do?',
    options: [
      { key: 'A', text: 'I intervene without hesitation. The cost is irrelevant.', delta: { justice: 3, world: 2, loyalty: 1 } },
      { key: 'B', text: 'I calculate whether the intervention is strategically worth it.', delta: { power: -1, method: 2, emotion: -2 } },
      { key: 'C', text: 'I find a way to help that minimizes my own cost first.', delta: { social: 1, identity: 2, method: 1 } },
      { key: 'D', text: 'I note the situation and move on. Not my problem to absorb.', delta: { justice: -2, world: -2, social: -1 } },
    ],
  },
  {
    id: 2,
    prompt:
      'Your closest ally has just done something that violates what you believe in. Nobody else noticed. You are the only one who knows.',
    options: [
      { key: 'A', text: 'I confront them directly and immediately. Loyalty does not mean silence.', delta: { justice: 2, loyalty: 2 } },
      { key: 'B', text: 'I say nothing now, but store the information. It may be useful later.', delta: { method: 2, identity: 1, emotion: -2 } },
      { key: 'C', text: 'I understand why they did it. I protect them.', delta: { loyalty: 3, emotion: 2, justice: -1 } },
      { key: 'D', text: 'I distance myself quietly. I do not need people who do that.', delta: { social: -2, identity: 2, world: -1 } },
    ],
  },
  {
    id: 3,
    prompt:
      'You discover you have a rare and powerful talent that most people do not. You can use it brilliantly, but only if you never explain how it works. What do you do?',
    options: [
      { key: 'A', text: 'I keep it to myself completely. The mystery is part of the power.', delta: { power: 2, method: 1, identity: 2 } },
      { key: 'B', text: 'I teach it selectively to people who have earned access.', delta: { social: 2, loyalty: 2, power: 1 } },
      { key: 'C', text: 'I find a way to use it openly. I do not want hidden advantages.', delta: { justice: 2, world: 2, identity: -1 } },
      { key: 'D', text: 'I document it privately and share it publicly when the timing is right.', delta: { method: 2, social: 1, emotion: -1 } },
    ],
  },
  {
    id: 4,
    prompt:
      'You are leading a group through a dangerous situation. One member is slowing you all down through no fault of their own. Leaving them will save everyone else.',
    options: [
      { key: 'A', text: 'We all make it or none of us do. There is no other option.', delta: { loyalty: 3, world: 2, justice: 1 } },
      { key: 'B', text: 'I leave them and feel nothing. Sentiment is a liability in high stakes.', delta: { world: -3, emotion: -2, method: 2 } },
      { key: 'C', text: 'I send the group ahead and stay to carry them myself.', delta: { social: 1, loyalty: 2, power: 1 } },
      { key: 'D', text: 'I buy them as much time as I can and give them a real chance. Then go.', delta: { justice: 2, emotion: 1, method: 1 } },
    ],
  },
  {
    id: 5,
    prompt:
      'If you could choose exactly one thing to be remembered for, what would it be?',
    options: [
      { key: 'A', text: 'That I was the best at what I did. Undeniably.', delta: { power: 3, identity: 2, world: -1 } },
      { key: 'B', text: 'That I kept my word every single time.', delta: { loyalty: 3, justice: 2, emotion: 1 } },
      { key: 'C', text: 'That I made the right call when nobody else could.', delta: { method: 2, social: 2, power: 1 } },
      { key: 'D', text: 'That I changed something that needed to change.', delta: { world: 3, identity: 2, justice: 1 } },
    ],
  },
  {
    id: 6,
    prompt:
      'You have been wronged deeply. The person who did it now needs your help, and you are the only one who can give it.',
    options: [
      { key: 'A', text: 'I help them. What happened between us has no bearing on what is right.', delta: { justice: 3, world: 2, emotion: -1 } },
      { key: 'B', text: 'I help them, but they will owe me something after this.', delta: { method: 2, social: 1, loyalty: -1 } },
      { key: 'C', text: 'I refuse. Some things cannot be moved past.', delta: { identity: 3, world: -2, loyalty: 1 } },
      { key: 'D', text: 'I decide based on what helping them would cost the larger situation.', delta: { method: 3, emotion: -2, justice: 1 } },
    ],
  },
  {
    id: 7,
    prompt:
      'You are given access to information that most people never see about how systems of power actually work. What do you do with it?',
    options: [
      { key: 'A', text: 'I use it to advance my position as quietly and effectively as possible.', delta: { method: 3, social: 2, identity: 1 } },
      { key: 'B', text: 'I make it public. People have a right to know how the world actually works.', delta: { justice: 3, world: 2, loyalty: -1 } },
      { key: 'C', text: 'I hold it. Information held is information with infinite future value.', delta: { power: 2, method: 2, identity: 2 } },
      { key: 'D', text: 'I give it to someone in a position to act on it properly.', delta: { social: 3, loyalty: 2, justice: 1 } },
    ],
  },
  {
    id: 8,
    prompt:
      'Someone tells you that the thing you built your identity around is wrong and they have strong evidence. How do you respond?',
    options: [
      { key: 'A', text: 'I investigate the evidence seriously. If it is right, I change.', delta: { world: 2, identity: 3, emotion: -1 } },
      { key: 'B', text: 'I defend my position. I have thought about this longer than they have.', delta: { identity: -2, justice: 1, world: -1 } },
      { key: 'C', text: 'I become curious. I want to understand their whole framework.', delta: { emotion: 2, method: 1, social: 1 } },
      { key: 'D', text: 'I feel it but do not show it. I process alone and return with clarity.', delta: { identity: 2, emotion: -1, method: 1 } },
    ],
  },
  {
    id: 9,
    prompt:
      'You have the power to solve a problem permanently, but only if you cause real harm to someone innocent. The problem affects many people. What do you do?',
    options: [
      { key: 'A', text: 'I cannot do it. There is a line and that is it.', delta: { justice: 3, world: 3, method: -1 } },
      { key: 'B', text: 'I do it. The math is clear. Emotion clouds what is obvious.', delta: { justice: -3, world: -2, emotion: -3 } },
      { key: 'C', text: 'I find a third option. The question assumes a false binary.', delta: { method: 3, power: 1, identity: 2 } },
      { key: 'D', text: 'I delay and investigate further. Permanent decisions need more information.', delta: { method: 2, emotion: 1, social: 1 } },
    ],
  },
  {
    id: 10,
    prompt:
      'Your faction is making a decision you believe is seriously wrong. You have spoken. They voted differently. What happens next?',
    options: [
      { key: 'A', text: 'I accept the decision and execute it. Collective decisions supersede mine.', delta: { loyalty: 3, social: 2, identity: -1 } },
      { key: 'B', text: 'I accept it, but work to change the outcome from inside.', delta: { social: 2, method: 2, identity: 1 } },
      { key: 'C', text: 'I refuse to participate in something I believe is wrong.', delta: { justice: 2, identity: 3, loyalty: -2 } },
      { key: 'D', text: 'I go around the decision without technically defying it.', delta: { method: 3, identity: 2, social: -1 } },
    ],
  },
  {
    id: 11,
    prompt:
      'Two people who both matter to you need something, and you can only give it to one of them right now. One is suffering more. One would use it better.',
    options: [
      { key: 'A', text: 'I give it to the one who is suffering more. Need comes first.', delta: { emotion: 3, world: 2, loyalty: 1 } },
      { key: 'B', text: 'I give it to the one who will use it better. Outcome matters more than comfort.', delta: { method: 3, emotion: -2, world: -1 } },
      { key: 'C', text: 'I find a way to split it or delay until I can give both.', delta: { social: 2, justice: 1, power: -1 } },
      { key: 'D', text: 'I give it to the one I am more loyal to. Relationships are not interchangeable.', delta: { loyalty: 3, identity: 1, justice: -1 } },
    ],
  },
  {
    id: 12,
    prompt:
      'The last question. What do you actually want when nobody is watching?',
    options: [
      { key: 'A', text: 'To be undeniably excellent at something and have the right people know it.', delta: { power: 3, identity: 2, social: 1 } },
      { key: 'B', text: 'To protect the specific people I have chosen. Nothing else matters as much.', delta: { loyalty: 3, emotion: 2, world: 1 } },
      { key: 'C', text: 'To understand how things actually work and use that understanding.', delta: { method: 3, power: 1, identity: 2 } },
      { key: 'D', text: 'To make something that lasts after I am gone.', delta: { world: 3, identity: 2, justice: 1 } },
    ],
  },
]

export function createEmptyTraitVector(): TraitVector {
  return {
    justice: 0,
    power: 0,
    social: 0,
    emotion: 0,
    world: 0,
    identity: 0,
    method: 0,
    loyalty: 0,
  }
}

export function applyTraitDelta(
  current: TraitVector,
  delta: Partial<TraitVector>,
): TraitVector {
  return TRAIT_AXES.reduce((nextScores, axis) => {
    nextScores[axis] = current[axis] + (delta[axis] ?? 0)
    return nextScores
  }, createEmptyTraitVector())
}

export function normalizeTraitVector(rawScores: TraitVector): TraitVector {
  const maxPossible = 36

  return TRAIT_AXES.reduce((normalized, axis) => {
    const clamped = Math.max(0, Math.min(maxPossible, rawScores[axis]))
    normalized[axis] = Math.round((clamped / maxPossible) * 9) + 1
    return normalized
  }, createEmptyTraitVector())
}

export function euclideanDistance(
  userVector: TraitVector,
  characterVector: TraitVector,
): number {
  return Math.sqrt(
    TRAIT_AXES.reduce((sum, axis) => {
      return sum + Math.pow(userVector[axis] - characterVector[axis], 2)
    }, 0),
  )
}

function averageTraitVectors(vectors: TraitVector[]): TraitVector {
  return TRAIT_AXES.reduce((summary, axis) => {
    const total = vectors.reduce((sum, vector) => sum + vector[axis], 0)
    summary[axis] = Math.round(total / Math.max(vectors.length, 1))
    return summary
  }, createEmptyTraitVector())
}

export function factionTraitVectors(): Record<FactionId, TraitVector> {
  return (Object.keys(FACTION_ASSIGNMENT_META) as FactionId[]).reduce(
    (summary, faction) => {
      const vectors = CHARACTER_ASSIGNMENT_POOL.filter(
        (character) =>
          character.faction === faction &&
          FACTION_ASSIGNMENT_META[character.faction].joinable,
      ).map((character) => character.traits)

      summary[faction] =
        vectors.length > 0 ? averageTraitVectors(vectors) : createEmptyTraitVector()
      return summary
    },
    {} as Record<FactionId, TraitVector>,
  )
}

export function rankFactions(userVector: TraitVector): RankedFaction[] {
  const vectors = factionTraitVectors()

  return (Object.keys(FACTION_ASSIGNMENT_META) as FactionId[])
    .filter((faction) => FACTION_ASSIGNMENT_META[faction].joinable)
    .map((faction) => ({
      faction,
      traits: vectors[faction],
      distance: euclideanDistance(userVector, vectors[faction]),
    }))
    .sort((left, right) => left.distance - right.distance)
}

export function rankCharactersInFaction(
  userVector: TraitVector,
  faction: FactionId,
): RankedCharacter[] {
  return CHARACTER_ASSIGNMENT_POOL.filter((character) => character.faction === faction)
    .map((character) => ({
      ...character,
      distance: euclideanDistance(userVector, character.traits),
    }))
    .sort((left, right) => left.distance - right.distance)
}

export function assignFaction(factionRankings: RankedFaction[]): FactionId {
  return factionRankings[0]?.faction ?? 'agency'
}

export function dominantTraits(vector: TraitVector): DominantTrait[] {
  return [...TRAIT_AXES]
    .sort((left, right) => vector[right] - vector[left])
    .slice(0, 4)
    .map((axis) => ({
      axis,
      label: AXIS_LABELS[axis],
      value: vector[axis],
    }))
}

export function generateMatchDescription(
  vector: TraitVector,
  faction: FactionId,
): string {
  const [first, second] = [...TRAIT_AXES]
    .sort((left, right) => vector[right] - vector[left])
    .slice(0, 2)

  const firstPhrase = PHRASE_BY_AXIS[first][vector[first] >= 7 ? 'high' : 'low']
  const secondPhrase = PHRASE_BY_AXIS[second][vector[second] >= 7 ? 'high' : 'low']
  const factionMeta = FACTION_ASSIGNMENT_META[faction]

  return `The ability registry has processed your signature. ${firstPhrase} ${secondPhrase} Yokohama assigns you to ${factionMeta.name}.`
}

export function buildShareText(
  result: CharacterExamResult,
  selectedCharacter?: RankedCharacter,
): string {
  const faction = FACTION_ASSIGNMENT_META[result.assignedFaction]
  const chosen = selectedCharacter ?? result.factionCandidates[0]

  return [
    '文豪アーカイブ · 能力者判定',
    '',
    `Faction Placement: ${faction.name} · ${faction.nameJp}`,
    `Character Match: ${chosen.name} · ${chosen.nameJp}`,
    `Ability: ${chosen.ability} · ${chosen.abilityJp}`,
    '',
    'The city has registered my ability signature.',
    'bungouarchive.com/exam',
  ].join('\n')
}

export function buildCharacterExamResult(
  rawScores: TraitVector,
): CharacterExamResult {
  const normalizedScores = normalizeTraitVector(rawScores)
  const factionRankings = rankFactions(normalizedScores)
  const assignedFaction = assignFaction(factionRankings)
  const factionCandidates = rankCharactersInFaction(
    normalizedScores,
    assignedFaction,
  ).slice(0, 3)
  const result: CharacterExamResult = {
    caseNumber: `${1000 + Math.floor(Math.random() * 9000)}`,
    assignedFaction,
    factionRankings,
    factionCandidates,
    normalizedScores,
    dominantTraits: dominantTraits(normalizedScores),
    description: generateMatchDescription(normalizedScores, assignedFaction),
    shareText: '',
  }

  result.shareText = buildShareText(result)
  return result
}
