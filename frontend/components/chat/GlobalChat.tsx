import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/frontend/context/AuthContext'
import { createClient } from '@/frontend/lib/supabase/client'
import styles from './GlobalChat.module.css'

interface GlobalMessage {
  id: string
  user_id: string
  sender_username: string | null
  sender_character_name: string | null
  sender_faction_id: string | null
  content: string
  is_bot_post: boolean
  created_at: string
  isOptimistic?: boolean
}

export default function GlobalChat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<GlobalMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_messages' },
        (payload: { new: GlobalMessage }) => {
          setMessages((prev) => {
            // Prevent duplicates from optimistic updates
            if (prev.some(m => m.id === payload.new.id)) return prev
            
            // Check if we have an optimistic message with the same content/user
            const existingOptimisticIndex = prev.findIndex(m => 
              m.isOptimistic && 
              m.user_id === payload.new.user_id && 
              m.content === payload.new.content
            )

            if (existingOptimisticIndex !== -1) {
              const next = [...prev]
              next[existingOptimisticIndex] = payload.new
              return next
            }

            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function fetchMessages() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat/global')
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Failed to fetch global messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic Update
    const optimisticMsg: GlobalMessage = {
      id: `opt-${Date.now()}`,
      user_id: user.id,
      sender_username: profile?.username || user.email?.split('@')[0] || 'Unknown',
      sender_character_name: profile?.character_name || null,
      sender_faction_id: profile?.faction || null,
      content,
      is_bot_post: false,
      created_at: new Date().toISOString(),
      isOptimistic: true
    }

    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/chat/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    }
  }

  const getFactionColor = (factionId: string | null) => {
    switch (factionId) {
      case 'agency': return '#60a5fa' // Lighter Blue
      case 'mafia': return '#f87171' // Lighter Red
      case 'guild': return '#fbbf24' // Lighter Gold
      case 'dogs': return '#34d399' // Lighter Green
      case 'special_div': return '#a78bfa' // Lighter Purple
      default: return '#9ca3af' // Grey
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.title}>
            <span className={styles.kanji}>公</span>
            <span>GLOBAL FEED</span>
          </div>
          <div className={styles.subtitle}>UNENCRYPTED MUNICIPAL BROADCAST</div>
        </div>
        <div className={styles.statusIndicator}>
          <div className={styles.pulse}></div>
          <span>CONNECTED</span>
        </div>
      </header>

      <div className={styles.messageList} ref={scrollRef}>
        {isLoading ? (
          <div className={styles.loading}>SYNCING WITH LOCAL ARCHIVE...</div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>NO TRANSMISSIONS DETECTED.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageRow} ${msg.isOptimistic ? styles.isOptimistic : ''}`}>
              <div className={styles.messageMeta}>
                <div className={styles.senderGroup}>
                  <span className={styles.senderUsername}>
                    @{msg.sender_username || 'anonymous'}
                  </span>
                  <span 
                    className={styles.senderCharacter}
                    style={{ color: getFactionColor(msg.sender_faction_id) }}
                  >
                    {msg.sender_character_name || 'UNASSIGNED'}
                  </span>
                </div>
                <span className={styles.timestamp}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.messageContent}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        <form className={styles.inputWrapper} onSubmit={handleSubmit}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="INPUT TRANSMISSION..."
            className={styles.input}
            maxLength={280}
            autoComplete="off"
          />
          <button type="submit" className={styles.sendButton}>SEND</button>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          IDENTITY VERIFICATION REQUIRED FOR BROADCAST
        </div>
      )}
    </div>
  )
}
