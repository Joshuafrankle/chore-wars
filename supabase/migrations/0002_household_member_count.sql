-- The join-by-code flow needs to check a household isn't already at 6
-- members before letting someone in. profiles RLS intentionally only lets
-- you see rows in *your own* household (so strangers can't harvest
-- emails), so a plain "select count(*) from profiles" from a not-yet-member
-- would just come back empty. This function returns only the count,
-- security definer so it can see across households without exposing rows.
create function public.household_member_count(target_household_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.profiles where household_id = target_household_id;
$$;
