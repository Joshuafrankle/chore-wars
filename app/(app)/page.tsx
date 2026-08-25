import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChoresData } from "@/lib/chores-data";
import { InviteDialog } from "./invite-dialog";
import { ChoresList } from "./chores-list";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
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

  // Tenant: chores are the home screen.
  if (profile?.household_id) {
    const [{ data: household }, data] = await Promise.all([
      supabase.from("households").select("invite_code").eq("id", profile.household_id).single(),
      getChoresData(supabase, profile.household_id),
    ]);

    const firstName = profile.display_name?.split(" ")[0] ?? "there";
    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return (
      <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-ink">
              {timeOfDayGreeting()}, {firstName}.
            </h1>
            <p className="mt-0.5 text-sm text-ink/60">{today}</p>
          </div>
          <div className="shrink-0">
            <InviteDialog inviteCode={household?.invite_code ?? ""} />
          </div>
        </div>

        <ChoresList initialData={data} currentUserId={user!.id} />
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
        <p className="mt-2 text-ink/70">
          You manage {ownedHouseholds.length} house{ownedHouseholds.length === 1 ? "" : "s"}.
        </p>
      </div>

      <ul className="flex w-full max-w-sm flex-col gap-3">
        {ownedHouseholds.map((household) => (
          <li key={household.id}>
            <Link
              href={`/houses/${household.id}`}
              className="card-elevated flex flex-col rounded-3xl bg-doorframe p-4 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              <p className="font-medium text-ink">{household.name}</p>
              <p className="mt-1 text-sm text-ink/60">
                {tenantCounts.get(household.id) ?? 0} tenant
                {(tenantCounts.get(household.id) ?? 0) === 1 ? "" : "s"} · invite code{" "}
                <span className="font-medium tracking-widest text-coral">
                  {household.invite_code}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/household/new"
        className="rounded-xl border border-ink/15 px-5 py-3 font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        Add another house
      </Link>
    </main>
  );
}
