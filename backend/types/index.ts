export type BSDTheme = 'light' | 'dark' | 'neutral'

export type VisibleFactionId =
  | 'agency'
  | 'mafia'
  | 'guild'
  | 'hunting_dogs'

export type HiddenFactionId =
  | 'special_div'
  | 'rats'
  | 'decay'
  | 'clock_tower'

export type FactionId = VisibleFactionId | HiddenFactionId

export type StoredRole =
  | 'observer'
  | 'waitlist'
  | 'member'
  | 'mod'
  | 'owner'

export type EffectiveRole = 'guest' | StoredRole
export type ExamStatus = 'clear' | 'tied' | 'unplaceable' | 'special_division'

export type CharacterArchetype =
  | 'strategist'
  | 'guardian'
  | 'berserker'
  | 'ghost'
  | 'wildcard'
  | 'sovereign'

export type AbilityType =
  | 'destruction'
  | 'counter'
  | 'manipulation'
  | 'analysis'

export interface BehaviorScores {
  power: number
  intel: number
  loyalty: number
  control: number
  arena_votes: Record<string, number>
  duel_style: {
    gambit: number
    strike: number
    stance: number
  }
  lore_topics: Record<string, number>
}

export interface Profile {
  id: string
  username: string
  username_confirmed: boolean
  email: string
  avatar_url: string | null
  bio: string | null
  theme: BSDTheme
  role: StoredRole
  faction: FactionId | null
  character_name: string | null
  character_match_id: string | null
  character_ability: string | null
  character_ability_jp: string | null
  character_description: string | null
  character_type: AbilityType | null
  character_assigned_at: string | null
  exam_completed: boolean
  exam_taken_at: string | null
  exam_answers: Record<string, string> | null
  exam_scores: Record<string, number> | null
  exam_status: ExamStatus | null
  quiz_completed: boolean
  quiz_locked: boolean
  assignment_flag_used: boolean
  trait_scores: Record<string, number> | null
  behavior_scores: BehaviorScores | null
  exam_retake_eligible_at: string | null
  exam_retake_used: boolean
  ap_total: number
  rank: number
  login_streak: number
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  slug: string
  name: string
  name_jp: string
  name_reading: string
  faction_id: FactionId
  ability_name: string
  ability_name_jp: string
  ability_desc: string
  quote: string
  description: string
  author_note: string
  real_author: string
  real_author_years: string
  stat_power: number
  stat_speed: number
  stat_control: number
  kanji_symbol: string
  role_id: CharacterArchetype | null
  is_lore_locked: boolean
  created_at: string
}

export interface ArchiveEntry {
  id: string
  slug: string
  character_name: string
  character_name_jp: string | null
  faction: FactionId
  ability_name: string
  ability_name_jp: string | null
  ability_type: AbilityType | null
  ability_description: string | null
  trait_power: number | null
  trait_intel: number | null
  trait_loyalty: number | null
  trait_control: number | null
  real_author_name: string | null
  real_author_dates: string | null
  real_author_bio: string | null
  literary_movement: string | null
  notable_works: string | null
  ability_literary_connection: string | null
  registry_note: string | null
  status: string | null
  created_at: string
}

export interface Faction {
  id: FactionId
  name: string
  name_jp: string
  kanji: string
  description: string
  philosophy: string
  theme: BSDTheme
  color: string
  is_joinable: boolean
  is_hidden: boolean
  is_lore_locked: boolean
  ap: number
  member_count: number
  waitlist_count: number
  slot_count: number
}

export interface FactionMemberSummary {
  id: string
  username: string
  avatar_url: string | null
  rank: number
  ap_total: number
  role: StoredRole
  faction: FactionId | null
  character_match_id: string | null
  last_seen?: string | null
}

export interface FactionMessageAuthor {
  id: string
  username: string
  avatar_url: string | null
  rank: number
  ap_total: number
  character_match_id: string | null
}

export interface FactionMessage {
  id: string
  faction_id: FactionId
  user_id: string
  sender_character?: string | null
  sender_rank?: string | null
  content: string
  created_at: string
  author: FactionMessageAuthor | null
}

export interface FactionBulletin {
  id: string
  faction_id: FactionId
  author_id: string | null
  author_character: string | null
  case_number: string | null
  content: string
  pinned: boolean
  created_at: string
}

export interface FactionActivity {
  id: string
  faction_id: FactionId
  event_type: string
  description: string
  actor_id: string | null
  created_at: string
}

export interface FactionSpace {
  faction: Faction
  leader: FactionMemberSummary | null
  members: FactionMemberSummary[]
}

export interface ArenaDebate {
  id: string
  week: number
  question: string
  fighter_a_id: string
  fighter_b_id: string
  votes_a: number
  votes_b: number
  is_active: boolean
  ends_at: string
  created_at: string
}

export interface ArenaVote {
  id: string
  debate_id: string
  user_id: string
  side: 'a' | 'b'
  created_at: string
}

export interface ArenaArgument {
  id: string
  debate_id: string
  user_id: string
  faction: FactionId | null
  content: string
  created_at: string
  author?: Pick<Profile, 'username' | 'character_match_id' | 'rank' | 'faction'> | null
}

export type LoreCategory =
  | 'deep_dive'
  | 'theory'
  | 'character_study'
  | 'arc_review'
  | 'ability_analysis'
  | 'real_author'

export interface LorePost {
  id: string
  author_id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  tags: string[]
  category: LoreCategory
  is_published: boolean
  is_staff_pick: boolean
  view_count: number
  save_count: number
  read_time: number
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'role'>
}

export type RegistryDistrict =
  | 'kannai'
  | 'chinatown'
  | 'harbor'
  | 'motomachi'
  | 'honmoku'
  | 'waterfront'
  | 'other'

export type RegistryStatus = 'pending' | 'approved' | 'rejected' | 'review'

export interface RegistryReview {
  canon_consistent: boolean
  canon_notes: string
  character_accurate: boolean
  character_notes: string
  quality_score: number
  recommendation: 'approve' | 'review' | 'reject'
  recommendation_reason: string
}

export interface RegistryPost {
  id: string
  case_number: string
  author_id: string
  author_character: string | null
  author_faction: FactionId | null
  author_rank: string | null
  title: string
  content: string
  district: RegistryDistrict | null
  status: RegistryStatus
  featured: boolean
  gemini_review: RegistryReview | null
  mod_note: string | null
  reviewed_by: string | null
  word_count: number
  save_count: number
  created_at: string
  approved_at: string | null
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'role' | 'rank' | 'faction'> | null
}

export interface RegistrySave {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type QuizAnswerKey = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestionOption {
  id: QuizAnswerKey
  text: string
  faction: VisibleFactionId
}

export interface QuizQuestion {
  id: number
  prompt: string
  options: QuizQuestionOption[]
}

export interface QuizAttempt {
  id: string
  user_id: string
  answers: Record<string, QuizAnswerKey>
  status: 'in_progress' | 'resolved' | 'accepted'
  result_faction: FactionId | null
  result_role: StoredRole | null
  resolved_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface QuizResolution {
  faction: VisibleFactionId | null
  role: 'member' | 'waitlist' | 'observer'
  scores: Record<VisibleFactionId, number>
  reason: 'assigned' | 'observer'
  tiebreakUsed: boolean
}

export interface WaitlistEntry {
  id: string
  user_id: string
  faction: VisibleFactionId
  character_id: string | null
  trait_scores: Record<string, number> | null
  position: number | null
  joined_at: string
  notified_at: string | null
}

export interface AssignmentFlag {
  id: string
  user_id: string
  requested_faction: FactionId | null
  status: 'pending' | 'confirmed' | 'reassigned'
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface ObserverPoolEntry {
  id: string
  user_id: string
  scores: Record<string, number> | null
  recommended_at: string | null
  reviewed_at: string | null
  recommended_by: string | null
  can_recommend_again_at: string | null
  status: 'waiting' | 'recommended' | 'approved' | 'declined'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export type UserEventType =
  | 'quiz_complete'
  | 'faction_assignment'
  | 'character_assigned'
  | 'exam_retake'
  | 'arena_vote'
  | 'lore_post'
  | 'registry_post'
  | 'write_lore'
  | 'save_lore'
  | 'registry_save'
  | 'registry_featured'
  | 'daily_login'
  | 'login_streak'
  | 'debate_upvote'
  | 'faction_event'
  | 'easter_egg'
  | 'join_faction'

export interface UserEvent {
  id: string
  user_id: string
  event_type: UserEventType
  ap_awarded: number
  faction: FactionId | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export const AP_VALUES: Record<UserEventType, number> = {
  quiz_complete: 20,
  faction_assignment: 0,
  character_assigned: 0,
  exam_retake: 0,
  arena_vote: 10,
  lore_post: 50,
  registry_post: 50,
  write_lore: 50,
  save_lore: 5,
  registry_save: 10,
  registry_featured: 100,
  daily_login: 10,
  login_streak: 10,
  debate_upvote: 5,
  faction_event: 25,
  easter_egg: 10,
  join_faction: 0,
}

export const RANK_TITLES = [
  'Stray',
  'Filed Operative',
  'Faction Hand',
  'Field Lieutenant',
  'Inner Circle',
  'Legend File',
] as const

export function getRankTitle(rank: number): string {
  return RANK_TITLES[Math.max(0, Math.min(rank - 1, RANK_TITLES.length - 1))]
}

export function apProgress(apTotal: number) {
  const needed = 500
  const current = apTotal % needed
  return {
    current,
    needed,
    percent: Math.round((current / needed) * 100),
  }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
