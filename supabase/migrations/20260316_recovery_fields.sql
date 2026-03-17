-- Add recovery fields for War Mode Redesign (Phase 10b)
-- Enables MIA/Deceased state tracking

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS recovery_until timestamptz DEFAULT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS recovery_status text DEFAULT 'active';

-- Index for searching users in recovery (e.g., for healers)
CREATE INDEX IF NOT EXISTS idx_profiles_recovery 
ON public.profiles (recovery_until) 
WHERE recovery_until IS NOT NULL;
