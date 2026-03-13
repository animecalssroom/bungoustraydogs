-- Migration: add is_sudden_death to duel_rounds
ALTER TABLE duel_rounds
  ADD COLUMN IF NOT EXISTS is_sudden_death boolean DEFAULT false;

COMMENT ON COLUMN duel_rounds.is_sudden_death IS 'True when this round is a sudden-death round (round 8).';
