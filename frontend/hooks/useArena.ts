'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ArenaArgument, ArenaDebate } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'

export type ArenaPayload = {
  debates: ArenaDebate[]
  voted: Record<string, 'a' | 'b'>
  argumentsByDebate: Record<string, ArenaArgument[]>
  canVote: boolean
}

function mergeArgument(
  current: Record<string, ArenaArgument[]>,
  next: ArenaArgument,
) {
  const existing = current[next.debate_id] ?? []

  if (existing.some((argument) => argument.id === next.id)) {
    return current
  }

  return {
    ...current,
    [next.debate_id]: [...existing, next].slice(-12),
  }
}

export function useArena(initialPayload?: Partial<ArenaPayload> | null) {
  const [supabase] = useState(() => createClient())
  const [debates, setDebates] = useState<ArenaDebate[]>(initialPayload?.debates ?? [])
  const [argumentsByDebate, setArgumentsByDebate] = useState<Record<string, ArenaArgument[]>>(
    initialPayload?.argumentsByDebate ?? {},
  )
  const [voted, setVoted] = useState<Record<string, 'a' | 'b'>>(initialPayload?.voted ?? {})
  const [canVote, setCanVote] = useState(Boolean(initialPayload?.canVote))
  const [loading, setLoading] = useState(!initialPayload)
  const [error, setError] = useState<string | null>(null)

  const debateIds = useMemo(() => debates.map((debate) => debate.id), [debates])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch('/api/arena', { cache: 'no-store' })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to load the arena.')
      setLoading(false)
      return
    }

    const payload = (json.data ?? {}) as Partial<ArenaPayload>
    setDebates(payload.debates ?? [])
    setArgumentsByDebate(payload.argumentsByDebate ?? {})
    setVoted(payload.voted ?? {})
    setCanVote(Boolean(payload.canVote))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!initialPayload) {
      void load()
      return
    }

    setLoading(false)
  }, [initialPayload, load])

  useEffect(() => {
    if (debateIds.length === 0) {
      return
    }

    const debateChannel = supabase
      .channel('arena-debates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'arena_debates',
        },
        (payload) => {
          const next = payload.new as ArenaDebate
          setDebates((current) =>
            current.map((debate) => (debate.id === next.id ? { ...debate, ...next } : debate)),
          )
        },
      )
      .subscribe()

    const argumentChannel = supabase
      .channel('arena-arguments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_arguments',
        },
        (payload) => {
          const next = payload.new as ArenaArgument

          if (!debateIds.includes(next.debate_id)) {
            return
          }

          setArgumentsByDebate((current) => mergeArgument(current, next))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(debateChannel)
      void supabase.removeChannel(argumentChannel)
    }
  }, [debateIds, supabase])

  const vote = useCallback(
    async (debateId: string, side: 'a' | 'b') => {
      const response = await fetch(`/api/arena/${debateId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side }),
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(json.error ?? 'Vote failed.')
        return false
      }

      setError(null)
      setVoted((current) => ({ ...current, [debateId]: side }))
      setDebates((current) =>
        current.map((debate) =>
          debate.id !== debateId
            ? debate
            : {
                ...debate,
                votes_a: side === 'a' ? debate.votes_a + 1 : debate.votes_a,
                votes_b: side === 'b' ? debate.votes_b + 1 : debate.votes_b,
              },
        ),
      )

      return true
    },
    [],
  )

  const postArgument = useCallback(async (debateId: string, content: string) => {
    const response = await fetch(`/api/arena/${debateId}/arguments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Could not file the argument.')
      return false
    }

    const argument = json.data as ArenaArgument
    setError(null)
    setArgumentsByDebate((current) => mergeArgument(current, argument))
    return true
  }, [])

  return {
    debates,
    argumentsByDebate,
    voted,
    canVote,
    loading,
    error,
    reload: load,
    vote,
    postArgument,
  }
}
