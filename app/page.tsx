import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        Sign out
      </button>
    </form>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user!.id)
    .single();

  // Tenant: show their house.
  if (profile?.household_id) {
    const [{ data: household }, { data: members }] = await Promise.all([
      supabase
        .from("households")
        .select("name, invite_code")
        .eq("id", profile.household_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("household_id", profile.household_id)
        .order("display_name"),
    ]);

    return (
      <main className="flex flex-1 flex-col items-center gap-8 bg-hallway px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {household?.name}
          </h1>
          <p className="mt-2 text-ink/70">
            Signed in as <span className="font-medium">{profile.display_name}</span>
          </p>
        </div>

        <div className="w-full max-w-sm rounded-2xl bg-doorframe p-5">
          <p className="text-sm text-ink/60">Invite code</p>
          <p className="font-display text-2xl font-semibold tracking-[0.2em] text-brass">
            {household?.invite_code}
          </p>
          <p className="mt-1 text-sm text-ink/60">Share this with roommates so they can join.</p>
        </div>

        <div className="w-full max-w-sm rounded-2xl bg-doorframe p-5">
          <p className="mb-3 text-sm text-ink/60">
            {members?.length} member{members?.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-2">
            {members?.map((member) => (
              <li key={member.id} className="text-ink">
                {member.display_name}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/chores"
          className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          View chores
        </Link>

        <SignOutButton />
      </main>
    );
  }

  // Not a tenant anywhere — check if they own any houses.
  const { data: ownedHouseholds } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .eq("owner_id", user!.id)
    .order("name");

  if (!ownedHouseholds?.length) {
    redirect("/household");
  }

  const householdIds = ownedHouseholds.map((h) => h.id);
  const { data: allTenants } = await supabase
    .from("profiles")
    .select("household_id")
    .in("household_id", householdIds);

  const tenantCounts = new Map<string, number>();
  for (const tenant of allTenants ?? []) {
    tenantCounts.set(tenant.household_id, (tenantCounts.get(tenant.household_id) ?? 0) + 1);
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-hallway px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Your houses
        </h1>
        <p className="mt-2 text-ink/70">You manage {ownedHouseholds.length} house{ownedHouseholds.length === 1 ? "" : "s"}.</p>
      </div>

      <ul className="flex w-full max-w-sm flex-col gap-3">
        {ownedHouseholds.map((household) => (
          <li key={household.id} className="rounded-2xl bg-doorframe p-4">
            <p className="font-medium text-ink">{household.name}</p>
            <p className="mt-1 text-sm text-ink/60">
              {tenantCounts.get(household.id) ?? 0} tenant
              {(tenantCounts.get(household.id) ?? 0) === 1 ? "" : "s"} · invite code{" "}
              <span className="font-medium tracking-widest text-brass">
                {household.invite_code}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <Link
        href="/household/new"
        className="rounded-xl border border-ink/15 px-5 py-3 font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        Add another house
      </Link>

      <SignOutButton />
    </main>
  );
}
