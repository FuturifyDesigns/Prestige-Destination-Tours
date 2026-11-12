begin;
create table public.travel_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('booking','enquiry')),
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null check (length(email) <= 254 and email ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z0-9-]+$'),
  phone text check (length(phone) <= 40),
  destination text check (length(destination) <= 80),
  experience text check (length(experience) <= 100),
  travel_date date,
  guests integer check (guests between 1 and 999),
  message text not null check (length(trim(message)) between 1 and 4000),
  status text not null default 'New' check (status in ('New','In progress','Closed')),
  check (kind <> 'booking' or (travel_date is not null and guests is not null))
);
create index travel_requests_created_idx on public.travel_requests (created_at desc, id desc);
create index travel_requests_kind_created_idx on public.travel_requests (kind, created_at desc, id desc);
alter table public.travel_requests enable row level security;
revoke all on public.travel_requests from anon, authenticated, public;
grant insert (kind,name,email,phone,destination,experience,travel_date,guests,message) on public.travel_requests to anon, authenticated;
grant select on public.travel_requests to authenticated;
grant update (status) on public.travel_requests to authenticated;
create policy "Submit new requests" on public.travel_requests
  for insert to anon, authenticated with check (
    status = 'New' and (travel_date is null or travel_date >= (now() at time zone 'Africa/Gaborone')::date)
  );
create policy "Staff read requests" on public.travel_requests
  for select to authenticated using ((select auth.jwt()) -> 'app_metadata' -> 'prestige_staff' = 'true'::jsonb);
create policy "Staff update request status" on public.travel_requests
  for update to authenticated using ((select auth.jwt()) -> 'app_metadata' -> 'prestige_staff' = 'true'::jsonb)
  with check ((select auth.jwt()) -> 'app_metadata' -> 'prestige_staff' = 'true'::jsonb);
commit;
