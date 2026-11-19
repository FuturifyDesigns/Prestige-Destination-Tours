begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists prestige_private.request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.travel_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  leased_until timestamptz,
  sent_at timestamptz,
  provider_id text,
  last_error text
);
alter table prestige_private.request_notifications enable row level security;
revoke all on prestige_private.request_notifications from public, anon, authenticated;
create index if not exists request_notifications_due_idx
  on prestige_private.request_notifications(next_attempt_at) where sent_at is null;

create or replace function prestige_private.dispatch_request_notifications()
returns void language plpgsql security definer set search_path = '' as $$
declare worker_token text;
begin
  if not exists (select 1 from prestige_private.request_notifications
    where sent_at is null and attempts < 8 and next_attempt_at <= now()
      and (leased_until is null or leased_until < now())) then return; end if;
  select decrypted_secret into worker_token from vault.decrypted_secrets
    where name = 'prestige_request_notification_token' limit 1;
  if worker_token is null then return; end if;
  perform net.http_post(
    url := 'https://rymjzgwiinuwmieszkak.supabase.co/functions/v1/request-notifications',
    headers := jsonb_build_object('Content-Type','application/json','x-notification-token',worker_token),
    body := '{}'::jsonb, timeout_milliseconds := 60000
  );
end $$;
revoke all on function prestige_private.dispatch_request_notifications() from public, anon, authenticated;

create or replace function prestige_private.enqueue_request_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into prestige_private.request_notifications(request_id) values (new.id)
    on conflict (request_id) do nothing;
  -- pg_net sends after commit, so delivery does not delay a customer's submission.
  begin
    perform prestige_private.dispatch_request_notifications();
  exception when others then
    -- The queued request remains available to the retry job if dispatch is unavailable.
    raise warning 'Request saved; immediate notification dispatch deferred';
  end;
  return new;
end $$;
revoke all on function prestige_private.enqueue_request_notification() from public, anon, authenticated;
drop trigger if exists travel_requests_email_notification on public.travel_requests;
create trigger travel_requests_email_notification after insert on public.travel_requests
  for each row execute function prestige_private.enqueue_request_notification();

create or replace function public.claim_request_notifications()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  with due as (
    select n.id from prestige_private.request_notifications n
    join public.travel_requests r on r.id = n.request_id
    where n.sent_at is null and n.attempts < 8 and n.next_attempt_at <= now()
      and (n.leased_until is null or n.leased_until < now()) and r.deleted_at is null
    order by n.created_at for update of n skip locked limit 3
  ), claimed as (
    update prestige_private.request_notifications n
    set attempts = attempts + 1, lease_token = gen_random_uuid(), leased_until = now() + interval '5 minutes'
    from due where n.id = due.id returning n.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'lease_token', c.lease_token,
    'request', to_jsonb(r))), '[]'::jsonb) into result
    from claimed c join public.travel_requests r on r.id = c.request_id;
  return result;
end $$;

create or replace function public.finish_request_notification(
  job_id uuid, claim_token uuid, delivered boolean, delivery_id text, failure_code text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  update prestige_private.request_notifications set
    sent_at = case when delivered then now() else null end,
    provider_id = case when delivered then left(delivery_id, 300) else null end,
    last_error = case when delivered then null else left(failure_code, 200) end,
    next_attempt_at = now() + make_interval(secs => least(3600, (30 * power(2, attempts))::integer)),
    lease_token = null, leased_until = null
  where id = job_id and lease_token = claim_token and sent_at is null;
end $$;
revoke all on function public.claim_request_notifications() from public, anon, authenticated;
revoke all on function public.finish_request_notification(uuid,uuid,boolean,text,text) from public, anon, authenticated;
grant execute on function public.claim_request_notifications() to service_role;
grant execute on function public.finish_request_notification(uuid,uuid,boolean,text,text) to service_role;

select cron.schedule('prestige-request-notification-retry', '* * * * *',
  'select prestige_private.dispatch_request_notifications()');
commit;
