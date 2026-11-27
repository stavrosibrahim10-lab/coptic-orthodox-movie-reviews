-- Apply in Supabase SQL Editor BEFORE merging the site PR. Additive; preserves existing analytics.
begin;
create table if not exists public.newsletter_interest (
 email text primary key check(email=lower(trim(email)) and length(email)<=254),
 created_at timestamptz not null default now()
);
alter table public.newsletter_interest enable row level security;
revoke all on public.newsletter_interest from public,anon,authenticated;
grant select,insert,delete on public.newsletter_interest to service_role;
alter table public.studio_events drop constraint if exists studio_events_kind_check;
alter table public.studio_events add constraint studio_events_kind_check check(kind in ('movie_view','search','page_view','share','suggestion','interest_prompt','interest_submit'));
alter table public.studio_events add column if not exists visitor_id uuid, add column if not exists session_id uuid, add column if not exists page text, add column if not exists source text, add column if not exists device text;
create index if not exists studio_events_visitor_idx on public.studio_events(visitor_id,created_at) where visitor_id is not null;
create index if not exists studio_events_session_idx on public.studio_events(session_id,created_at) where session_id is not null;
create or replace function public.studio_analytics_snapshot(p_days integer default 30)
returns jsonb language sql stable security definer set search_path='' as $$
with bounds as (
 select greatest(1,least(90,coalesce(p_days,30))) n, (now() at time zone 'UTC')::date today
), dates as (
 select n,today,(today-n+1)::timestamp at time zone 'UTC' as start_at,(today-2*n+1)::timestamp at time zone 'UTC' as prior_at from bounds
), f as (
 select e.* from public.studio_events e,dates d where e.created_at>=d.start_at
), prior as (
 select e.* from public.studio_events e,dates d where e.created_at>=d.prior_at and e.created_at<d.start_at
), visitors as (
 select visitor_id,count(distinct (created_at at time zone 'UTC')::date) active_days from f where visitor_id is not null group by visitor_id
), sessions as (
 select session_id,count(*) filter(where kind='page_view') pages,count(*) filter(where kind in ('search','share','suggestion','interest_submit')) interactions from f where session_id is not null group by session_id
), totals as (
 select count(*) filter(where kind='movie_view') views,count(*) filter(where kind='search') searches,count(*) filter(where kind='search' and result_count=0) no_results,
 count(*) filter(where kind='page_view') pageviews,count(distinct visitor_id) browsers,count(distinct session_id) sessions,count(*) filter(where kind='share') shares,count(*) filter(where kind='suggestion') suggestions,count(*) filter(where kind='interest_prompt') prompts,count(*) filter(where kind='interest_submit') interest_attempts,
 (select count(*) from visitors where active_days>1) returning_browsers,
 (select count(*) from sessions where pages>1 or interactions>0) engaged_sessions
 from f
), previous as (
 select count(*) filter(where kind='movie_view') views,count(*) filter(where kind='page_view') pageviews,count(distinct visitor_id) browsers,count(distinct session_id) sessions,count(*) filter(where kind='search') searches from prior
), daily as (
 select to_char(g.day,'YYYY-MM-DD') AS "day",count(f.id) filter(where f.kind='movie_view') views,count(f.id) filter(where f.kind='search') searches,count(f.id) filter(where f.kind='page_view') pageviews,count(distinct f.visitor_id) browsers
 from dates d cross join lateral generate_series(d.today-d.n+1,d.today,interval '1 day') g("day")
 left join f on (f.created_at at time zone 'UTC')::date=g.day::date group by g.day order by g.day
), movies as (
 select movie_id,max(movie_title) title,count(*) views from f where kind='movie_view' group by movie_id order by views desc,movie_id limit 12
), searches as (
 select query_term term,count(*) AS count,count(*) filter(where result_count=0) no_results from f where kind='search' and query_term is not null group by query_term order by count desc,term limit 15
), misses as (
 select query_term term,count(*) AS count from f where kind='search' and result_count=0 and query_term is not null group by query_term order by count desc,term limit 15
), pages as (
 select page label,count(*) AS count from f where kind='page_view' and page is not null group by page order by count desc
), session_dimensions as (
 select distinct on(session_id) session_id,source,device from f where session_id is not null and kind='page_view' order by session_id,created_at,id
), sources as (
 select source label,count(*) AS count from session_dimensions where source is not null group by source order by count desc
), devices as (
 select device label,count(*) AS count from session_dimensions where device is not null group by device order by count desc
), interest as (
 select count(*) total,count(*) filter(where created_at>=d.start_at) added,count(*) filter(where created_at>=d.prior_at and created_at<d.start_at) previous from public.newsletter_interest cross join dates d
)
select jsonb_build_object('analytics_version',2,'totals',(select to_jsonb(t) from totals t),'previous',(select to_jsonb(p) from previous p),'interest',(select to_jsonb(i) from interest i),
 'daily',coalesce((select jsonb_agg(to_jsonb(x) order by x.day) from daily x),'[]'::jsonb),
 'top_movies',coalesce((select jsonb_agg(to_jsonb(x) order by x.views desc) from movies x),'[]'::jsonb),
 'top_searches',coalesce((select jsonb_agg(to_jsonb(x) order by x.count desc) from searches x),'[]'::jsonb),
 'missing_searches',coalesce((select jsonb_agg(to_jsonb(x) order by x.count desc) from misses x),'[]'::jsonb),
 'pages',coalesce((select jsonb_agg(to_jsonb(x) order by x.count desc) from pages x),'[]'::jsonb),
 'sources',coalesce((select jsonb_agg(to_jsonb(x) order by x.count desc) from sources x),'[]'::jsonb),
 'devices',coalesce((select jsonb_agg(to_jsonb(x) order by x.count desc) from devices x),'[]'::jsonb));
$$;
revoke all on function public.studio_analytics_snapshot(integer) from public,anon,authenticated;
grant execute on function public.studio_analytics_snapshot(integer) to service_role;
-- No raw email is returned by the analytics RPC. Keep the interest list private.
commit;
