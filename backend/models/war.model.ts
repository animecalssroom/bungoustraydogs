import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import type { FactionId, RegistryDistrict } from '@/backend/types'

export interface TerritoryControl {
    district: RegistryDistrict
    controlling_faction: FactionId | null
    influence: Record<FactionId, number>
    status: 'stable' | 'contested' | 'warzone'
}

export interface WarStatus {
    active_wars: number
    total_territories: number
    faction_rankings: Array<{ faction: FactionId; score: number }>
    last_flip_at: string | null
}

export const WarModel = {
    /**
     * Calculate territory control based on Registry AP and active Duels in each district.
     */
    async getTerritoryControl(): Promise<TerritoryControl[]> {
        return cache.getOrSet('war:territories', 300, async () => {
            // 1. Get AP distribution per district from approved registry posts in the last 7 days
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data: apData } = await supabaseAdmin
                .from('registry_posts')
                .select('district, author_faction, word_count')
                .eq('status', 'approved')
                .gte('approved_at', sevenDaysAgo.toISOString())

            // 2. Get active war duels per district
            const { data: duelData } = await supabaseAdmin
                .from('duels')
                .select('challenger_faction, defender_faction, id') // Needs a district column eventually, or we map by author location
                .eq('status', 'active')
                .eq('is_war_duel', true)

            const districts: RegistryDistrict[] = ['kannai', 'chinatown', 'harbor', 'motomachi', 'honmoku', 'waterfront']

            return districts.map(district => {
                const influence: Record<string, number> = {}

                // Populate influence from Registry AP
                apData?.filter(p => p.district === district).forEach(p => {
                    if (!p.author_faction) return
                    influence[p.author_faction] = (influence[p.author_faction] || 0) + (p.word_count || 0)
                })

                // Determine leader
                let maxInfluence = 0
                let controller: FactionId | null = null

                Object.entries(influence).forEach(([f, val]) => {
                    if (val > maxInfluence) {
                        maxInfluence = val
                        controller = f as FactionId
                    }
                })

                // Status logic
                const status = maxInfluence > 5000 ? 'stable' : maxInfluence > 1000 ? 'contested' : 'warzone'

                return {
                    district,
                    controlling_faction: controller,
                    influence: influence as Record<FactionId, number>,
                    status
                }
            })
        })
    },

    async getWarStatus(): Promise<WarStatus> {
        const territories = await this.getTerritoryControl()

        const factionScores: Record<string, number> = {}
        territories.forEach(t => {
            if (t.controlling_faction) {
                factionScores[t.controlling_faction] = (factionScores[t.controlling_faction] || 0) + 1
            }
        })

        return {
            active_wars: territories.filter(t => t.status === 'warzone').length,
            total_territories: territories.length,
            faction_rankings: Object.entries(factionScores)
                .map(([faction, score]) => ({ faction: faction as FactionId, score }))
                .sort((a, b) => b.score - a.score),
            last_flip_at: new Date().toISOString() // Placeholder
        }
    }
}
