import { CharacterModel } from '@/backend/models/character.model'
import { UserModel } from '@/backend/models/user.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

export interface ResolvedWarOperative {
  slug: string | null
  name: string | null
  class_tag: string | null
  stat_power: number
  stat_speed: number
  stat_control: number
  recovery_until: string | null
  source: 'equipped' | 'profile' | 'none'
}

function normalizeCharacterRow(row: any) {
  return Array.isArray(row?.characters) ? row.characters[0] : row?.characters
}

export async function resolveWarOperative(userId: string) : Promise<ResolvedWarOperative> {
  const { data: userChar } = await supabaseAdmin
    .from('user_characters')
    .select('recovery_until, characters(slug, name, class_tag, stat_power, stat_speed, stat_control)')
    .eq('user_id', userId)
    .eq('is_equipped', true)
    .limit(1)
    .maybeSingle()

  const equippedCharacter = normalizeCharacterRow(userChar)
  if (equippedCharacter) {
    return {
      slug: equippedCharacter.slug ?? null,
      name: equippedCharacter.name ?? null,
      class_tag: equippedCharacter.class_tag ?? null,
      stat_power: equippedCharacter.stat_power ?? 50,
      stat_speed: equippedCharacter.stat_speed ?? 50,
      stat_control: equippedCharacter.stat_control ?? 50,
      recovery_until: userChar?.recovery_until ?? null,
      source: 'equipped',
    }
  }

  const profile = await UserModel.getById(userId)
  if (!profile?.character_match_id) {
    return {
      slug: null,
      name: null,
      class_tag: profile?.character_class ?? null,
      stat_power: 50,
      stat_speed: 50,
      stat_control: 50,
      recovery_until: profile?.recovery_until ?? null,
      source: 'none',
    }
  }

  const character = await CharacterModel.getBySlug(profile.character_match_id)

  return {
    slug: profile.character_match_id,
    name: character?.name ?? profile.character_name ?? profile.character_match_id,
    class_tag: character?.class_tag ?? profile.character_class ?? null,
    stat_power: character?.stat_power ?? 50,
    stat_speed: character?.stat_intel ?? 50,
    stat_control: character?.stat_control ?? 50,
    recovery_until: profile.recovery_until ?? null,
    source: 'profile',
  }
}
