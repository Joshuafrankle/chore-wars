import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseholdMember } from "@/lib/auth";
import { computeFairnessScores } from "@/lib/fairness";
import { AVATAR_OPACITIES, initials } from "@/lib/avatar";

type MemberProfile = {
  id: string;
  display_name: string;
  bathroom: { label: string } | null;
};

type CompletionRow = {
  id: string;
  completed_at: string;
  effort_awarded: number;
  chores: { name: string } | null;
};

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, householdId } = await requireHouseholdMember();

  const [{ data: member }, { data: completions }, { data: allCompletions }, { data: members }] =
    await Promise.all([
      // Scoped to the caller's own household — a stranger's profile id
      // just returns nothing under RLS, not another household's data.
      supabase
        .from("profiles")
        .select("id, display_name, bathroom:bathrooms(label)")
        .eq("id", id)
        .eq("household_id", householdId)
        .maybeSingle<MemberProfile>(),
      supabase
        .from("chore_completions")
        .select("id, completed_at, effort_awarded, chores(name)")
        .eq("household_id", householdId)
        .eq("user_id", id)
        .order("completed_at", { ascending: false })
        .limit(20)
        .returns<CompletionRow[]>(),
      supabase
        .from("chore_completions")
        .select("user_id, effort_awarded")
        .eq("household_id", householdId),
      supabase.from("profiles").select("id").eq("household_id", householdId),
    ]);

  if (!member) notFound();

  const scores = computeFairnessScores(
    (allCompletions ?? []).map((completion) => ({
      userId: completion.user_id as string,
      effortAwarded: completion.effort_awarded as number,
    })),
    (members ?? []).map((m) => m.id as string),
  );
  const score = scores[member.id] ?? 0;
  const avatarIndex = (members ?? []).findIndex((m) => m.id === member.id);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
      <Link href="/" className="text-sm text-ink/60 hover:text-ink">
        ← Back
      </Link>

      <div className="flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brass font-display text-lg font-semibold text-doorframe"
          style={{ opacity: AVATAR_OPACITIES[Math.max(avatarIndex, 0) % AVATAR_OPACITIES.length] }}
          aria-hidden="true"
        >
          {initials(member.display_name)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {member.display_name}
          </h1>
          <p className="text-sm text-ink/60">{member.bathroom?.label ?? "No bathroom set"}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-doorframe p-5">
        <p className="text-sm text-ink/60">Fairness score</p>
        <p className="font-display text-3xl font-semibold text-brass">{score}</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Recent completions</h2>
        {!completions?.length ? (
          <p className="rounded-2xl bg-doorframe p-6 text-center text-ink/70">
            No chores completed yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {completions.map((completion) => (
              <li
                key={completion.id}
                className="flex items-center justify-between rounded-xl bg-doorframe p-3"
              >
                <span className="text-ink">{completion.chores?.name ?? "Chore"}</span>
                <span className="text-sm text-ink/60">
                  +{completion.effort_awarded} ·{" "}
                  {new Date(completion.completed_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
