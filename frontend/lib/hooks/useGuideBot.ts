'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GuideBotMessage, GuideBotState, Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'

const EMPTY_STATE: GuideBotState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  isDismissed: false,
  input: '',
}

export function useGuideBot(profile: Profile | null) {
  const [state, setState] = useState<GuideBotState>({
    ...EMPTY_STATE,
    isDismissed: Boolean(profile?.guide_bot_dismissed),
  })
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    setState((current) => ({
      ...current,
      isDismissed: Boolean(profile?.guide_bot_dismissed),
    }))
  }, [profile?.guide_bot_dismissed])

  const fetchConversationHistory = useCallback(async () => {
    if (!profile?.id) {
      setHistoryLoaded(true)
      return []
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('guide_bot_messages')
      .select('id, role, content, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const nextMessages = ((data ?? []) as GuideBotMessage[]).reverse()
    setState((current) => ({
      ...current,
      messages: nextMessages,
    }))
    setHistoryLoaded(true)
    return nextMessages
  }, [profile?.id])

  useEffect(() => {
    if (!state.isOpen || state.isDismissed || historyLoaded) {
      return
    }

    void fetchConversationHistory()
  }, [fetchConversationHistory, historyLoaded, state.isDismissed, state.isOpen])

  useEffect(() => {
    if (!profile?.id || !state.isOpen || profile.guide_bot_opened_at) {
      return
    }

    const supabase = createClient()
    void supabase
      .from('profiles')
      .update({ guide_bot_opened_at: new Date().toISOString() })
      .eq('id', profile.id)
  }, [profile?.guide_bot_opened_at, profile?.id, state.isOpen])

  const setInput = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      input: value,
    }))
  }, [])

  const setIsOpen = useCallback((value: boolean | ((current: boolean) => boolean)) => {
    setState((current) => ({
      ...current,
      isOpen: typeof value === 'function' ? value(current.isOpen) : value,
    }))
  }, [])

  const dismissBot = useCallback(async () => {
    const response = await fetch('/api/guide-bot/dismiss', {
      method: 'POST',
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    setState((current) => ({
      ...current,
      isDismissed: true,
      isOpen: false,
    }))
    return true
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return null

    const userMessage: GuideBotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    let historySnapshot: GuideBotMessage[] = []
    const assistantId = `assistant-${Date.now()}`

    setState((current) => {
      historySnapshot = [...current.messages]
      const nextMessages = [
        ...current.messages,
        userMessage,
        {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          created_at: new Date().toISOString(),
        },
      ]
      console.log('[guide-bot] messages before POST', historySnapshot)
      return {
        ...current,
        input: '',
        isLoading: true,
        messages: nextMessages,
      }
    })

    try {
      const response = await fetch('/api/guide-bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: historySnapshot,
        }),
      })

      if (!response.body) {
        const fallback = await response.text()
        setState((current) => ({
          ...current,
          isLoading: false,
          messages: current.messages.map((entry) =>
            entry.id === assistantId
              ? { ...entry, content: fallback || 'Registry terminal is experiencing interference. \nThe city advises consulting the Archive directly for information.' }
              : entry,
          ),
        }))
        return null
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const result = await reader.read()
        done = result.done
        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: !done })
          setState((current) => ({
            ...current,
            messages: current.messages.map((entry) =>
              entry.id === assistantId
                ? { ...entry, content: `${entry.content}${chunk}` }
                : entry,
            ),
          }))
        }
      }
    } catch {
      const fallback = `Registry terminal is experiencing interference. 
The city advises consulting the Archive directly for information.`
      setState((current) => ({
        ...current,
        messages: current.messages.map((entry) =>
          entry.id === assistantId ? { ...entry, content: fallback } : entry,
        ),
      }))
    } finally {
      setState((current) => ({
        ...current,
        isLoading: false,
      }))
    }

    return null
  }, [])

  return {
    ...state,
    fetchConversationHistory,
    sendMessage,
    dismissBot,
    setInput,
    isOpen: state.isOpen,
    setIsOpen,
  }
}
