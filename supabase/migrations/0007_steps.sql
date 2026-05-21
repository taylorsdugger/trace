-- Trailhead: steps (planner tasks). Single-user, server-only access via
-- service role — same pattern as entries, check_ins, etc. RLS on with no
-- policies, privileges revoked from anon/authenticated.

create table if not exists steps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  notes_md text,
  status text not null default 'open' check (status in ('open','walked','let_rest')),
  due_date date,                              -- null = unplanted (backlog)
  position int not null default 0,            -- order within a day/backlog
  estimate text,                              -- opaque, e.g. '30m', '1h', '2h'
  tag text,
  walked_at timestamptz
);

create index if not exists steps_due_date_idx on steps (due_date);
create index if not exists steps_status_idx on steps (status);
create index if not exists steps_position_idx on steps (due_date, position);

drop trigger if exists steps_touch on steps;
create trigger steps_touch before update on steps
  for each row execute function touch_updated_at();

alter table public.steps enable row level security;
revoke all on public.steps from anon, authenticated;
