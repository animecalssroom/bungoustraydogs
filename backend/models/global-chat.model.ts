import { supabaseAdmin } from '@/backend/lib/supabase'
import type { FactionId } from '@/backend/types'

export interface GlobalMessage {
  id: string
  user_id: string
  sender_username: string | null
  sender_character_name: string | null
  sender_faction_id: FactionId | null
  content: string
  is_bot_post: boolean
  created_at: string
}

export const GlobalChatModel = {
  async getRecent(limit = 50): Promise<GlobalMessage[]> {
    const { data, error } = await supabaseAdmin
      .from('global_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching global messages:', error)
      return []
    }

    return (data || []).reverse()
  },

  async sendMessage(userId: string, content: string, profile: any): Promise<GlobalMessage | null> {
    const { data, error } = await supabaseAdmin
      .from('global_messages')
      .insert({
        user_id: userId,
        content: content,
        sender_username: profile.username,
        sender_character_name: profile.character_name,
        sender_faction_id: profile.faction,
        is_bot_post: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending global message:', error)
      return null
    }

    return data
  }
}
