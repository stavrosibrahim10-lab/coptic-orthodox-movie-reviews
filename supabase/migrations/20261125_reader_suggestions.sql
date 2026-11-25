-- The Orthodox Lens: moderated reader suggestions.
-- Run this in your existing Supabase project's SQL Editor BEFORE enabling submission UI.
-- Never paste Supabase secret keys into code or public forms.
create extension if not exists pgcrypto;
create table if not exists public.studio_suggestions (
  id uuid primary key default gen_random_uuid(),
  movie_id text references public.studio_reviews(movie_id) on delete set null,
  movie_title text not null check (char_length(movie_title) between 2 and 160),
  kind text not null check (kind in ('film_request','biblical_parallel','gospel_reflection','review_correction','general_feedback')),
  details text not null check (char_length(details) between 25 and 1800),
  scripture_reference text not null default '' check (char_length(scripture_reference) <= 140),
  source_url text not null default '' check (char_length(source_url) <= 1000),
  content_hash text not null unique check (char_length(content_hash)=64),
  state text not null default 'pending' check (state in ('pending','approved','rejected')),
  moderator_note text not null default '',
  reviewed_by uuid references auth.users(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists studio_suggestions_review_idx on public.studio_suggestions(state, created_at desc);
create index if not exists studio_suggestions_public_idx on public.studio_suggestions(movie_id, state, moderated_at desc);
alter table public.studio_suggestions enable row level security;
revoke all on public.studio_suggestions from public, anon, authenticated;
grant select, insert, update, delete on public.studio_suggestions to service_role;
-- Service role is used only inside Netlify Functions. Browsers never receive its key.
