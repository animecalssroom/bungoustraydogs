import getClient from '@/backend/lib/upstash'

export type WarzoneRole = 'guard' | 'vanguard'
export type DefenceStance = 'aggressive' | 'counter' | 'tactical'

export interface WarTransmission {
  id: string
  warId: string
  message: string
  type: 'combat' | 'recon' | 'system' | 'reinforce'
  timestamp: string
}

export const WarRedisModel = {
  // KEYS
  keys: {
    integrity: (warId: string) => `war:${warId}:integrity`,
    transmissions: (warId: string) => `war:${warId}:transmissions`,
    deployment: (warId: string, userId: string) => `war:${warId}:deployment:${userId}`,
    warzonePresence: (warId: string) => `war:${warId}:presence`,
    activeDeployment: (userId: string) => `user:deployment:active`,
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

  async updateIntegrity(warId: string, delta: number): Promise<number> {
    const redis = getClient()
    const newVal = await redis.incrby(this.keys.integrity(warId), delta)
    
    // Clamp between 0 and 100
    if (newVal < 0) {
      await redis.set(this.keys.integrity(warId), 0)
      return 0
    }
    if (newVal > 100) {
      await redis.set(this.keys.integrity(warId), 100)
      return 100
    }
    return newVal
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
    return list.map(item => (typeof item === 'string' ? JSON.parse(item) : item))
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
    const data = await redis.get<{ role: WarzoneRole, stance: DefenceStance, deployedAt: string }>(this.keys.deployment(warId, userId))
    return data
  },

  /**
   * Recon (Intelligence)
   */
  async revealDistrict(districtId: string, factionId: string, durationSeconds = 43200) { // Default 12h
    const redis = getClient()
    const key = this.keys.recon(districtId, factionId)
    await redis.set(key, 'revealed', { ex: durationSeconds })
  },

  async isDistrictRevealed(districtId: string, factionId: string): Promise<boolean> {
    const redis = getClient()
    const val = await redis.get(this.keys.recon(districtId, factionId))
    return val === 'revealed'
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
