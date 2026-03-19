import getClient from '@/backend/lib/upstash'

export type WarzoneRole = 'guard' | 'vanguard'
export type DefenceStance = 'aggressive' | 'counter' | 'tactical'
export interface WarDeploymentRecord {
  role: WarzoneRole
  stance: DefenceStance
  deployedAt: string
}

export interface WarTransmission {
  id: string
  warId: string
  message: string
  type: 'combat' | 'recon' | 'system' | 'reinforce'
  timestamp: string
}

export interface WarReconSnapshot {
  status: 'revealed'
  sourceSlug: string | null
  revealFields: string[]
  revealedAt: string
  durationSeconds: number
}

function parseDeploymentRecord(value: unknown): WarDeploymentRecord | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as WarDeploymentRecord
    } catch {
      return null
    }
  }
  return value as WarDeploymentRecord
}

export const WarRedisModel = {
  // KEYS
  keys: {
    integrity: (warId: string) => `war:${warId}:integrity`,
    transmissions: (warId: string) => `war:${warId}:transmissions`,
    deployment: (warId: string, userId: string) => `war:${warId}:deployment:${userId}`,
    warzonePresence: (warId: string) => `war:${warId}:presence`,
    activeDeployment: (userId: string) => `user:${userId}:deployment:active`,
    recon: (districtId: string, factionId: string) => `war:recon:${districtId}:${factionId}`,
    recovery: (userId: string) => `user:recovery:${userId}`,
  },

  async isUserAlreadyDeployed(userId: string): Promise<string | null> {
    const redis = getClient()
    return await redis.get<string>(this.keys.activeDeployment(userId))
  },

  /**
   * Integrity (Tug-of-War Bar)
   */
  async getIntegrity(warId: string): Promise<number> {
    const redis = getClient()
    const val = await redis.get<number>(this.keys.integrity(warId))
    return val ?? 50 // Default to 50%
  },

  async setIntegrity(warId: string, value: number): Promise<number> {
    const redis = getClient()
    const normalized = Math.max(0, Math.min(100, value))
    await redis.set(this.keys.integrity(warId), normalized, { ex: 259200 })
    return normalized
  },

  async updateIntegrity(warId: string, delta: number): Promise<number> {
    const current = await this.getIntegrity(warId)
    return await this.setIntegrity(warId, current + delta)
  },

  /**
   * Transmissions (Live Terminal Feed)
   */
  async pushTransmission(warId: string, message: string, type: WarTransmission['type'] = 'system') {
    const redis = getClient()
    const transmission: WarTransmission = {
      id: crypto.randomUUID(),
      warId,
      message,
      type,
      timestamp: new Date().toISOString()
    }
    
    // Push to head (L-PUSH) and trim to keep last 50
    const key = this.keys.transmissions(warId)
    await redis.lpush(key, JSON.stringify(transmission))
    await redis.ltrim(key, 0, 49)
  },

  async getTransmissions(warId: string, limit = 20): Promise<WarTransmission[]> {
    const redis = getClient()
    const list = await redis.lrange(this.keys.transmissions(warId), 0, limit - 1)
    return list
      .map(item => (typeof item === 'string' ? JSON.parse(item) : item))
      .reverse()
  },

  /**
   * Deployment (Entering the Warzone)
   */
  async deployPlayer(userId: string, warId: string, role: WarzoneRole, stance: DefenceStance = 'tactical') {
    const redis = getClient()
    const key = this.keys.deployment(warId, userId)
    await redis.set(key, JSON.stringify({ role, stance, deployedAt: new Date().toISOString() }), { ex: 259200 }) // 72h expiry
    
    // Set global active deployment lock
    await redis.set(this.keys.activeDeployment(userId), warId, { ex: 259200 })

    // Track presence in the warId set
    await redis.sadd(this.keys.warzonePresence(warId), userId)
  },

  async getPlayerDeployment(userId: string, warId: string) {
    const redis = getClient()
    const data = await redis.get(this.keys.deployment(warId, userId))
    return parseDeploymentRecord(data)
  },

  async getWarzonePresence(warId: string): Promise<string[]> {
    const redis = getClient()
    const members = await redis.smembers(this.keys.warzonePresence(warId))
    return Array.isArray(members) ? members.map(String) : []
  },

  async getDeployments(warId: string, userIds: string[]) {
    const deployments = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        deployment: await this.getPlayerDeployment(userId, warId),
      })),
    )

    return deployments.reduce<Record<string, WarDeploymentRecord>>((acc, entry) => {
      if (entry.deployment) {
        acc[entry.userId] = entry.deployment
      }
      return acc
    }, {})
  },

  async clearPlayerDeployment(userId: string, warId: string) {
    const redis = getClient()
    await Promise.all([
      redis.del(this.keys.deployment(warId, userId)),
      redis.del(this.keys.activeDeployment(userId)),
      redis.srem(this.keys.warzonePresence(warId), userId),
    ])
  },

  async clearWarzone(warId: string) {
    const userIds = await this.getWarzonePresence(warId)
    await Promise.all(userIds.map((userId) => this.clearPlayerDeployment(userId, warId)))
    return userIds.length
  },

  /**
   * Recon (Intelligence)
   */
  async revealDistrict(
    districtId: string,
    factionId: string,
    options: { durationSeconds?: number; sourceSlug?: string | null; revealFields?: string[] } = {},
  ) {
    const redis = getClient()
    const key = this.keys.recon(districtId, factionId)
    const durationSeconds = options.durationSeconds ?? 43200
    const snapshot: WarReconSnapshot = {
      status: 'revealed',
      sourceSlug: options.sourceSlug ?? null,
      revealFields: options.revealFields ?? [],
      revealedAt: new Date().toISOString(),
      durationSeconds,
    }
    await redis.set(key, JSON.stringify(snapshot), { ex: durationSeconds })
  },

  async getDistrictReconData(districtId: string, factionId: string): Promise<WarReconSnapshot | null> {
    const redis = getClient()
    const val = await redis.get(this.keys.recon(districtId, factionId))
    if (!val) return null
    if (val === 'revealed') {
      return {
        status: 'revealed',
        sourceSlug: null,
        revealFields: [],
        revealedAt: new Date().toISOString(),
        durationSeconds: 43200,
      }
    }
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as WarReconSnapshot
      } catch {
        return null
      }
    }
    return val as WarReconSnapshot
  },

  async isDistrictRevealed(districtId: string, factionId: string): Promise<boolean> {
    return Boolean(await this.getDistrictReconData(districtId, factionId))
  },

  /**
   * Recovery (Defeat Lockout)
   */
  async setRecovery(userId: string, durationSeconds = 86400) { // Default 24h
    const redis = getClient()
    await redis.set(this.keys.recovery(userId), 'recovering', { ex: durationSeconds })
  },

  async clearRecovery(userId: string) {
    const redis = getClient()
    await redis.del(this.keys.recovery(userId))
  },

  async isRecovering(userId: string): Promise<boolean> {
    const redis = getClient()
    const val = await redis.get(this.keys.recovery(userId))
    return val === 'recovering'
  }
}
