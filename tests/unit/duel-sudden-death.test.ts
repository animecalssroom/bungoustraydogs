import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the narrative generator to avoid network calls
vi.mock('@/backend/lib/duel-narrative', () => ({
  narrateDuelRound: async () => ({ text: 'mock', isFallback: false }),
}))

describe('resolveDuelRoundWithAdmin sudden-death flow', () => {
  let insertedRounds: any[] = []
  let updatedDuels: any[] = []

  beforeEach(() => {
    insertedRounds = []
    updatedDuels = []

    const mockFrom = (table: string) => {
      const builder: any = {
        _table: table,
        select() { return this },
        eq(field: string, value: any) { this._eq = { field, value }; return this },
        lt() { return this },
        order() { return this },
        limit() { return this },
        is() { return this },
        maybeSingle: async () => {
          if (table === 'duels') {
            return { data: { id: 'duel-1', challenger_id: 'a', defender_id: 'b', challenger_character: 'A', defender_character: 'B', challenger_character_slug: 'a', defender_character_slug: 'b', status: 'active', current_round: 7, challenger_hp: 50, defender_hp: 50, challenger_max_hp: 100, defender_max_hp: 100 } }
          }
          if (table === 'duel_rounds') {
            // unresolved current round with both moves submitted
            return { data: { id: 'round-7', duel_id: 'duel-1', round_number: 7, challenger_move: 'strike', defender_move: 'strike', resolved_at: null, round_started_at: new Date().toISOString() } }
          }
          if (table === 'duel_cooldowns') {
            return { data: [] }
          }
          return { data: null }
        },
        
      }

      builder.update = (payload: any) => {
        return { eq: async () => { if (table === 'duels') updatedDuels.push(payload); return { data: payload } } }
      }

      builder.insert = async (payload: any) => {
        if (table === 'duel_rounds') {
          insertedRounds.push(payload)
        }
        return { data: payload }
      }

      builder.upsert = async () => ({ data: [] })

      return builder
    }

    const mockSupabaseAdmin = { from: mockFrom }

    // Reset modules so dynamic mocks take effect when importing the target module
    vi.resetModules()
    // Use doMock to register the mock at runtime
    vi.doMock('@/backend/lib/supabase', () => ({ supabaseAdmin: mockSupabaseAdmin }))
    vi.doMock('@/lib/duels/engine', () => ({
      resolveDuelRound: (input: any) => ({
        challengerMove: input.challenger.move,
        defenderMove: input.defender.move,
        challengerDamage: 10,
        defenderDamage: 10,
        challengerHpAfter: Math.max(0, input.challenger.hp - 10),
        defenderHpAfter: Math.max(0, input.defender.hp - 10),
        challengerMaxHpAfter: input.challenger.maxHp,
        defenderMaxHpAfter: input.defender.maxHp,
        duelOver: false,
        winnerId: null,
        loserId: null,
        specialEvents: [],
        cooldownWrites: [],
      })
    }))
  })

  it('advances to sudden-death (round 8) when both alive after 7', async () => {
    // Import after mocks
    const { resolveDuelRoundWithAdmin } = await import('../../../../backend/lib/duel-runtime'.replace('../../../../', '../../'))

    const result = await resolveDuelRoundWithAdmin('duel-1')
    expect(result).toBe(true)
    // next round inserted should be 8 and flagged sudden death
    expect(insertedRounds.length).toBeGreaterThan(0)
    const inserted = insertedRounds[0]
    expect(inserted.round_number === 8 || inserted.round_number === 7 + 1).toBeTruthy()
    // is_sudden_death should be true when going to sudden death
    expect(inserted.is_sudden_death === true).toBeTruthy()
    // duels update should have set current_round to 8
    expect(updatedDuels.some(u => u.current_round === 8)).toBeTruthy()
  })
})
