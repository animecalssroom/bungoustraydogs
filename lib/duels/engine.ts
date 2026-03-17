import { DUEL_MAX_ROUNDS } from './shared'

export type EngineMove = 'strike' | 'stance' | 'gambit' | 'special' | 'recover'

export type EngineActor = {
  id: string
  name: string
  slug: string | null
  hp: number
  maxHp: number
  move: EngineMove
}

export type EngineRoundRecord = {
  round_number: number
  challenger_move: EngineMove | null
  defender_move: EngineMove | null
  challenger_hp_after?: number | null
  defender_hp_after?: number | null
  special_events?: Array<Record<string, unknown>> | null
}

export type EngineCooldown = {
  duel_id?: string
  user_id: string
  ability_type: 'special' | 'recover'
  locked_until_round: number
}

export type EngineInput = {
  roundNumber: number
  challenger: EngineActor
  defender: EngineActor
  previousRounds: EngineRoundRecord[]
  cooldowns: EngineCooldown[]
}

export type EngineOutput = {
  challengerMove: EngineMove
  defenderMove: EngineMove
  challengerDamage: number
  defenderDamage: number
  challengerHpAfter: number
  defenderHpAfter: number
  challengerMaxHpAfter: number
  defenderMaxHpAfter: number
  duelOver: boolean
  winnerId: string | null
  loserId: string | null
  specialEvents: Array<Record<string, unknown>>
  cooldownWrites: Array<EngineCooldown>
}

type SpecialConfig = {
  cooldown: number
  oncePerDuel?: boolean
}

type MoveOutcome = {
  damage: number
  heal: number
  defenseMultiplier: number
  ignoreDefense: boolean
  selfDamage: number
  invalidAboveThreshold?: boolean
  nullifyOpponentSpecial?: boolean
  shield?: boolean
  skipOpponent?: boolean
  setHpTo?: number
  untargetable?: boolean
  absorbReflect?: boolean
  extendOpponentCooldown?: number
  freezeOpponentSpecial?: number
  forceOpponentRecover?: boolean
  extraRoundDamage?: number
  reduceOpponentMaxHp?: number
  absorbCap?: number
  revealOpponentMove?: boolean
  delayDamage?: number
  stripCategory?: 'attack' | 'defend' | 'gamble' | 'special' | 'recover'
}

const SPECIAL_CONFIG: Record<string, SpecialConfig> = {
  'atsushi-nakajima': { cooldown: 99, oncePerDuel: true },
  'osamu-dazai': { cooldown: 2 },
  'doppo-kunikida': { cooldown: 99, oncePerDuel: true },
  'ranpo-edogawa': { cooldown: 99, oncePerDuel: true },
  'akiko-yosano': { cooldown: 99, oncePerDuel: true },
  'junichirou-tanizaki': { cooldown: 3 },
  'kyouka-izumi': { cooldown: 2 },
  'kenji-miyazawa': { cooldown: 99, oncePerDuel: true },
  'edgar-allan-poe': { cooldown: 99, oncePerDuel: true },
  'chuuya-nakahara': { cooldown: 2 },
  'ryunosuke-akutagawa': { cooldown: 2 },
  'kouyou-ozaki': { cooldown: 99, oncePerDuel: true },
  'gin-akutagawa': { cooldown: 3 },
  'ichiyou-higuchi': { cooldown: 99, oncePerDuel: true },
  'michizou-tachihara': { cooldown: 2 },
  'michizou-tachihara-dogs': { cooldown: 2 },
  'lucy-montgomery': { cooldown: 3 },
  'john-steinbeck': { cooldown: 2 },
  'herman-melville': { cooldown: 99, oncePerDuel: true },
  'mark-twain': { cooldown: 3 },
  'louisa-alcott': { cooldown: 99, oncePerDuel: true },
  'tetchou-suehiro': { cooldown: 2 },
  'saigiku-jouno': { cooldown: 99, oncePerDuel: true },
  'teruko-okura': { cooldown: 99, oncePerDuel: true },
  'ango-sakaguchi': { cooldown: 99, oncePerDuel: true },
  'yukichi-fukuzawa': { cooldown: 2 },
  'ogai-mori': { cooldown: 3 },
  'francis-fitzgerald': { cooldown: 2 },
  'fukuchi-ouchi': { cooldown: 2 },
  'fyodor-dostoevsky': { cooldown: 99, oncePerDuel: true },
  'nikolai-gogol': { cooldown: 99, oncePerDuel: true },
  'sakunosuke-oda': { cooldown: 2 },
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hasEvent(previousRounds: EngineRoundRecord[], type: string, actor: 'challenger' | 'defender') {
  return previousRounds.some((round) =>
    (round.special_events ?? []).some((event) => event.type === type && event.actor === actor),
  )
}


function consecutiveNonSpecialRounds(previousRounds: EngineRoundRecord[], actor: 'challenger' | 'defender') {
  let count = 0
  for (let index = previousRounds.length - 1; index >= 0; index -= 1) {
    const move = actor === 'challenger' ? previousRounds[index]?.challenger_move : previousRounds[index]?.defender_move
    if (move === 'special') {
      break
    }
    count += 1
  }
  return count
}


function isOnCooldown(cooldowns: EngineCooldown[], userId: string, roundNumber: number) {
  return cooldowns.some((cooldown) => cooldown.user_id === userId && cooldown.ability_type === 'special' && cooldown.locked_until_round > roundNumber)
}

function baseMoveOutcome(move: EngineMove, slug: string | null): MoveOutcome {
  if (move === 'recover') {
    return { damage: 0, heal: 20, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
  }
  if (move === 'stance') {
    return { damage: randomInt(10, 15), heal: 0, defenseMultiplier: 0.6, ignoreDefense: false, selfDamage: 0 }
  }
  if (move === 'gambit') {
    const threshold = slug === 'michizou-tachihara' || slug === 'michizou-tachihara-dogs' ? 0.4 : 0.5
    const success = Math.random() >= threshold
    return { damage: success ? 50 : 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
  }
  if (move === 'special') {
    return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
  }
  return { damage: randomInt(25, 35), heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
}

function getSpecialEffect(slug: string | null, currentHp: number, actor: 'challenger' | 'defender'): MoveOutcome {
  switch (slug) {
    case 'atsushi-nakajima':
      return currentHp <= 30
        ? { damage: 40, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
        : { damage: 30, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, invalidAboveThreshold: true }
    case 'osamu-dazai':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, nullifyOpponentSpecial: true }
    case 'doppo-kunikida':
      return { damage: 0, heal: 0, defenseMultiplier: 0, ignoreDefense: false, selfDamage: 0, shield: true }
    case 'ranpo-edogawa':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, skipOpponent: true }
    case 'akiko-yosano':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, setHpTo: 50 }
    case 'junichirou-tanizaki':
      return { damage: 0, heal: 0, defenseMultiplier: 0, ignoreDefense: false, selfDamage: 0, untargetable: true }
    case 'kyouka-izumi':
      return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: true, selfDamage: 0 }
    case 'kenji-miyazawa':
      return { damage: 0, heal: 0, defenseMultiplier: 0, ignoreDefense: false, selfDamage: 0, absorbReflect: true }
    case 'edgar-allan-poe':
      return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
    case 'chuuya-nakahara':
      return { damage: 50, heal: 0, defenseMultiplier: 1, ignoreDefense: true, selfDamage: 0 }
    case 'ryunosuke-akutagawa':
      return { damage: 45, heal: 0, defenseMultiplier: 1, ignoreDefense: true, selfDamage: 0 }
    case 'kouyou-ozaki':
      return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, extendOpponentCooldown: 1 }
    case 'gin-akutagawa':
      return { damage: 30, heal: 0, defenseMultiplier: 0, ignoreDefense: false, selfDamage: 0, untargetable: true }
    case 'ichiyou-higuchi':
      return { damage: 0, heal: 0, defenseMultiplier: 0.5, ignoreDefense: false, selfDamage: 0 }
    case 'michizou-tachihara':
    case 'michizou-tachihara-dogs':
      return { damage: 40, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, freezeOpponentSpecial: 1 }
    case 'lucy-montgomery':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, skipOpponent: true }
    case 'john-steinbeck':
      return { damage: 45, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, extraRoundDamage: 5 }
    case 'herman-melville':
      return { damage: 60, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 20 }
    case 'mark-twain':
      return { damage: 0, heal: 0, defenseMultiplier: 0, ignoreDefense: false, selfDamage: 0, untargetable: true }
    case 'louisa-alcott':
      return { damage: 0, heal: 30, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
    case 'tetchou-suehiro':
      return { damage: 55, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
    case 'saigiku-jouno':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, forceOpponentRecover: true }
    case 'teruko-okura':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, reduceOpponentMaxHp: 20 }
    case 'ango-sakaguchi':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, freezeOpponentSpecial: 2 }
    case 'yukichi-fukuzawa':
      return { damage: 30, heal: 0, defenseMultiplier: 1, ignoreDefense: true, selfDamage: 0 }
    case 'ogai-mori':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, absorbCap: 30 }
    case 'francis-fitzgerald':
      return currentHp > 30
        ? { damage: 65, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 20 }
        : { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, invalidAboveThreshold: true }
    case 'fukuchi-ouchi':
      return { damage: 45, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
    case 'fyodor-dostoevsky':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, reduceOpponentMaxHp: 30 }
    case 'nikolai-gogol':
       return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
    case 'sakunosuke-oda':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, revealOpponentMove: true }
    case 'edgar-allan-poe':
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, delayDamage: 40 }
    case 'lucy-montgomery':
      const categories: MoveOutcome['stripCategory'][] = ['attack', 'defend', 'gamble', 'special']
      const strip = categories[Math.floor(Math.random() * categories.length)]
      return { damage: 0, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0, stripCategory: strip }
    default:
      return { damage: 35, heal: 0, defenseMultiplier: 1, ignoreDefense: false, selfDamage: 0 }
  }
}


export function specialCooldownForSlug(slug: string | null | undefined) {
  if (!slug) return 2
  return SPECIAL_CONFIG[slug]?.cooldown ?? 2
}

export function resolveDuelRound(input: EngineInput): EngineOutput {
  const specialEvents: Array<Record<string, unknown>> = []
  const cooldownWrites: Array<EngineCooldown> = []

  let challengerMove = input.challenger.move
  let defenderMove = input.defender.move

  if (challengerMove === 'special' && isOnCooldown(input.cooldowns, input.challenger.id, input.roundNumber)) {
    challengerMove = 'strike'
    specialEvents.push({ type: 'cooldown_override', actor: 'challenger', description: 'Special was still on cooldown and resolved as Strike instead.' })
  }
  if (defenderMove === 'special' && isOnCooldown(input.cooldowns, input.defender.id, input.roundNumber)) {
    defenderMove = 'strike'
    specialEvents.push({ type: 'cooldown_override', actor: 'defender', description: 'Special was still on cooldown and resolved as Strike instead.' })
  }

  let challengerData = challengerMove === 'special'
    ? getSpecialEffect(input.challenger.slug, input.challenger.hp, 'challenger')
    : baseMoveOutcome(challengerMove, input.challenger.slug)
  let defenderData = defenderMove === 'special'
    ? getSpecialEffect(input.defender.slug, input.defender.hp, 'defender')
    : baseMoveOutcome(defenderMove, input.defender.slug)

  if (challengerMove === 'special' && challengerData.invalidAboveThreshold) {
    challengerMove = 'strike'
    challengerData = baseMoveOutcome('strike', input.challenger.slug)
    specialEvents.push({ type: 'invalid_special', actor: 'challenger', description: `${input.challenger.name} could not use their special under current conditions.` })
  }
  if (defenderMove === 'special' && defenderData.invalidAboveThreshold) {
    defenderMove = 'strike'
    defenderData = baseMoveOutcome('strike', input.defender.slug)
    specialEvents.push({ type: 'invalid_special', actor: 'defender', description: `${input.defender.name} could not use their special under current conditions.` })
  }

  if (challengerData.forceOpponentRecover) {
    defenderMove = 'recover'
    defenderData = baseMoveOutcome('recover', input.defender.slug)
    specialEvents.push({ type: 'forced_recover', actor: 'challenger', description: `${input.challenger.name} forces the opponent into Recover.` })
  }
  if (defenderData.forceOpponentRecover) {
    challengerMove = 'recover'
    challengerData = baseMoveOutcome('recover', input.challenger.slug)
    specialEvents.push({ type: 'forced_recover', actor: 'defender', description: `${input.defender.name} forces the opponent into Recover.` })
  }

  if (challengerData.nullifyOpponentSpecial && defenderMove === 'special') {
    defenderData.damage = 0
    defenderData.heal = 0
    specialEvents.push({ type: 'special_nullified', actor: 'challenger', description: `${input.challenger.name} nullifies the opposing special.` })
  }
  if (defenderData.nullifyOpponentSpecial && challengerMove === 'special') {
    challengerData.damage = 0
    challengerData.heal = 0
    specialEvents.push({ type: 'special_nullified', actor: 'defender', description: `${input.defender.name} nullifies the opposing special.` })
  }

  if (input.challenger.slug === 'kouyou-ozaki' && defenderMove === 'special' && Math.random() < 0.2) {
    defenderData.damage = 0
    defenderData.heal = 0
    specialEvents.push({ type: 'special_intercepted', actor: 'challenger', description: `${input.challenger.name} intercepts the opposing special before it fully resolves.` })
  }
  if (input.defender.slug === 'kouyou-ozaki' && challengerMove === 'special' && Math.random() < 0.2) {
    challengerData.damage = 0
    challengerData.heal = 0
    specialEvents.push({ type: 'special_intercepted', actor: 'defender', description: `${input.defender.name} intercepts the opposing special before it fully resolves.` })
  }

  if (challengerData.skipOpponent) {
    defenderData.damage = 0
    specialEvents.push({ type: 'opponent_skipped', actor: 'challenger', description: `${input.defender.name}'s move is stripped of effect this round.` })
  }
  if (defenderData.skipOpponent) {
    challengerData.damage = 0
    specialEvents.push({ type: 'opponent_skipped', actor: 'defender', description: `${input.challenger.name}'s move is stripped of effect this round.` })
  }

  if (challengerMove === 'strike' && input.challenger.slug === 'doppo-kunikida') {
    challengerData.damage += 5
  }
  if (defenderMove === 'strike' && input.defender.slug === 'doppo-kunikida') {
    defenderData.damage += 5
  }

  if (challengerMove === 'strike' && input.challenger.slug === 'ryunosuke-akutagawa') {
    challengerData.damage += Math.min(15, consecutiveNonSpecialRounds(input.previousRounds, 'challenger') * 3)
  }
  if (defenderMove === 'strike' && input.defender.slug === 'ryunosuke-akutagawa') {
    defenderData.damage += Math.min(15, consecutiveNonSpecialRounds(input.previousRounds, 'defender') * 3)
  }

  if (input.challenger.slug === 'atsushi-nakajima' && input.challenger.hp <= 30) {
    challengerData.damage *= 2
    specialEvents.push({ type: 'atsushi_beast_activated', actor: 'challenger', description: `${input.challenger.name}'s damage surges under beast pressure.` })
  }
  if (input.defender.slug === 'atsushi-nakajima' && input.defender.hp <= 30) {
    defenderData.damage *= 2
    specialEvents.push({ type: 'atsushi_beast_activated', actor: 'defender', description: `${input.defender.name}'s damage surges under beast pressure.` })
  }

  if (input.challenger.slug === 'chuuya-nakahara' && input.challenger.hp < 40) {
    challengerData.damage += 8
    specialEvents.push({ type: 'gravity_overload', actor: 'challenger', description: `${input.challenger.name} enters gravity overload and strikes harder.` })
  }
  if (input.defender.slug === 'chuuya-nakahara' && input.defender.hp < 40) {
    defenderData.damage += 8
    specialEvents.push({ type: 'gravity_overload', actor: 'defender', description: `${input.defender.name} enters gravity overload and strikes harder.` })
  }

  if (input.challenger.slug === 'gin-akutagawa' && challengerMove === 'strike' && defenderMove === 'strike') {
    challengerData.damage += 12
    defenderData.damage = Math.floor(defenderData.damage * 0.5)
  }
  if (input.defender.slug === 'gin-akutagawa' && challengerMove === 'strike' && defenderMove === 'strike') {
    defenderData.damage += 12
    challengerData.damage = Math.floor(challengerData.damage * 0.5)
  }

  if (input.challenger.slug === 'john-steinbeck') {
    challengerData.damage += 5
  }
  if (input.defender.slug === 'john-steinbeck') {
    defenderData.damage += 5
  }

  if (input.challenger.slug === 'francis-fitzgerald') {
    challengerData.damage += Math.floor(Math.max(0, input.challenger.maxHp - input.challenger.hp) / 20) * 3
  }
  if (input.defender.slug === 'francis-fitzgerald') {
    defenderData.damage += Math.floor(Math.max(0, input.defender.maxHp - input.defender.hp) / 20) * 3
  }


  if ((input.challenger.slug === 'atsushi-nakajima' && input.defender.slug === 'ryunosuke-akutagawa') || (input.challenger.slug === 'ryunosuke-akutagawa' && input.defender.slug === 'atsushi-nakajima')) {
    challengerData.damage += 10
    defenderData.damage += 10
  }
  if ((input.challenger.slug === 'osamu-dazai' && input.defender.slug === 'chuuya-nakahara') || (input.challenger.slug === 'chuuya-nakahara' && input.defender.slug === 'osamu-dazai')) {
    challengerData.damage += 5
    defenderData.damage += 5
  }
  if (input.challenger.slug === 'osamu-dazai' && input.defender.slug === 'ryunosuke-akutagawa') {
    defenderData.damage += 5
  }
  if (input.defender.slug === 'osamu-dazai' && input.challenger.slug === 'ryunosuke-akutagawa') {
    challengerData.damage += 5
  }
  if (input.challenger.slug === 'sakunosuke-oda' && input.defender.slug === 'ryunosuke-akutagawa') {
    challengerData.damage += 8
  }
  if (input.defender.slug === 'sakunosuke-oda' && input.challenger.slug === 'ryunosuke-akutagawa') {
    defenderData.damage += 8
  }

  let challengerDefenseMultiplier = challengerMove === 'stance' ? (input.challenger.slug === 'junichirou-tanizaki' ? 0.4 : 0.6) : 1
  let defenderDefenseMultiplier = defenderMove === 'stance' ? (input.defender.slug === 'junichirou-tanizaki' ? 0.4 : 0.6) : 1

  if (challengerData.shield || challengerData.untargetable) {
    challengerDefenseMultiplier = 0
  }
  if (defenderData.shield || defenderData.untargetable) {
    defenderDefenseMultiplier = 0
  }
  if (challengerData.absorbCap != null) {
    challengerDefenseMultiplier = 1
  }
  if (defenderData.absorbCap != null) {
    defenderDefenseMultiplier = 1
  }

  let incomingToChallenger = defenderData.ignoreDefense ? defenderData.damage : Math.round(defenderData.damage * challengerDefenseMultiplier)
  let incomingToDefender = challengerData.ignoreDefense ? challengerData.damage : Math.round(challengerData.damage * defenderDefenseMultiplier)

  // Poe: Delayed Trap
  if (hasEvent(input.previousRounds, 'trap_armed', 'challenger')) {
    incomingToDefender += 40
    specialEvents.push({ type: 'trap_detonated', actor: 'challenger', description: "Poe's Black Cat trap detonates." })
  }
  if (hasEvent(input.previousRounds, 'trap_armed', 'defender')) {
    incomingToChallenger += 40
    specialEvents.push({ type: 'trap_detonated', actor: 'defender', description: "Poe's Black Cat trap detonates." })
  }

  if (challengerData.delayDamage) {
    specialEvents.push({ type: 'trap_armed', actor: 'challenger', description: "Poe arms a Black Cat trap for the next round." })
  }
  if (defenderData.delayDamage) {
    specialEvents.push({ type: 'trap_armed', actor: 'defender', description: "Poe arms a Black Cat trap for the next round." })
  }

  if (input.challenger.slug === 'kyouka-izumi') {
    incomingToChallenger = Math.max(0, incomingToChallenger - 5)
  }
  if (input.defender.slug === 'kyouka-izumi') {
    incomingToDefender = Math.max(0, incomingToDefender - 5)
  }
  if (input.challenger.slug === 'mark-twain') {
    incomingToChallenger = Math.floor(incomingToChallenger * 0.8)
  }
  if (input.defender.slug === 'mark-twain') {
    incomingToDefender = Math.floor(incomingToDefender * 0.8)
  }
  if (input.challenger.slug === 'fyodor-dostoevsky' && ['strike', 'gambit'].includes(defenderMove)) {
    incomingToChallenger = Math.max(0, incomingToChallenger - 15)
  }
  if (input.defender.slug === 'fyodor-dostoevsky' && ['strike', 'gambit'].includes(challengerMove)) {
    incomingToDefender = Math.max(0, incomingToDefender - 15)
  }
  if (input.challenger.slug === 'chuuya-nakahara' && input.challenger.hp < 40) {
    incomingToChallenger += 5
  }
  if (input.defender.slug === 'chuuya-nakahara' && input.defender.hp < 40) {
    incomingToDefender += 5
  }
  if (input.challenger.slug === 'kenji-miyazawa' && input.challenger.hp < 20) {
    incomingToChallenger = 0
  }
  if (input.defender.slug === 'kenji-miyazawa' && input.defender.hp < 20) {
    incomingToDefender = 0
  }

  if (challengerData.absorbReflect) {
    defenderData.damage += Math.floor(incomingToChallenger * 0.5)
    incomingToChallenger = 0
    specialEvents.push({ type: 'reflect', actor: 'challenger', description: `${input.challenger.name} absorbs the round and reflects part of it back.` })
  }
  if (defenderData.absorbReflect) {
    challengerData.damage += Math.floor(incomingToDefender * 0.5)
    incomingToDefender = 0
    specialEvents.push({ type: 'reflect', actor: 'defender', description: `${input.defender.name} absorbs the round and reflects part of it back.` })
  }

  if (challengerData.absorbCap != null) {
    const overflow = Math.max(0, incomingToChallenger - challengerData.absorbCap)
    incomingToChallenger = overflow
    specialEvents.push({ type: 'shield_absorb', actor: 'challenger', description: `${input.challenger.name}'s shield body absorbs part of the round.` })
  }
  if (defenderData.absorbCap != null) {
    const overflow = Math.max(0, incomingToDefender - defenderData.absorbCap)
    incomingToDefender = overflow
    specialEvents.push({ type: 'shield_absorb', actor: 'defender', description: `${input.defender.name}'s shield body absorbs part of the round.` })
  }

  let challengerMaxHpAfter = input.challenger.maxHp
  let defenderMaxHpAfter = input.defender.maxHp
  if (challengerData.reduceOpponentMaxHp) {
    defenderMaxHpAfter = Math.max(50, defenderMaxHpAfter - challengerData.reduceOpponentMaxHp)
    specialEvents.push({ type: 'max_hp_reduced', actor: 'challenger', description: `${input.defender.name}'s maximum HP is permanently reduced.` })
  }
  if (defenderData.reduceOpponentMaxHp) {
    challengerMaxHpAfter = Math.max(50, challengerMaxHpAfter - defenderData.reduceOpponentMaxHp)
    specialEvents.push({ type: 'max_hp_reduced', actor: 'defender', description: `${input.challenger.name}'s maximum HP is permanently reduced.` })
  }

  let challengerHpAfter = Math.max(0, Math.min(challengerMaxHpAfter, input.challenger.hp - incomingToChallenger + challengerData.heal - challengerData.selfDamage))
  let defenderHpAfter = Math.max(0, Math.min(defenderMaxHpAfter, input.defender.hp - incomingToDefender + defenderData.heal - defenderData.selfDamage))

  if (challengerData.setHpTo != null) {
    challengerHpAfter = Math.max(challengerHpAfter, Math.min(challengerMaxHpAfter, challengerData.setHpTo))
    specialEvents.push({ type: 'set_hp', actor: 'challenger', description: `${input.challenger.name} resets their HP through their special.` })
  }
  if (defenderData.setHpTo != null) {
    defenderHpAfter = Math.max(defenderHpAfter, Math.min(defenderMaxHpAfter, defenderData.setHpTo))
    specialEvents.push({ type: 'set_hp', actor: 'defender', description: `${input.defender.name} resets their HP through their special.` })
  }

  if (input.challenger.slug === 'akiko-yosano' && challengerHpAfter <= 20 && !hasEvent(input.previousRounds, 'yosano_passive', 'challenger')) {
    challengerHpAfter = Math.max(challengerHpAfter, 50)
    specialEvents.push({ type: 'yosano_passive', actor: 'challenger', description: `${input.challenger.name} refuses collapse and returns to 50 HP.` })
  }
  if (input.defender.slug === 'akiko-yosano' && defenderHpAfter <= 20 && !hasEvent(input.previousRounds, 'yosano_passive', 'defender')) {
    defenderHpAfter = Math.max(defenderHpAfter, 50)
    specialEvents.push({ type: 'yosano_passive', actor: 'defender', description: `${input.defender.name} refuses collapse and returns to 50 HP.` })
  }

  if (input.challenger.slug === 'sakunosuke-oda' && incomingToChallenger > challengerData.damage) {
    challengerHpAfter = Math.min(challengerMaxHpAfter, challengerHpAfter + 8)
    specialEvents.push({ type: 'oda_heal', actor: 'challenger', description: `${input.challenger.name} recovers 8 HP after taking the worse exchange.` })
  }
  if (input.defender.slug === 'sakunosuke-oda' && incomingToDefender > defenderData.damage) {
    defenderHpAfter = Math.min(defenderMaxHpAfter, defenderHpAfter + 8)
    specialEvents.push({ type: 'oda_heal', actor: 'defender', description: `${input.defender.name} recovers 8 HP after taking the worse exchange.` })
  }

  if (challengerMove === 'special') {
    const config = SPECIAL_CONFIG[input.challenger.slug ?? '']
    cooldownWrites.push({
      duel_id: '',
      user_id: input.challenger.id,
      ability_type: 'special',
      locked_until_round: input.roundNumber + (config?.cooldown ?? 2),
    })
    if (challengerData.freezeOpponentSpecial) {
      cooldownWrites.push({
        duel_id: '',
        user_id: input.defender.id,
        ability_type: 'special',
        locked_until_round: input.roundNumber + 1 + challengerData.freezeOpponentSpecial,
      })
    }
    if (challengerData.extendOpponentCooldown) {
      cooldownWrites.push({
        duel_id: '',
        user_id: input.defender.id,
        ability_type: 'special',
        locked_until_round: input.roundNumber + 2,
      })
    }
  }
  if (defenderMove === 'special') {
    const config = SPECIAL_CONFIG[input.defender.slug ?? '']
    cooldownWrites.push({
      duel_id: '',
      user_id: input.defender.id,
      ability_type: 'special',
      locked_until_round: input.roundNumber + (config?.cooldown ?? 2),
    })
    if (defenderData.freezeOpponentSpecial) {
      cooldownWrites.push({
        duel_id: '',
        user_id: input.challenger.id,
        ability_type: 'special',
        locked_until_round: input.roundNumber + 1 + defenderData.freezeOpponentSpecial,
      })
    }
    if (defenderData.extendOpponentCooldown) {
      cooldownWrites.push({
        duel_id: '',
        user_id: input.challenger.id,
        ability_type: 'special',
        locked_until_round: input.roundNumber + 2,
      })
    }
  }

  const duelOver = challengerHpAfter <= 0 || defenderHpAfter <= 0 || input.roundNumber >= DUEL_MAX_ROUNDS
  const winnerId = challengerHpAfter === defenderHpAfter ? null : challengerHpAfter > defenderHpAfter ? input.challenger.id : input.defender.id
  const loserId = winnerId === input.challenger.id ? input.defender.id : winnerId === input.defender.id ? input.challenger.id : null

  return {
    challengerMove,
    defenderMove,
    challengerDamage: Math.max(0, challengerData.damage),
    defenderDamage: Math.max(0, defenderData.damage),
    challengerHpAfter,
    defenderHpAfter,
    challengerMaxHpAfter,
    defenderMaxHpAfter,
    duelOver,
    winnerId,
    loserId,
    specialEvents,
    cooldownWrites,
  }
}
