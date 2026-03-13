export const CANON_RIVALRIES = [
  ['atsushi-nakajima', 'ryunosuke-akutagawa'],
  ['osamu-dazai', 'nakahara-chuuya'],
  ['osamu-dazai', 'ryunosuke-akutagawa'],
  ['sakunosuke-oda', 'ryunosuke-akutagawa'],
] as const

export function hasCanonRivalry(left: string | null | undefined, right: string | null | undefined) {
  return CANON_RIVALRIES.some(([a, b]) =>
    (a === left && b === right) || (a === right && b === left),
  )
}
