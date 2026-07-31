-- Chore Wars schema: households, chores + fairness history, bills + splits.
-- Run this in the Supabase SQL editor (or `supabase db push` if you use the CLI).

-- ── households & profiles ──────────────────────────────────────────────
-- Created in two passes because profiles.household_id and
-- households.created_by reference each other.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid, -- fkey added below, once profiles exists
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  household_id uuid references public.households (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.households
  add constraint households_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- Every auth.users signup gets a profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Looks up the caller's own household without RLS recursion (security
-- definer bypasses RLS on the profiles select inside this function only).
create function public.current_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

-- ── chores & fairness history ──────────────────────────────────────────
-- household_id is denormalized onto every table below (not just reachable
-- via a join) so every RLS policy is a flat, fast household_id equality
-- check instead of a chain of subqueries.

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  effort_weight int not null check (effort_weight between 1 and 5),
  frequency_days int not null check (frequency_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.chore_assignments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  assigned_to uuid not null references public.profiles (id),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now()
);

create table public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  assignment_id uuid not null references public.chore_assignments (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  effort_awarded int not null, -- snapshot of the chore's weight, so later edits don't rewrite history
  completed_at timestamptz not null default now()
);

create table public.chore_swaps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  assignment_id uuid not null references public.chore_assignments (id) on delete cascade,
  from_user uuid not null references public.profiles (id),
  to_user uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ── bills & splits ──────────────────────────────────────────────────────

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  description text not null,
  category text not null,
  amount_cents int not null check (amount_cents > 0),
  paid_by uuid not null references public.profiles (id),
  split_method text not null check (split_method in ('equal', 'weighted')),
  created_at timestamptz not null default now()
);

create table public.bill_splits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  amount_owed_cents int not null check (amount_owed_cents >= 0),
  settled boolean not null default false,
  settled_at timestamptz
);

create index chores_household_id_idx on public.chores (household_id);
create index chore_assignments_household_id_idx on public.chore_assignments (household_id);
create index chore_completions_household_id_idx on public.chore_completions (household_id);
create index bills_household_id_idx on public.bills (household_id);
create index bill_splits_household_id_idx on public.bill_splits (household_id);
create index bill_splits_bill_id_idx on public.bill_splits (bill_id);

-- ── row-level security ───────────────────────────────────────────────────

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.chores enable row level security;
alter table public.chore_assignments enable row level security;
alter table public.chore_completions enable row level security;
alter table public.chore_swaps enable row level security;
alter table public.bills enable row level security;
alter table public.bill_splits enable row level security;

-- households: readable by any signed-in user so the join-by-invite-code
-- flow can look one up before the user belongs to it. Invite codes (not
-- RLS) are the real access control here — acceptable for MVP stakes.
create policy "households are readable by any signed-in user"
  on public.households for select
  to authenticated
  using (true);

create policy "signed-in users can create a household"
  on public.households for insert
  to authenticated
  with check (created_by = auth.uid());

-- profiles: see your own row, or your household members' rows (needed for
-- the fairness bar / avatars). Only ever update your own row.
create policy "profiles are readable within your household"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or household_id = public.current_household_id());

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Every other table: standard "must belong to my household" policy,
-- repeated per table since Postgres RLS policies aren't inherited.
create policy "chores scoped to household" on public.chores for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "chore_assignments scoped to household" on public.chore_assignments for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "chore_completions scoped to household" on public.chore_completions for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "chore_swaps scoped to household" on public.chore_swaps for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "bills scoped to household" on public.bills for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "bill_splits scoped to household" on public.bill_splits for all
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());
