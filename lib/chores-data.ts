import type { SupabaseClient } from "@supabase/supabase-js";
import { computeFairnessScores } from "./fairness";
import { computeStreak } from "./streaks";

export type ChoreAssignment = {
  id: string;
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
};

export type ChoreListItem = {
  id: string;
  name: string;
  effortWeight: number;
  frequencyDays: number;
  assignment: ChoreAssignment | null;
};

export type Member = { id: string; displayName: string; score: number; streak: number };

export type ChoresData = { members: Member[]; chores: ChoreListItem[] };

type RawChore = {
  id: string;
  name: string;
  effort_weight: number;
  frequency_days: number;
  chore_assignments: {
    id: string;
    due_date: string;
    assignee: { id: string; display_name: string } | null;
  }[];
};

// Shared by the /chores page (initial server render) and /api/chores (the
// client's refetch-after-mutation source), so the query and the fairness
// score computation only exist in one place.
export async function getChoresData(
  supabase: SupabaseClient,
  householdId: string,
): Promise<ChoresData> {
  const [{ data: chores }, { data: completions }, { data: members }] = await Promise.all([
    supabase
      .from("chores")
      .select(
        `id, name, effort_weight, frequency_days,
         chore_assignments!inner(id, due_date, assignee:profiles(id, display_name))`,
      )
      .eq("household_id", householdId)
      .eq("is_active", true)
      .eq("chore_assignments.status", "pending")
      .order("name")
      .returns<RawChore[]>(),
    // due_date comes along for the ride so streaks can be computed from
    // the same query, without a second round trip per member.
    supabase
      .from("chore_completions")
      .select("user_id, effort_awarded, completed_at, chore_assignments(due_date)")
      .eq("household_id", householdId)
      .returns<
        {
          user_id: string;
          effort_awarded: number;
          completed_at: string;
          chore_assignments: { due_date: string } | null;
        }[]
      >(),
    supabase.from("profiles").select("id, display_name").eq("household_id", householdId).order("display_name"),
  ]);

  const scores = computeFairnessScores(
    (completions ?? []).map((completion) => ({
      userId: completion.user_id,
      effortAwarded: completion.effort_awarded,
    })),
    (members ?? []).map((member) => member.id as string),
  );

  return {
    members: (members ?? []).map((member) => ({
      id: member.id as string,
      displayName: member.display_name as string,
      score: scores[member.id as string] ?? 0,
      streak: computeStreak(
        (completions ?? [])
          .filter((completion) => completion.user_id === member.id && completion.chore_assignments)
          .map((completion) => ({
            completedAt: completion.completed_at,
            dueDate: completion.chore_assignments!.due_date,
          })),
      ),
    })),
    chores: (chores ?? []).map((chore) => {
      const assignment = chore.chore_assignments[0];
      return {
        id: chore.id,
        name: chore.name,
        effortWeight: chore.effort_weight,
        frequencyDays: chore.frequency_days,
        assignment:
          assignment && assignment.assignee
            ? {
                id: assignment.id,
                dueDate: assignment.due_date,
                assigneeId: assignment.assignee.id,
                assigneeName: assignment.assignee.display_name,
              }
            : null,
      };
    }),
  };
}
