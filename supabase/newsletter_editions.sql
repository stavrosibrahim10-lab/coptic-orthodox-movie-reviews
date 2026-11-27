-- Apply before enabling the monthly newsletter function.
begin;
create table if not exists public.newsletter_editions (
  edition_key text primary key check (edition_key ~ '^(live|test):[0-9]{4}-[0-9]{2}$'),
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  audience_id bigint not null check (audience_id>0),
  state text not null check (state in ('creating','draft','sending','sent','needs_review')),
  campaign_id bigint unique check (campaign_id>0),
  review_ids jsonb not null default '[]'::jsonb,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.newsletter_editions enable row level security;
revoke all on public.newsletter_editions from public, anon, authenticated;
grant select,insert,update on public.newsletter_editions to service_role;
commit;
