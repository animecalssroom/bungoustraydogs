import type { DefenceStance, WarzoneRole } from '@/backend/models/war-redis.model'

export type WarApproach = 'Frontal Assault' | 'Outmaneuver' | 'Ability Overload'
export type WarRevealField =
  | 'username'
  | 'rank'
  | 'character_name'
  | 'class_tag'
  | 'deployment_role'
  | 'stance'

export interface WarAbilityParticipant {
  user_id: string
  username: string
  faction: string | null
  rank: number
  character_slug: string | null
  character_name: string | null
  class_tag: string | null
  deployment_role: WarzoneRole
  deployment_stance: DefenceStance
  stat_power: number
  stat_speed: number
  stat_control: number
  is_recovering: boolean
}

export interface WarReconAbility {
  durationSeconds?: number
  revealFields?: WarRevealField[]
  strikeBonusAfterReveal?: number
  note?: string
}

export interface WarGuardAbility {
  defenseBonus?: number
  suppressApproaches?: WarApproach[]
  integrityOnDefenseWin?: number
  note?: string
}

export interface WarVanguardAbility {
  powerBonus?: number
  powerVsGuard?: number
  defenderPowerPenalty?: number
  integrityOnWin?: number
  bypassGuards?: boolean
  extendRecoveryHours?: number
  note?: string
}

export interface WarSupportAbility {
  integrityOnRevive?: number
  note?: string
}

export interface WarAbilityProfile {
  slug: string
  aliases?: string[]
  summary: string
  recon?: WarReconAbility
  guard?: WarGuardAbility
  vanguard?: WarVanguardAbility
  support?: WarSupportAbility
}

interface StrikeAbilityContext {
  attacker: WarAbilityParticipant
  defender: WarAbilityParticipant
  roster: WarAbilityParticipant[]
  hasRecon: boolean
  approach: WarApproach
}

export interface StrikeAbilityOutcome {
  attackerPowerBonus: number
  defenderPowerBonus: number
  integrityBonusOnWin: number
  integrityBonusOnDefenseWin: number
  loserRecoveryHours: number
  bypassGuards: boolean
  suppressedReason: string | null
  notes: string[]
}

export interface ReviveAbilityOutcome {
  integrityBonus: number
  note: string | null
}

export interface ReconAbilityOutcome {
  durationSeconds: number
  revealFields: WarRevealField[]
  note: string | null
}

const BASIC_REVEAL: WarRevealField[] = ['character_name', 'class_tag', 'deployment_role']
const TACTICAL_REVEAL: WarRevealField[] = ['character_name', 'class_tag', 'deployment_role', 'stance']
const FULL_REVEAL: WarRevealField[] = ['username', 'rank', 'character_name', 'class_tag', 'deployment_role', 'stance']

const DEFAULT_CLASS_ABILITIES: Record<string, Partial<WarAbilityProfile>> = {
  BRUTE: {
    summary: 'Front-line pressure specialist. Excels at breaking enemy positions and capitalizing on direct clashes.',
    vanguard: { powerBonus: 4, integrityOnWin: 1 },
    guard: { defenseBonus: 1 },
  },
  INTEL: {
    summary: 'Recon specialist. Reveals enemy placement and sharpens allied tactical accuracy after the battlefield is mapped.',
    recon: { durationSeconds: 43200, revealFields: BASIC_REVEAL, strikeBonusAfterReveal: 4 },
    vanguard: { defenderPowerPenalty: 1 },
  },
  SUPPORT: {
    summary: 'Stabilization specialist. Holds ground well and reinforces allies through recovery support.',
    support: { integrityOnRevive: 1 },
    guard: { defenseBonus: 3 },
  },
  ANOMALY: {
    summary: 'Unstable battlefield signature. Produces unusual pressure spikes and disruptive district effects.',
    vanguard: { powerBonus: 3, defenderPowerPenalty: 2 },
    guard: { defenseBonus: 2 },
  },
}

function mergeAbility(
  base: Partial<WarAbilityProfile>,
  slug: string,
  summary: string,
  overrides: Omit<WarAbilityProfile, 'slug' | 'summary'> = {},
): WarAbilityProfile {
  return {
    slug,
    summary,
    aliases: overrides.aliases ?? [],
    recon: { ...(base.recon ?? {}), ...(overrides.recon ?? {}) },
    guard: { ...(base.guard ?? {}), ...(overrides.guard ?? {}) },
    vanguard: { ...(base.vanguard ?? {}), ...(overrides.vanguard ?? {}) },
    support: { ...(base.support ?? {}), ...(overrides.support ?? {}) },
  }
}

const WAR_ABILITY_REGISTRY: Record<string, WarAbilityProfile> = {
  'nakajima-atsushi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'nakajima-atsushi',
    'Atsushi tears through entrenched lines and is especially dangerous against fixed guards.',
    { vanguard: { powerVsGuard: 9, integrityOnWin: 2 } },
  ),
  'dazai-osamu': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'dazai-osamu',
    'Dazai turns an entire defended sector into an anti-ability zone.',
    {
      recon: { durationSeconds: 57600, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 6 },
      guard: { defenseBonus: 8, suppressApproaches: ['Ability Overload'], note: 'No Longer Human suppresses hostile special surges in the sector.' },
      vanguard: { defenderPowerPenalty: 5, powerBonus: 4 },
    },
  ),
  'kunikida-doppo': mergeAbility(
    DEFAULT_CLASS_ABILITIES.SUPPORT,
    'kunikida-doppo',
    'Kunikida reinforces district structure and keeps defensive lines orderly under pressure.',
    { guard: { defenseBonus: 5 }, vanguard: { powerBonus: 3 } },
  ),
  'ranpo-edogawa': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'ranpo-edogawa',
    'Ranpo fully dissects the battlefield and exposes how the enemy guard line is arranged.',
    { recon: { durationSeconds: 64800, revealFields: FULL_REVEAL, strikeBonusAfterReveal: 8 } },
  ),
  'akiko-yosano': mergeAbility(
    DEFAULT_CLASS_ABILITIES.SUPPORT,
    'akiko-yosano',
    'Yosano restores operatives fast enough to swing district stability back toward her faction.',
    { support: { integrityOnRevive: 3, note: 'Thou Shalt Not Die restores district morale as the operative returns.' } },
  ),
  'junichiro-tanizaki': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'junichiro-tanizaki',
    'Tanizaki deepens battlefield concealment, making defensive signatures harder to parse before recon.',
    { guard: { defenseBonus: 6 }, vanguard: { powerBonus: 4 } },
  ),
  'naomi-tanizaki': mergeAbility(
    DEFAULT_CLASS_ABILITIES.SUPPORT,
    'naomi-tanizaki',
    'Naomi keeps support channels stable and helps the district recover after a successful revive.',
    { support: { integrityOnRevive: 2 } },
  ),
  'kyouka-izumi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'kyouka-izumi',
    'Kyouka specializes in cutting down posted defenders before they can recover formation.',
    { vanguard: { powerVsGuard: 8, powerBonus: 4 } },
  ),
  'kenji-miyazawa': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'kenji-miyazawa',
    'Kenji creates breakthrough momentum that keeps an assault moving once he wins an exchange.',
    { vanguard: { powerBonus: 7, integrityOnWin: 1 } },
  ),
  'fukuzawa-yukichi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'fukuzawa-yukichi',
    'Fukuzawa reads the district calmly and keeps allied defense from collapsing under stress.',
    {
      recon: { durationSeconds: 54000, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 5 },
      guard: { defenseBonus: 6 },
    },
  ),
  'nakahara-chuuya': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'nakahara-chuuya',
    'Chuuya applies overwhelming district pressure and leaves defeated enemies down longer.',
    { vanguard: { powerBonus: 10, integrityOnWin: 3, extendRecoveryHours: 6 } },
  ),
  'akutagawa-ryunosuke': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'akutagawa-ryunosuke',
    'Akutagawa is built to shred static guard lines and punish entrenched defenders.',
    { vanguard: { powerVsGuard: 9, defenderPowerPenalty: 4 } },
  ),
  'mori-ogai': mergeAbility(
    DEFAULT_CLASS_ABILITIES.SUPPORT,
    'mori-ogai',
    'Mori coordinates district defense and turns each successful stabilization into renewed tactical pressure.',
    {
      guard: { defenseBonus: 7 },
      support: { integrityOnRevive: 2, note: 'Elise reorganizes the front while the operative recovers.' },
    },
  ),
  'ozaki-kouyou': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'ozaki-kouyou',
    'Kouyou makes guard duty deadly and punishes attackers who overextend into her line.',
    { guard: { defenseBonus: 6, integrityOnDefenseWin: 2 }, vanguard: { powerBonus: 4 } },
  ),
  'tachihara-michizou': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'tachihara-michizou',
    'Tachihara identifies positioning weaknesses and turns exposed cover into immediate openings.',
    {
      recon: { durationSeconds: 43200, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 4 },
      vanguard: { powerBonus: 5 },
    },
  ),
  'edgar-allan-poe': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'edgar-allan-poe',
    'Poe traps enemy movement patterns and reveals how their district defense is scripted.',
    {
      recon: { durationSeconds: 50400, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 7 },
      guard: { defenseBonus: 4 },
    },
  ),
  'fitzgerald': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'fitzgerald',
    'Fitzgerald converts resource pressure into faster district collapse after each win.',
    { vanguard: { powerBonus: 8, integrityOnWin: 2 } },
  ),
  'lucy-montgomery': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'lucy-montgomery',
    'Lucy can turn a district sector into a trap room that blunts frontal assaults.',
    { guard: { defenseBonus: 7, suppressApproaches: ['Frontal Assault'] }, vanguard: { powerBonus: 4 } },
  ),
  'john-steinbeck': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'john-steinbeck',
    'Steinbeck creates steady front-line attrition and keeps defensive terrain alive.',
    { guard: { defenseBonus: 4, integrityOnDefenseWin: 1 }, vanguard: { powerBonus: 5 } },
  ),
  'louisa-may-alcott': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'louisa-may-alcott',
    'Louisa refines tactical readouts and gives her faction cleaner attack windows after recon.',
    { recon: { durationSeconds: 50400, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 5 } },
  ),
  'teruko-okura': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'teruko-okura',
    'Teruko turns a successful clash into immediate territorial pressure.',
    { guard: { defenseBonus: 4 }, vanguard: { powerBonus: 7, integrityOnWin: 1 } },
  ),
  'tetchou-suehiro': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'tetchou-suehiro',
    'Tetchou cuts through fixed lines and is most dangerous when a guard has to hold position.',
    { vanguard: { powerVsGuard: 7, powerBonus: 4 } },
  ),
  'jouno-saigiku': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'jouno-saigiku',
    'Jouno reads placement distortions and exposes how defenders are layered inside the district.',
    {
      recon: { durationSeconds: 57600, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 6 },
      guard: { defenseBonus: 5 },
    },
  ),
  'fukuchi-ouchi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'fukuchi-ouchi',
    'Fukuchi dominates both assault and defense, warping the entire district around command pressure.',
    { guard: { defenseBonus: 9, integrityOnDefenseWin: 2 }, vanguard: { powerBonus: 9, integrityOnWin: 2 } },
  ),
  'ango-sakaguchi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'ango-sakaguchi',
    'Ango reconstructs the district file and reveals how enemy guard formations were arranged.',
    {
      recon: { durationSeconds: 57600, revealFields: FULL_REVEAL, strikeBonusAfterReveal: 5 },
      guard: { defenseBonus: 4, suppressApproaches: ['Outmaneuver'] },
    },
  ),
  'minoura-motoji': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'minoura-motoji',
    'Minoura keeps a clean intelligence channel and makes enemy placement easier to classify.',
    { recon: { durationSeconds: 46800, revealFields: BASIC_REVEAL, strikeBonusAfterReveal: 4 } },
  ),
  'taneda-santoka': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'taneda-santoka',
    'Taneda stabilizes the information chain and strengthens recon-led operations.',
    { recon: { durationSeconds: 46800, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 4 }, guard: { defenseBonus: 3 } },
  ),
  'fyodor-dostoyevsky': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'fyodor-dostoyevsky',
    'Fyodor poisons the front line, making direct assaults riskier and losses last longer.',
    {
      aliases: ['fyodor-dostoevsky'],
      recon: { durationSeconds: 50400, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 5 },
      guard: { defenseBonus: 7, suppressApproaches: ['Frontal Assault'] },
      vanguard: { extendRecoveryHours: 6 },
    },
  ),
  'nikolai-gogol': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'nikolai-gogol',
    'Nikolai breaks expected lines of engagement and can slip past posted guards.',
    { vanguard: { powerBonus: 5, bypassGuards: true }, guard: { defenseBonus: 3 } },
  ),
  'sigma': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'sigma',
    'Sigma turns exposed information into immediate leverage once the district has been scouted.',
    { vanguard: { defenderPowerPenalty: 4, powerBonus: 4 } },
  ),
  'bram-stoker': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'bram-stoker',
    'Bram makes a defended district harder to dislodge once a front line is established.',
    { guard: { defenseBonus: 8, integrityOnDefenseWin: 1 } },
  ),
  'alexander-pushkin': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'alexander-pushkin',
    'Pushkin turns each victory into a lingering infection that slows the enemy return to battle.',
    { guard: { defenseBonus: 5, suppressApproaches: ['Frontal Assault'] }, vanguard: { extendRecoveryHours: 6 } },
  ),
  'ivan-goncharov': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'ivan-goncharov',
    'Goncharov excels at holding the line and converting a defense into a punishing counterblow.',
    { guard: { defenseBonus: 7 }, vanguard: { powerBonus: 6 } },
  ),
  'nathaniel-hawthorne': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'nathaniel-hawthorne',
    'Hawthorne saturates the district with corrosive pressure that punishes reckless surges.',
    { guard: { defenseBonus: 6, suppressApproaches: ['Ability Overload'] }, vanguard: { powerBonus: 3 } },
  ),
  'margaret-mitchell': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'margaret-mitchell',
    'Margaret distorts the battlefield and improves a sector’s defensive endurance.',
    { guard: { defenseBonus: 5 }, vanguard: { defenderPowerPenalty: 2 } },
  ),
  'herman-melville': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'herman-melville',
    'Melville brings crushing district-scale weight to both assault and defense.',
    { guard: { defenseBonus: 8 }, vanguard: { powerBonus: 6 } },
  ),
  'mark-twain': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'mark-twain',
    'Mark pressures exposed targets after a line has already been revealed.',
    { vanguard: { powerBonus: 6, defenderPowerPenalty: 2 } },
  ),
  'hp-lovecraft': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'hp-lovecraft',
    'Lovecraft turns a defended district into a nightmare to clear by force.',
    { guard: { defenseBonus: 10 }, vanguard: { powerBonus: 8 } },
  ),
  'ryuuro-hirotsu': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'ryuuro-hirotsu',
    'Hirotsu anchors a disciplined defense and punishes impatience.',
    { guard: { defenseBonus: 5 } },
  ),
  'ichiyou-higuchi': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'ichiyou-higuchi',
    'Higuchi keeps formation steady and supports allied front-line pressure.',
    {
      aliases: ['higuchi-ichiyo'],
      guard: { defenseBonus: 4 },
      vanguard: { powerBonus: 2 },
    },
  ),
  'kyusaku-yumeno': mergeAbility(
    DEFAULT_CLASS_ABILITIES.ANOMALY,
    'kyusaku-yumeno',
    'Q contaminates a sector and makes straightforward assaults far more dangerous.',
    { guard: { defenseBonus: 7, suppressApproaches: ['Frontal Assault'] }, vanguard: { defenderPowerPenalty: 6 } },
  ),
  'natsume-soseki': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'natsume-soseki',
    'Natsume exerts invisible control over a district and quietly corrects defensive gaps.',
    {
      recon: { durationSeconds: 54000, revealFields: TACTICAL_REVEAL, strikeBonusAfterReveal: 5 },
      guard: { defenseBonus: 8 },
    },
  ),
  'mushitaro-oguri': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'mushitaro-oguri',
    'Mushitaro strips away evidence of the enemy layout until proper recon breaks the seal.',
    { recon: { durationSeconds: 46800, revealFields: ['character_name', 'deployment_role'], strikeBonusAfterReveal: 4 }, guard: { defenseBonus: 4 } },
  ),
  'katai-tayama': mergeAbility(
    DEFAULT_CLASS_ABILITIES.INTEL,
    'katai-tayama',
    'Katai monitors the district remotely and improves stance-level battlefield reads.',
    { recon: { durationSeconds: 43200, revealFields: ['deployment_role', 'stance', 'class_tag'], strikeBonusAfterReveal: 4 } },
  ),
  'sakunosuke-oda': mergeAbility(
    DEFAULT_CLASS_ABILITIES.BRUTE,
    'sakunosuke-oda',
    'Oda reads a clash a heartbeat ahead and keeps his faction from wasting clean attack windows.',
    { guard: { defenseBonus: 4 }, vanguard: { powerBonus: 5 } },
  ),
}

export function normalizeWarCharacterSlug(slug: string | null | undefined) {
  if (!slug) return null

  for (const [key, profile] of Object.entries(WAR_ABILITY_REGISTRY)) {
    if (slug === key || profile.aliases?.includes(slug)) {
      return key
    }
  }

  return slug
}

export function getWarAbilityProfile(slug: string | null | undefined, classTag: string | null | undefined): WarAbilityProfile {
  const normalized = normalizeWarCharacterSlug(slug)
  if (normalized && WAR_ABILITY_REGISTRY[normalized]) {
    return WAR_ABILITY_REGISTRY[normalized]
  }

  const base = DEFAULT_CLASS_ABILITIES[classTag ?? ''] ?? DEFAULT_CLASS_ABILITIES.BRUTE
  return mergeAbility(base, normalized ?? 'unknown-operative', base.summary ?? 'Unregistered war operative.', {})
}

export function canUseWarRecon(slug: string | null | undefined, classTag: string | null | undefined) {
  const profile = getWarAbilityProfile(slug, classTag)
  return Boolean(profile.recon)
}

export function getReconAbilityOutcome(slug: string | null | undefined, classTag: string | null | undefined): ReconAbilityOutcome {
  const profile = getWarAbilityProfile(slug, classTag)
  const recon = profile.recon ?? DEFAULT_CLASS_ABILITIES.INTEL.recon ?? {}
  return {
    durationSeconds: recon.durationSeconds ?? 43200,
    revealFields: recon.revealFields ?? BASIC_REVEAL,
    note: recon.note ?? profile.summary,
  }
}

export function getStrikeAbilityOutcome({
  attacker,
  defender,
  roster,
  hasRecon,
  approach,
}: StrikeAbilityContext): StrikeAbilityOutcome {
  const attackerAbility = getWarAbilityProfile(attacker.character_slug, attacker.class_tag)
  const defenderAbility = getWarAbilityProfile(defender.character_slug, defender.class_tag)
  const activeEnemyGuards = roster.filter(
    (entry) => entry.faction === defender.faction && entry.deployment_role === 'guard' && !entry.is_recovering,
  )
  const supportingGuards = activeEnemyGuards.filter((entry) => entry.user_id !== defender.user_id)

  const suppressedApproaches = new Set<WarApproach>()
  let defenderPowerBonus = 0
  let integrityBonusOnDefenseWin = 0
  const notes: string[] = []

  for (const guard of supportingGuards) {
    const ability = getWarAbilityProfile(guard.character_slug, guard.class_tag)
    const guardBuff = ability.guard?.defenseBonus ?? 0
    if (guardBuff > 0) defenderPowerBonus += guardBuff
    if (ability.guard?.integrityOnDefenseWin) integrityBonusOnDefenseWin += ability.guard.integrityOnDefenseWin
    for (const suppressed of ability.guard?.suppressApproaches ?? []) {
      suppressedApproaches.add(suppressed)
    }
    if (ability.guard?.note) {
      notes.push(`${guard.character_name ?? guard.username}: ${ability.guard.note}`)
    }
  }

  const attackerPowerBonus =
    (attackerAbility.vanguard?.powerBonus ?? 0) +
    (defender.deployment_role === 'guard' ? attackerAbility.vanguard?.powerVsGuard ?? 0 : 0) +
    (hasRecon ? attackerAbility.recon?.strikeBonusAfterReveal ?? 0 : 0)

  defenderPowerBonus += defenderAbility.guard?.defenseBonus ?? 0
  defenderPowerBonus -= attackerAbility.vanguard?.defenderPowerPenalty ?? 0

  const suppressedReason = suppressedApproaches.has(approach)
    ? `The district guard line suppresses ${approach.toUpperCase()} in this sector.`
    : null

  if (attackerAbility.vanguard?.note) notes.push(attackerAbility.vanguard.note)
  if (defenderAbility.guard?.note && defender.deployment_role === 'guard') notes.push(defenderAbility.guard.note)

  return {
    attackerPowerBonus,
    defenderPowerBonus,
    integrityBonusOnWin: attackerAbility.vanguard?.integrityOnWin ?? 0,
    integrityBonusOnDefenseWin,
    loserRecoveryHours: 24 + (attackerAbility.vanguard?.extendRecoveryHours ?? 0),
    bypassGuards: attackerAbility.vanguard?.bypassGuards ?? false,
    suppressedReason,
    notes,
  }
}

export function getReviveAbilityOutcome(
  healerSlug: string | null | undefined,
  healerClassTag: string | null | undefined,
): ReviveAbilityOutcome {
  const profile = getWarAbilityProfile(healerSlug, healerClassTag)
  return {
    integrityBonus: profile.support?.integrityOnRevive ?? 0,
    note: profile.support?.note ?? null,
  }
}

export function shouldRevealField(
  field: WarRevealField,
  isRevealed: boolean,
  revealFields: WarRevealField[],
  attackersNeedRecon: boolean,
) {
  if (!attackersNeedRecon) return true
  if (!isRevealed) return false
  return revealFields.includes(field)
}

export function getWarAbilitySummary(slug: string | null | undefined, classTag: string | null | undefined) {
  return getWarAbilityProfile(slug, classTag).summary
}
