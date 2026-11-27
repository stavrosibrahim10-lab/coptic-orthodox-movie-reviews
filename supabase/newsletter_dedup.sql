-- Run once in the Supabase SQL editor before deploying the newsletter popup PR.
begin;
create table if not exists public.newsletter_optin_cooldowns (
  email_key text primary key check (email_key ~ '^[a-f0-9]{64}$'),
  claim_token uuid not null,
  retry_after timestamptz not null
);
alter table public.newsletter_optin_cooldowns enable row level security;
revoke all on table public.newsletter_optin_cooldowns from public, anon, authenticated;
create index if not exists newsletter_optin_retry_idx on public.newsletter_optin_cooldowns(retry_after);
create or replace function public.claim_newsletter_email(p_key text,p_token uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  -- Keep pseudonymous expired claims for at most seven days during normal activity.
  delete from public.newsletter_optin_cooldowns where retry_after < now() - interval '7 days';
  insert into public.newsletter_optin_cooldowns as existing(email_key,claim_token,retry_after)
    values(p_key,p_token,now()+interval '24 hours')
  on conflict(email_key) do update set claim_token=excluded.claim_token,retry_after=excluded.retry_after
    where existing.retry_after <= now();
  get diagnostics affected = row_count;
  return affected=1;
end;
$$;
create or replace function public.release_newsletter_email(p_key text,p_token uuid)
returns void language sql security definer set search_path='' as $$
  delete from public.newsletter_optin_cooldowns where email_key=p_key and claim_token=p_token;
$$;
revoke all on function public.claim_newsletter_email(text,uuid) from public, anon, authenticated;
revoke all on function public.release_newsletter_email(text,uuid) from public, anon, authenticated;
grant execute on function public.claim_newsletter_email(text,uuid) to service_role;
grant execute on function public.release_newsletter_email(text,uuid) to service_role;
commit;
