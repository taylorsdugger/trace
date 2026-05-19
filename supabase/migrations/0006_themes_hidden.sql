-- Rings can be hidden from the archive without being deleted, so the
-- AI-generated history is preserved but the user controls what shows.
-- Used by /rings/all to dismiss unwanted walks and to retire originals
-- after a merge.

alter table public.themes
  add column if not exists hidden_at timestamptz;

create index if not exists themes_visible_idx
  on public.themes (generated_at desc)
  where hidden_at is null;
