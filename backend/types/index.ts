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
  | 'user'
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
  secondary_character_slug?: string | null
  secondary_character_name?: string | null
  exam_completed: boolean
  exam_taken_at: string | null
  exam_answers: Record<string, string> | null
  exam_scores: Record<string, number> | null
  quiz_scores?: Record<string, number> | null
  exam_status: ExamStatus | null
  quiz_completed: boolean
  quiz_locked: boolean
  assignment_flag_used: boolean
  trait_scores: Record<string, number> | null
  behavior_scores: BehaviorScores | null
  avg_move_speed_minutes?: number | null
  exam_retake_eligible_at: string | null
  exam_retake_used: boolean
  ap_total: number
  rank: number
  duel_wins: number
  duel_losses: number
  is_bot?: boolean | null
  login_streak: number
  guide_bot_dismissed?: boolean | null
  guide_bot_opened_at?: string | null
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
  notable_works: string | null
  ability_type: AbilityType | null
  duel_voice: string | null
  literary_link: string | null
  special_mechanic: string | null
  stat_power: number
  stat_speed: number
  stat_intel: number
  stat_loyalty: number
  stat_control: number
  kanji_symbol: string
  role_id: CharacterArchetype | null
  designation?: string | null
  clearance_level?: string | null
  ability_analysis?: string | null
  lore_background?: string | null
  physical_evidence?: string[] | null
  narrative_hook?: string | null
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
  duel_voice: string | null
  literary_link: string | null
  special_mechanic: string | null
  designation: string | null
  clearance_level: string | null
  ability_analysis: string | null
  lore_background: string | null
  physical_evidence: string[] | null
  narrative_hook: string | null
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
  character_name?: string | null
  avatar_url: string | null
  rank: number
  ap_total: number
  role: StoredRole
  faction: FactionId | null
  character_match_id: string | null
  behavior_scores?: BehaviorScores | null
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
export type RegistryPostType =
  | 'field_note'
  | 'incident_report'
  | 'classified_report'
  | 'chronicle_submission'

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
  post_type: RegistryPostType
  parent_post_id: string | null
  thread_id: string | null
  thread_position: number
  min_words: number
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

export interface RegistryThread {
  id: string
  title: string
  author_id: string
  faction: FactionId | null
  district: RegistryDistrict | null
  post_count: number
  total_words: number
  status: string
  created_at: string
  last_updated: string
}

export interface RegistrySave {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type DiscussionEntityType = 'lore' | 'registry'

export interface PostComment {
  id: string
  entity_type: DiscussionEntityType
  entity_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'role' | 'rank' | 'faction'> | null
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
  status: 'waiting' | 'recommended' | 'approved' | 'declined' | 'designated'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  payload: Record<string, unknown> | null
  action_url?: string | null
  reference_id?: string | null
  read_at: string | null
  created_at: string
}

export type TicketQueue = 'owner' | 'special_division'

export type TicketCategory =
  | 'assignment'
  | 'intake'
  | 'faction'
  | 'registry'
  | 'lore'
  | 'account'
  | 'bug'
  | 'special_division'

export type TicketStatus = 'open' | 'in_review' | 'resolved' | 'dismissed'

export interface SupportTicket {
  id: string
  user_id: string
  queue: TicketQueue
  category: TicketCategory
  subject: string
  details: string
  status: TicketStatus
  response_note: string | null
  handled_by: string | null
  handled_at: string | null
  created_at: string
  updated_at: string
}

export type ContentFlagEntityType = 'lore_post' | 'registry_post' | 'comment'
export type ContentFlagStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned'

export interface ContentFlag {
  id: string
  reporter_id: string
  queue: TicketQueue
  entity_type: ContentFlagEntityType
  entity_id: string
  target_path: string
  target_label: string | null
  reason: string
  details: string | null
  status: ContentFlagStatus
  action_taken: string | null
  handled_by: string | null
  handled_at: string | null
  created_at: string
  updated_at: string
}

export interface GuideBotMessage {
  id: string
  user_id?: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface GuideBotState {
  isOpen: boolean
  messages: GuideBotMessage[]
  isLoading: boolean
  isDismissed: boolean
  input: string
}

export type UserEventType =
  | 'quiz_complete'
  | 'faction_assignment'
  | 'character_assigned'
  | 'exam_retake'
  | 'duel_accepted'
  | 'duel_complete'
  | 'arena_vote'
  | 'lore_post'
  | 'registry_post'
  | 'registry_submit'
  | 'chat_message'
  | 'bulletin_post'
  | 'feed_view'
  | 'profile_view'
  | 'write_lore'
  | 'save_lore'
  | 'registry_save'
  | 'registry_featured'
  | 'archive_view'
  | 'archive_read'
  | 'faction_checkin'
  | 'daily_login'
  | 'login_streak'
  | 'special_division_designated'
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
  duel_accepted: 0,
  duel_complete: 0, // Handled manually in duel-runtime
  arena_vote: 5,
  lore_post: 50,
  registry_post: 25,
  registry_submit: 0,
  chat_message: 2,
  bulletin_post: 10,
  feed_view: 0,
  profile_view: 0,
  write_lore: 50,
  save_lore: 5,
  registry_save: 10,
  registry_featured: 100,
  archive_view: 5,
  archive_read: 3,
  faction_checkin: 5,
  daily_login: 5,
  login_streak: 10,
  special_division_designated: 0,
  debate_upvote: 5,
  faction_event: 25,
  easter_egg: 10,
  join_faction: 0,
}

export const FACTION_RANK_TITLES: Record<string, string[]> = {
  agency: [
    'Unaffiliated Detective',   // Rank 1 — 0 AP
    'Field Operative',          // Rank 2 — 100 AP
    'Senior Operative',         // Rank 3 — 500 AP
    'Lead Detective',           // Rank 4 — 1500 AP
    'Special Investigator',     // Rank 5 — 4000 AP
    'Executive Agent',          // Rank 6 — 10000 AP
  ],
  mafia: [
    'Foot Soldier',             // Rank 1
    'Operative',                // Rank 2
    'Lieutenant',               // Rank 3
    'Captain',                  // Rank 4
    'Executive',                // Rank 5
    'Black Hand',               // Rank 6
  ],
  guild: [
    'Associate',                // Rank 1
    'Contractor',               // Rank 2
    'Acquisitions Agent',       // Rank 3
    'Senior Partner',           // Rank 4
    'Director',                 // Rank 5
    'Founding Member',          // Rank 6
  ],
  hunting_dogs: [
    'Blade Candidate',          // Rank 1
    'Enlisted',                 // Rank 2
    'Sergeant',                 // Rank 3
    'Lieutenant',               // Rank 4
    'Commander',                // Rank 5
    'First Hound',              // Rank 6
  ],
  special_div: [
    'Flagged',                  // Rank 1
    'Monitored',                // Rank 2
    'Cleared',                  // Rank 3
    'Operative',                // Rank 4
    'Handler',                  // Rank 5
    'Controller',               // Rank 6
  ],
}

// Generic fallback for unassigned/wanderer users
export const RANK_TITLES = [
  'Stray',
  'Filed Operative',
  'Faction Hand',
  'Field Lieutenant',
  'Inner Circle',
  'Legend File',
] as const

export const RANK_THRESHOLDS = [
  { rank: 1, ap: 0 },
  { rank: 2, ap: 100 },
  { rank: 3, ap: 500 },
  { rank: 4, ap: 1500 },
  { rank: 5, ap: 4000 },
  { rank: 6, ap: 10000 },
]

export function calculateRank(apTotal: number): number {
  let rank = 1
  for (const threshold of RANK_THRESHOLDS) {
    if (apTotal >= threshold.ap) {
      rank = threshold.rank
    } else {
      break
    }
  }
  return rank
}

export const CHARACTER_ASSIGNMENT_THRESHOLD = 10

export const QUALIFYING_ASSIGNMENT_EVENTS: UserEventType[] = [
  'daily_login',
  'chat_message',
  'archive_read',
  'lore_post',
  'duel_complete',
  'arena_vote',
  'registry_post',
  'bulletin_post',
  'faction_checkin',
  'write_lore',
  'save_lore',
  'registry_save',
  'registry_featured',
]

// Updated getRankTitle — now takes optional faction
export function getRankTitle(rank: number, faction?: string | null): string {
  const index = Math.max(0, Math.min(rank - 1, 5))
  if (faction && FACTION_RANK_TITLES[faction]) {
    return FACTION_RANK_TITLES[faction][index] ?? RANK_TITLES[index]
  }
  return RANK_TITLES[index]
}

export function apProgress(apTotal: number) {
  const rank = calculateRank(apTotal)
  const currentThreshold = RANK_THRESHOLDS.find(t => t.rank === rank)?.ap ?? 0
  const nextThreshold = RANK_THRESHOLDS.find(t => t.rank === rank + 1)?.ap ?? currentThreshold
  
  const span = Math.max(nextThreshold - currentThreshold, 1)
  const current = apTotal - currentThreshold
  
  return {
    current,
    needed: nextThreshold,
    remaining: Math.max(0, nextThreshold - apTotal),
    percent: Math.round(Math.min((current / span) * 100, 100)),
  }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export type DuelStatus =
  | 'pending'
  | 'declined'
  | 'active'
  | 'complete'
  | 'forfeit'
  | 'cancelled'

export type DuelMove = 'strike' | 'stance' | 'gambit' | 'special' | 'recover'

export interface Duel {
  id: string
  challenger_id: string
  defender_id: string
  challenger_character: string | null
  defender_character: string | null
  challenger_character_slug: string | null
  defender_character_slug: string | null
  challenger_faction: FactionId | null
  defender_faction: FactionId | null
  status: DuelStatus
  current_round: number
  challenger_hp: number
  defender_hp: number
  challenger_max_hp: number
  defender_max_hp: number
  winner_id: string | null
  loser_id: string | null
  ap_awarded: boolean
  is_ranked: boolean
  is_war_duel: boolean
  is_tag_team: boolean
  is_faction_raid: boolean
  is_boss_fight: boolean
  war_id: string | null
  challenger_came_back: boolean
  defender_came_back: boolean
  decline_reason: string | null
  challenge_message: string | null
  challenge_expires_at: string | null
  accepted_at: string | null
  completed_at: string | null
  created_at: string
}

export interface DuelRound {
  id: string
  duel_id: string
  round_number: number
  challenger_move: DuelMove | null
  challenger_override_character: string | null
  challenger_move_submitted_at: string | null
  defender_move: DuelMove | null
  defender_move_submitted_at: string | null
  round_started_at: string
  round_deadline: string | null
  is_sudden_death?: boolean
  reversal_available: boolean
  reversal_deadline: string | null
  reversal_used: boolean
  challenger_damage_dealt: number
  defender_damage_dealt: number
  challenger_hp_after: number | null
  defender_hp_after: number | null
  special_events: Array<Record<string, unknown>>
  narrative: string | null
  narrative_is_fallback: boolean
  resolved_at: string | null
}

export interface OpenChallenge {
  id: string
  challenger_id: string
  faction: FactionId | null
  character_name: string | null
  message: string | null
  status: 'open' | 'accepted' | 'expired' | 'withdrawn'
  accepted_by: string | null
  duel_id: string | null
  expires_at: string | null
  created_at: string
}

export interface DuelCooldown {
  id: string
  duel_id: string
  user_id: string
  ability_type: 'special' | 'recover'
  locked_until_round: number
}
export interface TerritoryControl {
  district: RegistryDistrict
  controlling_faction: FactionId | null
  influence: Record<FactionId, number>
  status: 'stable' | 'contested' | 'warzone'
}

export type WarStatus = 'pending' | 'active' | 'day2' | 'day3' | 'complete'
export type WarStakesType = 'district' | 'ap_multiplier' | 'registry_priority' | 'narrative'

export interface FactionRanking {
  faction: FactionId
  score: number
}

export interface WarGlobalStatus {
  status: WarStatus
  active_wars: number
  total_territories: number
  faction_rankings: FactionRanking[]
}

export interface FactionWar {
  id: string
  faction_a_id: string
  faction_b_id: string
  status: WarStatus
  stakes: WarStakesType
  stakes_detail: Record<string, any>
  faction_a_points: number
  faction_b_points: number
  winner_id: string | null
  war_message: string | null
  chronicle_id: string | null
  starts_at: string | null
  day2_at: string | null
  day3_at: string | null
  ends_at: string | null
  resolved_at: string | null
  boss_active: boolean
  created_at: string
}

export interface WarContribution {
  id: string
  war_id: string
  user_id: string
  contribution_type: 'duel_win' | 'registry_post' | 'daily_login' | 'team_fight' | 'boss_fight'
  points: number
  reference_id: string | null
  created_at: string
}

export type ChronicleEntryType = 'chapter' | 'war_record' | 'duel_record' | 'character_event' | 'scenario_outcome' | 'player_submission'

export interface ChronicleEntry {
  id: string
  entry_number: number
  title: string
  content: string
  entry_type: ChronicleEntryType
  faction_focus: string | null
  author_id: string | null
  is_featured: boolean
  created_at: string
  published_at: string | null
}
