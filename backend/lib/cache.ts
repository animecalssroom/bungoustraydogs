import { redis } from '@/lib/redis'

/**
 * Robust caching utility for Next.js.
 * Uses a tiered approach:
 * 1. L1: In-memory Map (very fast, process-local)
 * 2. L2: Redis/Upstash (fast, cross-process, persistent)
 */

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

const memoryStore = new Map<string, CacheEntry<unknown>>()

export const cache = {
    /**
     * Get or set a cached value.
     * @param key Unique cache key
     * @param ttlSeconds Time-to-live in seconds
     * @param fetcher Function to call if cache misses
     */
    async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
        const now = Date.now()

        // 1. Check Memory (L1)
        const memEntry = memoryStore.get(key) as CacheEntry<T> | undefined
        if (memEntry && memEntry.expiresAt > now) {
            return memEntry.value
        }

        // 2. Check Redis (L2) - ONLY if redis is configured
        if (redis) {
            try {
                const cached = await redis.get<string>(key)
                if (cached) {
                    const value = typeof cached === 'string' ? JSON.parse(cached) : cached
                    // Populate L1 for future fast lookups
                    memoryStore.set(key, { value, expiresAt: now + ttlSeconds * 1000 })
                    return value as T
                }
            } catch (err) {
                // Only warn in non-build environments or if specifically enabled
                if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_CACHE) {
                    console.warn(`[cache] redis get failed for ${key}:`, err)
                }
            }
        }

        // 3. Fetch from Source
        const value = await fetcher()

        // 4. Save to Redis - ONLY if redis is configured
        if (redis) {
            try {
                await redis.set(key, JSON.stringify(value), {
                    ex: ttlSeconds,
                })
            } catch (err) {
                if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_CACHE) {
                    console.warn(`[cache] redis set failed for ${key}:`, err)
                }
            }
        }

        // 5. Save to Memory
        memoryStore.set(key, { value, expiresAt: now + ttlSeconds * 1000 })

        return value
    },

    /** Invalidate a key across both layers. */
    async invalidate(key: string) {
        memoryStore.delete(key)
        if (redis) {
            try {
                await redis.del(key)
            } catch (err) {
                console.warn(`[cache] redis del failed for ${key}:`, err)
            }
        }
    },

    /** Clear all local in-memory cache. */
    clearLocal() {
        memoryStore.clear()
    },
}
