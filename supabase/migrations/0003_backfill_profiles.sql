-- One-time backfill: users who signed up before the handle_new_user()
-- trigger existed (migration 0001) never got a profiles row.
insert into public.profiles (id, email, display_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles);
