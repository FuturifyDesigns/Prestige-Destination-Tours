begin;
create function public.set_guest_review_visibility()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.published := new.kind = 'review';
  return new;
end;
$$;
create trigger guest_review_visibility before insert on public.guest_reviews
  for each row execute function public.set_guest_review_visibility();
drop policy "Submit for moderation" on public.guest_reviews;
create policy "Submit guest feedback" on public.guest_reviews
  for insert to anon, authenticated with check (published = (kind = 'review'));
commit;
