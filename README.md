# Trace

**Trace: CBT Journal with Memory.** Personal CBT journaling with semantic memory across all your entries. Next.js + Supabase + OpenRouter. Free-tier hostable on Vercel.

## Setup

1. `cp .env.local.example .env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project (Settings → API)
   - `OPENROUTER_API_KEY` — from https://openrouter.ai
   - `APP_PASSWORD` — anything; what you'll type at /login
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `CRON_SECRET` — `openssl rand -hex 32` (Vercel cron + manual theme runs)
2. In Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
3. `npm run dev` and visit http://localhost:3000.

## Deploy

- Push to GitHub, import to Vercel, paste the same env vars.
- Vercel cron (`vercel.json`) auto-runs the weekly themes job Sundays 13:00 UTC.

## Generate a themes summary manually

```
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP.vercel.app/api/ai/themes
```

## Layout

- `app/` — App Router pages + API routes
- `lib/` — supabase, openrouter, auth, embeddings, prompts
- `components/` — Editor, SocraticPanel, EntriesSearch, Nav
- `supabase/migrations/` — schema
- `vercel.json` — cron config
- `public/manifest.json` + `public/icons/` — PWA install
