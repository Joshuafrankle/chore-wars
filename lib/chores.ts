import type { SupabaseClient } from "@supabase/supabase-js";
import { assignNextTurn } from "./fairness";

// Opens the next turn for a chore, using the household's *overall* fairness
// scores (every completion across every chore) — not just this chore's own
// history — so someone who's carrying a different heavy chore doesn't also
// get picked here. Used both right after a chore is created and right
// after a completion closes out the previous turn.
export async function createNextAssignment(
  supabase: SupabaseClient,
  householdId: string,
  choreId: string,
  frequencyDays: number,
) {
  const [{ data: members }, { data: completions }] = await Promise.all([
    supabase.from("profiles").select("id").eq("household_id", householdId),
    supabase
      .from("chore_completions")
      .select("user_id, effort_awarded")
      .eq("household_id", householdId),
  ]);

  const memberIds = (members ?? []).map((member) => member.id as string);
  const assignee = assignNextTurn(
    (completions ?? []).map((completion) => ({
      userId: completion.user_id as string,
      effortAwarded: completion.effort_awarded as number,
    })),
    memberIds,
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + frequencyDays);

  return supabase.from("chore_assignments").insert({
    household_id: householdId,
    chore_id: choreId,
    assigned_to: assignee,
    due_date: dueDate.toISOString().slice(0, 10),
  });
}
