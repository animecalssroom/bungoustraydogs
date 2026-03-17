export type WarMechanic = {
  ap_cost_modifier: number
  defense_bonus: number
  recovery_hours: number
  min_ap_to_declare: number
  ap_income_per_hour: number
  special: string[]
}

export type DistrictData = {
  id: string
  name: string
  name_jp: string
  sector: string
  real_location: string
  threat_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'EXTREME' | 'MAXIMUM' | 'VARIABLE'
  default_faction: string | null
  faction_color: string
  key_figures: string[]
  flavour_quote: string
  lore: string
  mechanic: WarMechanic
}

export const DISTRICTS_DATA: DistrictData[] = [
  {
    id: 'yokohama-port',
    name: 'Yokohama Port',
    name_jp: '横浜港',
    sector: 'SECTOR 00 · PRIORITY ZONE',
    real_location: 'Daikoku / Honmoku terminals',
    threat_level: 'MAXIMUM',
    default_faction: 'mafia',
    faction_color: '#5a0000',
    key_figures: ['Chuuya Nakahara', 'Ryunosuke Akutagawa', 'Ougai Mori'],
    flavour_quote:
      'The Port Mafia did not name itself after this place by accident. The port is not where they operate. The port is what they are.',
    lore: "Yokohama Port is the oldest power in the city and the last word in any conversation about who truly controls it. The container terminals stretch east into Tokyo Bay — enormous, industrial, indifferent. Ships arrive from ports that don't appear on public shipping routes. Cargo offloaded in the early hours by workers paid too well to ask questions. The Mafia's hold here is not merely territorial — it is structural. Lose the harbor and you lose the supply lines, the leverage, the income that makes everything else possible. Chuuya has been stationed here more than anywhere else. Akutagawa's Rashomon has torn through strike teams in the container yards at 3am and the bodies were gone before sunrise.",
    mechanic: {
      ap_cost_modifier: 2,
      defense_bonus: 25,
      recovery_hours: 48,
      min_ap_to_declare: 500,
      ap_income_per_hour: 15,
      special: [
        'Chuuya and Akutagawa deal +30% damage when defending',
        'Only factions with 500+ AP pool can declare war here',
        'Assault move costs double AP',
        'Failed strikes result in 48h recovery',
      ],
    },
  },
  {
    id: 'minato-mirai',
    name: 'Minato Mirai',
    name_jp: 'みなとみらい',
    sector: 'SECTOR 01',
    real_location: 'Nishi-ku waterfront',
    threat_level: 'MODERATE',
    default_faction: 'agency',
    faction_color: '#0f2d52',
    key_figures: ['Osamu Dazai', 'Doppo Kunikida', 'Atsushi Nakajima'],
    flavour_quote:
      "Every case that walks through that door is someone's last hope. We don't turn them away. That's not idealism — that's the job.",
    lore: "The Agency occupies a quiet stretch of Yokohama's modernised waterfront that looks unremarkable from the outside — and that's deliberate. Fukuzawa chose the location carefully. Close enough to the city's friction points to respond quickly, far enough from Mafia territory to avoid constant provocation. The Landmark Tower casts a long shadow here. The Agency works in it. Ranpo has solved cases here that the police couldn't crack in months. Yosano has patched up operatives that should not have survived.",
    mechanic: {
      ap_cost_modifier: 1,
      defense_bonus: 10,
      recovery_hours: 24,
      min_ap_to_declare: 100,
      ap_income_per_hour: 8,
      special: [
        'Agency players regenerate AP 25% faster when defending',
        'Yosano revive cooldown is halved here',
        'Capturing grants the controlling faction a passive AP bonus each hour',
      ],
    },
  },
  {
    id: 'kannai-center',
    name: 'Kannai Center',
    name_jp: '関内センター',
    sector: 'SECTOR 02',
    real_location: 'Kannai / Bashamichi',
    threat_level: 'HIGH',
    default_faction: 'guild',
    faction_color: '#4a3800',
    key_figures: ['F. Scott Fitzgerald', 'John Steinbeck', 'Louisa May Alcott'],
    flavour_quote:
      'Money is not power. Money is the infrastructure that makes power possible. Yokohama understands this. That is why we are here.',
    lore: "Kannai is Yokohama's commercial heart — department stores, trading houses, foreign banks, restaurants that charge more per plate than most residents earn in a week. The Guild moved here because influence flows through money and money flows through here. Fitzgerald doesn't need to threaten anyone in this district. He simply owns what matters. The red-brick Bashamichi streetscape hides boardrooms where deals get made that shape the city's politics without a single ability being drawn.",
    mechanic: {
      ap_cost_modifier: 1,
      defense_bonus: 5,
      recovery_hours: 24,
      min_ap_to_declare: 100,
      ap_income_per_hour: 10,
      special: [
        'Controlling Downtown generates +10 AP/hour — highest income district',
        'Guild defenders can spend AP to boost their strike power',
        'Most contested district — highest AP reward for capture',
      ],
    },
  },
  {
    id: 'chinatown',
    name: 'Chinatown',
    name_jp: '中華街',
    sector: 'SECTOR 03',
    real_location: 'Yokohama Chinatown',
    threat_level: 'HIGH',
    default_faction: 'guild',
    faction_color: '#5a4400',
    key_figures: ['Mark Twain', 'Edgar Allan Poe', 'Lucy Maud Montgomery'],
    flavour_quote:
      'Neutral ground is a myth. Every table has a side. The question is just who built the table.',
    lore: "Yokohama Chinatown is the oldest foreign settlement in the city — a grid of red lanterns, incense smoke, and commerce that has outlasted every political arrangement Yokohama has ever had. The Guild treats it as neutral ground in name and contested territory in practice. Every faction has allies here. Every faction has enemies here. Information moves through these streets faster than anywhere else in Yokohama.",
    mechanic: {
      ap_cost_modifier: 0.8,
      defense_bonus: 0,
      recovery_hours: 12,
      min_ap_to_declare: 80,
      ap_income_per_hour: 6,
      special: [
        'Reduced AP cost to attack — most accessible district',
        'No defense bonus for any faction including controlling one',
        'Infiltrate move reveals double the intel here',
        'Recovery only 12h — low-stakes proving ground',
      ],
    },
  },
  {
    id: 'tsurumi-district',
    name: 'Tsurumi District',
    name_jp: '鶴見地区',
    sector: 'SECTOR 04',
    real_location: 'Tsurumi-ku / north industrial',
    threat_level: 'VERY HIGH',
    default_faction: 'hunting_dogs',
    faction_color: '#0f1e38',
    key_figures: ['Tetchou Suehiro', 'Teruko Okura', 'Saigiku Jouno'],
    flavour_quote:
      "The law does not bend for ability users. It does not bend for anyone. Tsurumi is proof of that.",
    lore: "North Yokohama's industrial corridor is all steel, exhaust, and the sound of heavy machinery that never stops. The Hunting Dogs claimed this district because it suits them — functional, brutal, no pretense. Fukuchi's Mirror Lion has been deployed in these warehouses. Tetchou's Plum Blossoms in Snow has torn through entire strike teams in the narrow container yards.",
    mechanic: {
      ap_cost_modifier: 1.5,
      defense_bonus: 20,
      recovery_hours: 36,
      min_ap_to_declare: 200,
      ap_income_per_hour: 7,
      special: [
        'Support move disabled when attacking — strikes only',
        'Hunting Dogs deal +20% damage on counterstrikes',
        'Tetchou and Teruko get a special ability bonus when defending',
        'Failed strikes result in 36h recovery',
      ],
    },
  },
  {
    id: 'honmoku-area',
    name: 'Honmoku Area',
    name_jp: '本牧エリア',
    sector: 'SECTOR 05',
    real_location: 'Isogo / Minami-ku',
    threat_level: 'EXTREME',
    default_faction: 'mafia',
    faction_color: '#3a0000',
    key_figures: ['Kouyou Ozaki', 'Gin Akutagawa', 'Ichiyo Higuchi'],
    flavour_quote:
      "You don't enter the dark streets uninvited. And if you do — you don't leave the same way you came in.",
    lore: "This is where the Mafia actually lives. Not the glamour of the harbor or the politics of the executive suite — the dense, lightless streets where loyalty is enforced and debts are collected. The residents here have a saying: the Mafia doesn't rule this place. The Mafia IS this place. Kouyou's Golden Demon has been summoned on these streets. Gin moves through alleyways like smoke.",
    mechanic: {
      ap_cost_modifier: 1.8,
      defense_bonus: 20,
      recovery_hours: 36,
      min_ap_to_declare: 300,
      ap_income_per_hour: 9,
      special: [
        'Port Mafia gets double AP from successful defenses here',
        'Assault move disabled for non-Mafia attackers',
        'Only Infiltrate or Support allowed against this district',
        'Kouyou and Gin characters get +25% defense bonus',
      ],
    },
  },
  {
    id: 'motomachi',
    name: 'Motomachi',
    name_jp: '元町',
    sector: 'SECTOR 06',
    real_location: 'Motomachi shopping street / bluff area',
    threat_level: 'HIGH',
    default_faction: 'special_div',
    faction_color: '#0f3828',
    key_figures: ['Ango Sakaguchi', 'Motoji Minoura'],
    flavour_quote:
      'The government does not take sides. It keeps the file open. Every side. Every move. Every casualty. The archive never forgets.',
    lore: "Motomachi sits between Chinatown and the bluff — a composed, European-influenced shopping street that has always attracted Yokohama's more measured residents. The Special Division operates here because observation requires proximity without involvement. Ango's Discourse on Decadence means nothing in this district escapes his notice. Every interaction is logged.",
    mechanic: {
      ap_cost_modifier: 1.2,
      defense_bonus: 15,
      recovery_hours: 24,
      min_ap_to_declare: 150,
      ap_income_per_hour: 6,
      special: [
        "Infiltrate move reveals the defending faction's full member list and recovery status",
        'Special Division always sees incoming strikes 10 minutes before they land',
        'Ango character nullifies enemy Support buffs in this district',
      ],
    },
  },
  {
    id: 'northern-wards',
    name: 'Northern Wards',
    name_jp: '北部地区',
    sector: 'SECTOR 07',
    real_location: 'Kanagawa-ku / north Yokohama',
    threat_level: 'MODERATE',
    default_faction: null,
    faction_color: '#1a1a2a',
    key_figures: ['Unknown operatives'],
    flavour_quote: 'Nobody claims the northern wards officially. Everyone fights over them anyway.',
    lore: 'The administrative and residential north of Yokohama — government buildings, transport hubs, ordinary streets that the city\'s more dramatic conflicts tend to pass through rather than settle in. Every faction has presence here but none hold it with conviction. It changes hands frequently.',
    mechanic: {
      ap_cost_modifier: 0.8,
      defense_bonus: 0,
      recovery_hours: 12,
      min_ap_to_declare: 50,
      ap_income_per_hour: 4,
      special: [
        'No AP cost penalty — easiest district to attack',
        'Control shifts rapidly — lowest AP required to flip',
        'Good entry point for new players and low-rank operatives',
      ],
    },
  },
  {
    id: 'suribachi-city',
    name: 'Suribachi City',
    name_jp: 'すり鉢市',
    sector: 'SECTOR 08',
    real_location: 'Hodogaya / western hills',
    threat_level: 'VARIABLE',
    default_faction: null,
    faction_color: '#141414',
    key_figures: ['Unknown — sightings unconfirmed'],
    flavour_quote:
      'Whatever is being planned in Yokohama often starts here. Where nobody is watching.',
    lore: "The western hills beyond Yokohama's polished center are where the city frays. Streets that don't appear on tourist maps. Buildings that change hands without paperwork. Every faction has operatives here but none will officially claim it. The Rats have been sighted in these hills.",
    mechanic: {
      ap_cost_modifier: 1,
      defense_bonus: 0,
      recovery_hours: 24,
      min_ap_to_declare: 50,
      ap_income_per_hour: 3,
      special: [
        'Rats in the House of the Dead get a hidden +20 bonus when operating here',
        'Decay of the Angel get a hidden +15 bonus here',
        'Control resets every 72 hours regardless of AP — truly contested',
        'Lore faction characters unlock special moves in this district',
      ],
    },
  },
]

// ── Slug/ID alias map ─────────────────────────────────────────
// Maps DB slugs that differ from our hardcoded IDs
const SLUG_TO_ID: Record<string, string> = {
  harbor: 'yokohama-port',
  'harbor-district': 'yokohama-port',
  standard_island: 'yokohama-port',
  'standard-island': 'yokohama-port',
  waterfront: 'minato-mirai',
  tsurumi: 'tsurumi-district',
  honmoku: 'honmoku-area',
  kannai: 'kannai-center',
  northern_wards: 'northern-wards',
  suribachi: 'suribachi-city',
  'suribachi-crater': 'suribachi-city',
}

// Primary lookup — works with both slug and id
export function getDistrictData(slugOrId: string): DistrictData | undefined {
  const normalised = SLUG_TO_ID[slugOrId] ?? slugOrId
  return (
    DISTRICTS_DATA.find((d) => d.id === normalised) ??
    DISTRICTS_DATA.find((d) => d.id.includes(normalised) || normalised.includes(d.id))
  )
}

export function getDistrictsDataByFaction(factionId: string): DistrictData[] {
  return DISTRICTS_DATA.filter((d) => d.default_faction === factionId)
}

export function getDistrictDataColor(slugOrId: string): string {
  return getDistrictData(slugOrId)?.faction_color ?? '#1a1a1a'
}

// Named export alias so both import styles work
export const DISTRICTS = DISTRICTS_DATA