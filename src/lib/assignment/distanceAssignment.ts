import { CHARACTER_VECTORS, RESERVED_SLUGS } from './characterVectors'

const AXES = ['justice', 'power', 'social', 'emotion', 'world', 'identity', 'method', 'loyalty']

function euclidean(a: Record<string, number>, b: number[]): number {
  return Math.sqrt(
    AXES.reduce((sum, axis, i) => {
      return sum + Math.pow((a[axis] ?? 5) - (b[i] ?? 5), 2)
    }, 0)
  )
}

export function assignCharacterByDistance(
  compositeVector: Record<string, number>,
  faction: string | null,
): { slug: string } | null {
  // Filter: same faction first, exclude reserved
  const candidates = Object.entries(CHARACTER_VECTORS)
    .filter(([slug, c]) => !RESERVED_SLUGS.has(slug) && c.faction === faction)

  // If no faction matches, open up to all non-reserved
  const pool = candidates.length > 0
    ? candidates
    : Object.entries(CHARACTER_VECTORS).filter(([slug]) => !RESERVED_SLUGS.has(slug))

  const ranked = pool
    .map(([slug, c]) => ({ slug, distance: euclidean(compositeVector, c.traits) }))
    .sort((a, b) => a.distance - b.distance)

  return ranked[0] ? { slug: ranked[0].slug } : null
}

export function findSecondaryMatch(
  compositeVector: Record<string, number>,
  primarySlug: string,
  faction: string | null,
): { slug: string; name: string } | null {
  const pool = Object.entries(CHARACTER_VECTORS)
    .filter(([slug]) => !RESERVED_SLUGS.has(slug) && slug !== primarySlug)

  const ranked = pool
    .map(([slug, c]) => ({ slug, distance: euclidean(compositeVector, c.traits) }))
    .sort((a, b) => a.distance - b.distance)

  if (!ranked[0]) return null
  // Name lookup happens in the caller from DB
  return { slug: ranked[0].slug, name: ranked[0].slug }
}
