import { supabaseAdmin } from '@/backend/lib/supabase'

export async function fetchFactionContext(faction: string, limit = 5): Promise<string> {
  const { data } = await supabaseAdmin
    .from('transmission_logs')
    .select('content, created_at')
    .eq('faction', faction)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data?.length) return 'No recent faction activity.'

  return data.map((row: any) => `- ${row.content}`).join('\n')
}

export async function fetchBotMentions(username: string, since: string) {
  const { data } = await supabaseAdmin
    .from('transmission_logs')
    .select('id, content, author_id, profiles!inner(is_bot)')
    .ilike('content', `%@${username}%`)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    author_id: row.author_id,
    is_bot: row.profiles?.is_bot ?? false,
  }))
}
