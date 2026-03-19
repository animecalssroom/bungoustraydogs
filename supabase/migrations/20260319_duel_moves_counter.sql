alter table profiles
  add column if not exists duel_moves_count integer default 0;
