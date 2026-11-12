begin;

create schema if not exists prestige_private;
revoke all on schema prestige_private from public, anon, authenticated;

create index travel_requests_email_created_idx on public.travel_requests (lower(email), created_at desc);

alter table public.travel_requests
  add constraint travel_requests_phone_format check (
    phone is null or phone = '' or
    (phone ~ '^\+?[0-9().[:space:]-]+$' and length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15)
  ) not valid;

create function prestige_private.limit_request_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_requests integer;
  normalized_email text := lower(btrim(new.email));
begin
  new.email := normalized_email;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_email, 4267));
  select count(*) into recent_requests
    from public.travel_requests
    where lower(email) = normalized_email and created_at >= now() - interval '10 minutes';

  if recent_requests >= 8 then
    raise sqlstate 'PT429' using message = 'Too many requests for this email address.';
  end if;
  return new;
end;
$$;

revoke all on function prestige_private.limit_request_submissions() from public, anon, authenticated;
create trigger travel_requests_limit_submissions
  before insert on public.travel_requests
  for each row execute function prestige_private.limit_request_submissions();

commit;
