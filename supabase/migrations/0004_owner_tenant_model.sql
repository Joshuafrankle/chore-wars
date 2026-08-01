-- Owner/tenant model: a household now has an owner who configures it
-- (name, bathroom list) but is never a tenant or chore-rotation
-- participant themselves. Tenants join via invite code and pick one of
-- the owner's pre-defined bathrooms, instead of inventing a free-text
-- label that could fragment into duplicate groups.

alter table public.households rename column created_by to owner_id;

create table public.bathrooms (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column bathroom_id uuid references public.bathrooms (id) on delete set null;

alter table public.chores
  add column bathroom_id uuid references public.bathrooms (id) on delete cascade,
  add column default_kind text check (default_kind in ('kitchen', 'common_area', 'bathroom')),
  add constraint chores_bathroom_kind_consistent
    check ((default_kind = 'bathroom') = (bathroom_id is not null));

-- Owners need to see (read-only, for now) data belonging to houses they
-- manage but don't live in. Security definer so this doesn't recurse
-- through the RLS of the tables that call it.
create function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.households
    where id = target_household_id and owner_id = auth.uid()
  );
$$;

alter table public.bathrooms enable row level security;

-- Readable by anyone signed in, same reasoning as households: a tenant
-- needs to see a house's bathroom list before they've joined it, and
-- bathroom labels aren't sensitive.
create policy "bathrooms are readable by any signed-in user"
  on public.bathrooms for select
  to authenticated
  using (true);

create policy "owners manage their households' bathrooms"
  on public.bathrooms for insert
  to authenticated
  with check (public.is_household_owner(household_id));

-- households: insert check referenced the old column name.
drop policy "signed-in users can create a household" on public.households;
create policy "signed-in users can create a household"
  on public.households for insert
  to authenticated
  with check (owner_id = auth.uid());

-- profiles: owners can now also see tenants of houses they own.
alter policy "profiles are readable within your household" on public.profiles
  using (
    id = auth.uid()
    or household_id = public.current_household_id()
    or public.is_household_owner(household_id)
  );

-- chores/assignments/completions/swaps/bills/splits: split each old
-- "for all" policy into explicit per-command policies, so owners can be
-- granted read-only oversight without also picking up tenant write
-- access (a single broadened USING clause on a "for all" policy would
-- have quietly allowed owners to delete rows too).
drop policy "chores scoped to household" on public.chores;
create policy "chores readable by household or owner" on public.chores for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "chores writable by household" on public.chores for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "chores updatable by household" on public.chores for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy "chore_assignments scoped to household" on public.chore_assignments;
create policy "chore_assignments readable by household or owner" on public.chore_assignments for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "chore_assignments writable by household" on public.chore_assignments for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "chore_assignments updatable by household" on public.chore_assignments for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy "chore_completions scoped to household" on public.chore_completions;
create policy "chore_completions readable by household or owner" on public.chore_completions for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "chore_completions writable by household" on public.chore_completions for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "chore_completions updatable by household" on public.chore_completions for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy "chore_swaps scoped to household" on public.chore_swaps;
create policy "chore_swaps readable by household or owner" on public.chore_swaps for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "chore_swaps writable by household" on public.chore_swaps for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "chore_swaps updatable by household" on public.chore_swaps for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy "bills scoped to household" on public.bills;
create policy "bills readable by household or owner" on public.bills for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "bills writable by household" on public.bills for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "bills updatable by household" on public.bills for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy "bill_splits scoped to household" on public.bill_splits;
create policy "bill_splits readable by household or owner" on public.bill_splits for select
  to authenticated
  using (household_id = public.current_household_id() or public.is_household_owner(household_id));
create policy "bill_splits writable by household" on public.bill_splits for insert
  to authenticated
  with check (household_id = public.current_household_id());
create policy "bill_splits updatable by household" on public.bill_splits for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());
