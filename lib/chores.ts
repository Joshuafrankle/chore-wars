import type { SupabaseClient } from "@supabase/supabase-js";
import { assignNextTurn } from "./fairness";

// Opens the next turn for a chore, using the household's *overall* fairness
// scores (every completion across every chore) — not just this chore's own
// history — so someone who's carrying a different heavy chore doesn't also
// get picked here. `bathroomId` restricts who's eligible (a bathroom chore
// only draws from people who picked that bathroom); leave it null for
// whole-household chores like kitchen/common area.
export async function createNextAssignment(
  supabase: SupabaseClient,
  householdId: string,
  choreId: string,
  frequencyDays: number,
  bathroomId: string | null = null,
) {
  const membersQuery = supabase.from("profiles").select("id").eq("household_id", householdId);

  const [{ data: members }, { data: completions }] = await Promise.all([
    bathroomId ? membersQuery.eq("bathroom_id", bathroomId) : membersQuery,
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

const CHORE_FREQUENCY_DAYS = 7;

async function ensureChore(
  supabase: SupabaseClient,
  householdId: string,
  defaultKind: "kitchen" | "common_area" | "bathroom",
  name: string,
  effortWeight: number,
  bathroomId: string | null,
) {
  const existingQuery = supabase
    .from("chores")
    .select("id")
    .eq("household_id", householdId)
    .eq("default_kind", defaultKind);

  const { data: existing } = await (bathroomId
    ? existingQuery.eq("bathroom_id", bathroomId)
    : existingQuery.is("bathroom_id", null)
  ).maybeSingle();
  if (existing) return;

  const { data: chore, error } = await supabase
    .from("chores")
    .insert({
      household_id: householdId,
      name,
      effort_weight: effortWeight,
      frequency_days: CHORE_FREQUENCY_DAYS,
      default_kind: defaultKind,
      bathroom_id: bathroomId,
    })
    .select("id")
    .single();
  if (error || !chore) return;

  try {
    await createNextAssignment(supabase, householdId, chore.id, CHORE_FREQUENCY_DAYS, bathroomId);
  } catch {
    // No eligible member yet (shouldn't happen — this only runs right
    // after a tenant joins) — leave the chore assignment-less rather than
    // fail the join that triggered this.
  }
}

// The household's 3 standing duties: kitchen and common area are always
// whole-household; a bathroom chore is created per distinct bathroom, the
// first time someone picks it. Called whenever a tenant joins.
export async function ensureDefaultChores(
  supabase: SupabaseClient,
  householdId: string,
  bathroomId: string,
  bathroomLabel: string,
) {
  await Promise.all([
    ensureChore(supabase, householdId, "kitchen", "Kitchen cleaning", 4, null),
    ensureChore(supabase, householdId, "common_area", "Common area cleaning", 2, null),
    ensureChore(supabase, householdId, "bathroom", `${bathroomLabel} cleaning`, 3, bathroomId),
  ]);
}
