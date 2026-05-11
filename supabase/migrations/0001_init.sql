-- CBT App: initial schema
-- Run in Supabase SQL editor (or via supabase CLI).

create extension if not exists vector;

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null default 'journal' check (kind in ('journal','thought_record','check_in')),
  title text,
  body_md text not null default '',
  mood int check (mood between 1 and 10),
  tags text[] not null default '{}'
);

create index if not exists entries_created_at_idx on entries (created_at desc);
create index if not exists entries_kind_idx on entries (kind);

create table if not exists thought_records (
  entry_id uuid primary key references entries(id) on delete cascade,
  situation text,
  automatic_thoughts text,
  emotions jsonb not null default '[]'::jsonb,
  distortions text[] not null default '{}',
  balanced_thought text,
  outcome text
);

create table if not exists embeddings (
  entry_id uuid not null references entries(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  primary key (entry_id, chunk_index)
);

create index if not exists embeddings_vec_idx
  on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  summary_md text not null,
  top_distortions text[] not null default '{}',
  generated_at timestamptz not null default now()
);

create index if not exists themes_period_idx on themes (period_end desc);

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mood int check (mood between 1 and 10),
  prompt text,
  transcript jsonb not null default '[]'::jsonb,
  entry_id uuid references entries(id) on delete set null
);

create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists entries_touch on entries;
create trigger entries_touch before update on entries
  for each row execute function touch_updated_at();

-- Hybrid search RPC: vector similarity + keyword ILIKE, returns top entries.
create or replace function search_entries(
  query_embedding vector(768),
  query_text text,
  match_count int default 10
) returns table (
  entry_id uuid,
  title text,
  body_md text,
  created_at timestamptz,
  score float
) language sql stable as $$
  with vec as (
    select e.entry_id, 1 - (e.embedding <=> query_embedding) as sim
    from embeddings e
  ),
  scored as (
    select
      en.id as entry_id,
      en.title,
      en.body_md,
      en.created_at,
      coalesce(max(v.sim), 0) +
        case when query_text <> '' and (
          en.title ilike '%'||query_text||'%' or en.body_md ilike '%'||query_text||'%'
        ) then 0.2 else 0 end as score
    from entries en
    left join vec v on v.entry_id = en.id
    group by en.id
  )
  select entry_id, title, body_md, created_at, score
  from scored
  order by score desc
  limit match_count;
$$;
