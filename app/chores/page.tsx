import { requireHouseholdMember } from "@/lib/auth";

type ChoreListItem = {
  id: string;
  name: string;
  effort_weight: number;
  frequency_days: number;
  // A chore always has exactly one open (pending) assignment, and an
  // assignment always has exactly one assignee — PostgREST returns single
  // objects for both, but without generated types the client can't infer
  // that, so we assert the real shape with .returns() below.
  chore_assignments: {
    id: string;
    due_date: string;
    assignee: { id: string; display_name: string } | null;
  }[];
};

export default async function ChoresPage() {
  const { supabase, householdId } = await requireHouseholdMember();

  const { data: chores } = await supabase
    .from("chores")
    .select(
      `id, name, effort_weight, frequency_days,
       chore_assignments!inner(id, due_date, assignee:profiles(id, display_name))`,
    )
    .eq("household_id", householdId)
    .eq("is_active", true)
    .eq("chore_assignments.status", "pending")
    .order("name")
    .returns<ChoreListItem[]>();

  return (
    <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Chores</h1>

      {!chores?.length ? (
        <p className="rounded-2xl bg-doorframe p-6 text-center text-ink/70">
          Nothing set up yet — kitchen, bathroom, and common area duty appear here as soon as
          your household has members.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {chores.map((chore) => {
            const assignment = chore.chore_assignments[0];
            const dueDate = assignment
              ? new Date(assignment.due_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : null;

            return (
              <li key={chore.id} className="rounded-2xl bg-doorframe p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{chore.name}</span>
                  <span className="flex gap-1" aria-label={`Effort ${chore.effort_weight} of 5`}>
                    {Array.from({ length: chore.effort_weight }).map((_, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-brass" />
                    ))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  {assignment?.assignee?.display_name}&apos;s turn
                  {dueDate ? ` · due ${dueDate}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
