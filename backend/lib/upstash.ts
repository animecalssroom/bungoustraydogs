import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

let client: Redis | null = null
function getClient() {
  if (client) return client
  if (!redisUrl || !redisToken) {
    throw new Error('Missing Upstash Redis env vars: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  }
  client = new Redis({ url: redisUrl, token: redisToken })
  return client
}

/**
 * Simple per-key fixed-window counter + TTL. Returns true if under limit.
 * Window and limit can be configured via env vars:
 *  - COMMON_ANSWER_WINDOW_SECONDS (default 300)
 *  - COMMON_ANSWER_LIMIT (default 3)
 */
export async function allowFixedWindow(key: string, windowSeconds?: number, limit?: number) {
  const redis = getClient()
  const win = windowSeconds ?? Number(process.env.COMMON_ANSWER_WINDOW_SECONDS) ?? 300
  const lim = limit ?? Number(process.env.COMMON_ANSWER_LIMIT) ?? 3

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, win)
  }
  return (count ?? 0) <= lim
}

export function userCommonAnswerKey(userId: string) {
  return `guidebot:common:${userId}`
}

export default getClient
