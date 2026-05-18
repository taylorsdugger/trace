-- This app is single-user and only accesses the database from server-side
-- routes using the service role key (which bypasses RLS). The anon and
-- authenticated roles should never reach these tables via PostgREST.
--
-- 1. Enable RLS on every public table. With no policies defined, anon and
--    authenticated get zero rows. Service role bypasses RLS, so server code
--    is unaffected.
-- 2. Revoke table privileges from anon/authenticated as defense in depth.

alter table public.entries          enable row level security;
alter table public.thought_records  enable row level security;
alter table public.embeddings       enable row level security;
alter table public.themes           enable row level security;
alter table public.check_ins        enable row level security;
alter table public.mood_scores      enable row level security;

revoke all on public.entries         from anon, authenticated;
revoke all on public.thought_records from anon, authenticated;
revoke all on public.embeddings      from anon, authenticated;
revoke all on public.themes          from anon, authenticated;
revoke all on public.check_ins       from anon, authenticated;
revoke all on public.mood_scores     from anon, authenticated;

-- Also lock down the hybrid search RPC so it can't be invoked from the client.
revoke all on function public.search_entries(vector, text, int) from anon, authenticated;
