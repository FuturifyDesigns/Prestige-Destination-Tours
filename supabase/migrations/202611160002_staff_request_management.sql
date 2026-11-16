begin;
alter table public.travel_requests add column if not exists deleted_at timestamptz;
grant update (kind,name,email,phone,destination,experience,travel_date,guests,message,deleted_at) on public.travel_requests to authenticated;
commit;
