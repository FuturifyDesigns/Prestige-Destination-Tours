begin;
create table public.guest_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('review','feedback')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 10 and 1200),
  published boolean not null default false,
  check (kind = 'review' or not published)
);
create index guest_reviews_created on public.guest_reviews (created_at desc, id desc);
alter table public.guest_reviews enable row level security;
revoke all on public.guest_reviews from public, anon, authenticated;
grant select on public.guest_reviews to anon, authenticated;
grant insert (kind,name,rating,message) on public.guest_reviews to anon, authenticated;
grant update (published), delete on public.guest_reviews to authenticated;
create policy "Read published reviews" on public.guest_reviews for select to anon, authenticated using (published);
create policy "Staff read all reviews" on public.guest_reviews for select to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'prestige_staff' = 'true');
create policy "Submit for moderation" on public.guest_reviews for insert to anon, authenticated with check (not published);
create policy "Staff moderate reviews" on public.guest_reviews for update to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'prestige_staff' = 'true')
  with check ((select auth.jwt()) -> 'app_metadata' ->> 'prestige_staff' = 'true');
create policy "Staff delete reviews" on public.guest_reviews for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' ->> 'prestige_staff' = 'true');
commit;
