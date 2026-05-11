create table if not exists mood_scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_id uuid references entries(id) on delete cascade,
  check_in_id uuid references check_ins(id) on delete cascade,
  emotion text not null,
  valence int not null check (valence between 1 and 10),
  energy int not null check (energy between 1 and 10),
  sleep_hours numeric(3,1) check (sleep_hours >= 0 and sleep_hours <= 24),
  context_tags text[] not null default '{}'
);
create index if not exists mood_scores_created_at_idx on mood_scores (created_at desc);
