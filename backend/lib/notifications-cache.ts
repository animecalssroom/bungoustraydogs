import { redis } from '@/lib/redis'

const makeKey = (userId: string, limit: number) => `notifications:${userId}:limit:${limit}`

export async function getNotificationsCache(userId: string, limit: number) {
  try {
    const key = makeKey(userId, limit)
    const raw = await redis.get(key)
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as unknown[]
    return raw as unknown[]
  } catch (err) {
    console.error('[notifications-cache] get error', err)
    return null
  }
}

export async function setNotificationsCache(userId: string, limit: number, rows: unknown[], ttlSeconds = 15) {
  try {
    const key = makeKey(userId, limit)
    await redis.set(key, JSON.stringify(rows))
    await redis.expire(key, ttlSeconds)
  } catch (err) {
    console.error('[notifications-cache] set error', err)
  }
}

export async function invalidateNotificationsCache(userId: string) {
  try {
    // delete common limit keys (10 and 20)
    await Promise.all([
      redis.del(`notifications:${userId}:limit:10`),
      redis.del(`notifications:${userId}:limit:20`),
    ])
  } catch (err) {
    console.error('[notifications-cache] invalidate error', err)
  }
}

export default {
  getNotificationsCache,
  setNotificationsCache,
  invalidateNotificationsCache,
}
