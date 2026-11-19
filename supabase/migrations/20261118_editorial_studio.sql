-- The Orthodox Lens / Editorial Studio — Supabase schema
-- Apply once in Supabase SQL Editor. Secret-key-only access for editorial tables.
-- New users are invite-only; all privileged routes verify Supabase Auth + member role.
create extension if not exists pgcrypto;

create table if not exists public.studio_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null check (role in ('owner','editor','reviewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_reviews (
  movie_id text primary key check (length(movie_id) between 1 and 120),
  title text not null,
  release_year integer not null check(release_year between 1880 and 2100),
  verdict text check (verdict in ('edifying','neutral','destructive')),
  suggested_age text,
  draft jsonb not null,
  published jsonb,
  workflow text not null default 'draft' check(workflow in ('draft','in_review','ready','published')),
  revision integer not null default 1 check (revision >= 1),
  facts_by uuid references auth.users(id),
  facts_at timestamptz,
  age_by uuid references auth.users(id),
  age_at timestamptz,
  spiritual_by uuid references auth.users(id),
  spiritual_at timestamptz,
  published_by uuid references auth.users(id),
  published_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists studio_reviews_updated_idx on public.studio_reviews(updated_at desc);
create index if not exists studio_reviews_workflow_idx on public.studio_reviews(workflow);

create table if not exists public.studio_revisions (
  id bigint generated always as identity primary key,
  movie_id text not null references public.studio_reviews(movie_id) on delete cascade,
  revision integer not null,
  action text not null,
  snapshot jsonb not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists studio_revisions_movie_idx on public.studio_revisions(movie_id, created_at desc);

create table if not exists public.studio_issues (
  id uuid primary key default gen_random_uuid(),
  issue_key text unique not null,
  movie_id text not null references public.studio_reviews(movie_id) on delete cascade,
  kind text not null check(kind in ('source','age','theological','quality')),
  title text not null,
  detail text not null default '',
  source_url text not null default '',
  state text not null default 'open' check(state in ('open','resolved','waived')),
  resolution_note text not null default '',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists studio_issues_movie_idx on public.studio_issues(movie_id, state);

create table if not exists public.studio_events (
  id bigint generated always as identity primary key,
  kind text not null check(kind in ('movie_view','search')),
  movie_id text,
  movie_title text,
  query_term text,
  result_count integer,
  created_at timestamptz not null default now()
);
create index if not exists studio_events_date_idx on public.studio_events(created_at desc);
create index if not exists studio_events_kind_idx on public.studio_events(kind,created_at desc);

create table if not exists public.studio_activity (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  movie_id text,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists studio_activity_recent_idx on public.studio_activity(created_at desc);

-- No direct public/editor PostgREST grants. Netlify Functions provide the sole data API.
-- Even if a permissive grant were added later, explicit RLS still denies anonymous/editor users.
alter table public.studio_members enable row level security;
alter table public.studio_reviews enable row level security;
alter table public.studio_revisions enable row level security;
alter table public.studio_issues enable row level security;
alter table public.studio_events enable row level security;
alter table public.studio_activity enable row level security;
revoke all on public.studio_members, public.studio_reviews, public.studio_revisions,
  public.studio_issues, public.studio_events, public.studio_activity from anon, authenticated;
revoke all on public.studio_revisions_id_seq, public.studio_events_id_seq,
  public.studio_activity_id_seq from anon, authenticated;
grant select,insert,update,delete on public.studio_members, public.studio_reviews,
  public.studio_revisions, public.studio_issues, public.studio_events,
  public.studio_activity to service_role;
grant usage,select on public.studio_revisions_id_seq, public.studio_events_id_seq,
  public.studio_activity_id_seq to service_role;

-- Aggregated usage counts. Custom events deliberately collect no IP, cookie or user ID.
create or replace function public.studio_analytics_snapshot(p_days integer default 30)
returns jsonb language sql stable security definer set search_path = public as $$
with filtered as (
  select kind,movie_id,movie_title,query_term,result_count,created_at
    from public.studio_events
    where created_at >= now() - (greatest(1,least(365,p_days)) * interval '1 day')
),
totals as (
  select count(*) filter(where kind='movie_view') as views,
         count(*) filter(where kind='search') as searches,
         count(*) filter(where kind='search' and result_count=0) as no_results
  from filtered
),
daily as (
  select to_char(date_trunc('day',created_at at time zone 'UTC'),'YYYY-MM-DD') as day,
         count(*) filter(where kind='movie_view') as views,
         count(*) filter(where kind='search') as searches
  from filtered group by 1 order by 1
),
topmovies as (
  select movie_id, max(movie_title) as title, count(*) as views
  from filtered where kind='movie_view' group by movie_id order by views desc limit 12
),
topsearch as (
  select query_term as term, count(*) as count,
         count(*) filter(where result_count=0) as no_results
  from filtered where kind='search' and query_term is not null
  group by query_term order by count desc limit 15
)
select jsonb_build_object(
  'totals', (select to_jsonb(t) from totals t),
  'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d),'[]'::jsonb),
  'top_movies', coalesce((select jsonb_agg(to_jsonb(m)) from topmovies m),'[]'::jsonb),
  'top_searches', coalesce((select jsonb_agg(to_jsonb(s)) from topsearch s),'[]'::jsonb)
);
$$;
revoke execute on function public.studio_analytics_snapshot(integer) from public, anon, authenticated;
grant execute on function public.studio_analytics_snapshot(integer) to service_role;

-- For an owner: first create a user in Supabase > Authentication > Users,
-- then REPLACE the email below and run the next statement in SQL Editor:
-- insert into public.studio_members(user_id,display_name,role)
-- select id,'Editor-in-Chief','owner' from auth.users where lower(email)=lower('YOUR_EMAIL@example.com')
-- on conflict(user_id) do update set role='owner',active=true;
