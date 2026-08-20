import type { SupabaseClient } from "@supabase/supabase-js";
import { computeFairnessScores } from "./fairness";

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

export type Member = { id: string; displayName: string; score: number };

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
    supabase.from("chore_completions").select("user_id, effort_awarded").eq("household_id", householdId),
    supabase.from("profiles").select("id, display_name").eq("household_id", householdId).order("display_name"),
  ]);

  const scores = computeFairnessScores(
    (completions ?? []).map((completion) => ({
      userId: completion.user_id as string,
      effortAwarded: completion.effort_awarded as number,
    })),
    (members ?? []).map((member) => member.id as string),
  );

  return {
    members: (members ?? []).map((member) => ({
      id: member.id as string,
      displayName: member.display_name as string,
      score: scores[member.id as string] ?? 0,
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
