-- Rings can be generated automatically (weekly Vercel cron) or manually from
-- the /rings page. Record which is which so the archive can disambiguate when
-- multiple rings land on the same day, and remember the window the user chose.

alter table public.themes
  add column if not exists source text not null default 'auto'
    check (source in ('auto','manual')),
  add column if not exists window_days int;
