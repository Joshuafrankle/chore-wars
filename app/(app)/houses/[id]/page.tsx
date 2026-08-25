import Link from "next/link";
import { requireHouseholdOwner } from "@/lib/auth";
import { computeFairnessScores } from "@/lib/fairness";
import { computeStreak } from "@/lib/streaks";
import { initials } from "@/lib/avatar";
import { EditHouseForm } from "./edit-house-form";
import { DeleteHouseButton } from "./delete-house-button";

type TenantRow = {
  id: string;
  display_name: string;
  room_number: number | null;
  bathroom: { label: string } | null;
};

export default async function HouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, household } = await requireHouseholdOwner(id);

  const [{ data: tenants }, { data: completions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, room_number, bathroom:bathrooms(label)")
      .eq("household_id", household.id)
      .order("room_number")
      .returns<TenantRow[]>(),
    supabase
      .from("chore_completions")
      .select("user_id, effort_awarded, completed_at, chore_assignments(due_date)")
      .eq("household_id", household.id)
      .returns<
        { user_id: string; effort_awarded: number; completed_at: string; chore_assignments: { due_date: string } | null }[]
      >(),
  ]);

  const scores = computeFairnessScores(
    (completions ?? []).map((c) => ({ userId: c.user_id, effortAwarded: c.effort_awarded })),
    (tenants ?? []).map((t) => t.id),
  );
  const totalPoints = (completions ?? []).reduce((sum, c) => sum + c.effort_awarded, 0);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
      <Link href="/" className="text-sm text-ink/60 hover:text-ink">
        ← Back
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {household.name}
        </h1>
        <p className="mt-0.5 text-sm text-ink/60">
          Invite code <span className="font-medium tracking-widest text-coral">{household.invite_code}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <div className="card-elevated flex-1 rounded-3xl bg-doorframe p-5">
          <p className="text-sm text-ink/60">Tenants</p>
          <p className="font-display text-3xl font-semibold text-ink">
            {tenants?.length ?? 0}/{household.room_count}
          </p>
        </div>
        <div className="card-elevated flex-1 rounded-3xl bg-doorframe p-5">
          <p className="text-sm text-ink/60">Chores done</p>
          <p className="font-display text-3xl font-semibold text-coral">{completions?.length ?? 0}</p>
        </div>
        <div className="card-elevated flex-1 rounded-3xl bg-doorframe p-5">
          <p className="text-sm text-ink/60">Points earned</p>
          <p className="font-display text-3xl font-semibold text-spruce">{totalPoints}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Tenants</h2>
        {!tenants?.length ? (
          <p className="card-elevated rounded-2xl bg-doorframe p-6 text-center text-ink/70">
            No tenants yet — share the invite code above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tenants.map((tenant) => {
              const streak = computeStreak(
                (completions ?? [])
                  .filter((c) => c.user_id === tenant.id && c.chore_assignments)
                  .map((c) => ({ completedAt: c.completed_at, dueDate: c.chore_assignments!.due_date })),
              );
              return (
                <li
                  key={tenant.id}
                  className="card-elevated flex items-center gap-3 rounded-xl bg-doorframe p-3"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral font-display text-xs font-semibold text-doorframe"
                    aria-hidden="true"
                  >
                    {initials(tenant.display_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{tenant.display_name}</p>
                    <p className="truncate text-sm text-ink/60">
                      {tenant.room_number ? `Room ${tenant.room_number}` : "No room"} ·{" "}
                      {tenant.bathroom?.label ?? "No bathroom"} · {streak} day streak
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">
                    {scores[tenant.id] ?? 0} pts
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">House settings</h2>
        <div className="card-elevated rounded-3xl bg-doorframe p-5">
          <EditHouseForm household={household} />
        </div>
      </div>

      <DeleteHouseButton householdId={household.id} tenantCount={tenants?.length ?? 0} />
    </main>
  );
}
