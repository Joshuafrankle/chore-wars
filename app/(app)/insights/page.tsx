import { requireHouseholdMember } from "@/lib/auth";
import { getChoresData } from "@/lib/chores-data";
import { AnimatedNumber } from "../animated-number";
import { FairnessBars } from "./fairness-bars";

function startOfWeek() {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function InsightsPage() {
  const { supabase, user, householdId } = await requireHouseholdMember();
  const { members } = await getChoresData(supabase, householdId);

  const { data: weekCompletions } = await supabase
    .from("chore_completions")
    .select("effort_awarded")
    .eq("household_id", householdId)
    .gte("completed_at", startOfWeek().toISOString());

  const weekPoints = (weekCompletions ?? []).reduce(
    (sum, completion) => sum + (completion.effort_awarded as number),
    0,
  );
  const choresThisWeek = weekCompletions?.length ?? 0;
  const you = members.find((member) => member.id === user.id);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Household fairness
      </h1>

      <FairnessBars members={members} />

      <div className="rounded-3xl bg-doorframe p-6 card-elevated">
        <p className="text-sm text-ink/60">This week</p>
        <p className="font-display text-4xl font-semibold text-coral">
          <AnimatedNumber value={weekPoints} /> pts
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              <AnimatedNumber value={choresThisWeek} />
            </p>
            <p className="text-xs text-ink/60">Chores done</p>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              <AnimatedNumber value={you?.streak ?? 0} />
            </p>
            <p className="text-xs text-ink/60">Your streak</p>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              <AnimatedNumber value={you?.score ?? 0} />
            </p>
            <p className="text-xs text-ink/60">Your score</p>
          </div>
        </div>
      </div>
    </main>
  );
}
