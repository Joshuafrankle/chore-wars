"use server";

import { redirect } from "next/navigation";
import { requireHouseholdMember } from "@/lib/auth";
import { createNextAssignment } from "@/lib/chores";

export type ActionState = { error?: string };

export async function createChore(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const effortWeight = Number(formData.get("effortWeight"));
  const frequencyDays = Number(formData.get("frequencyDays"));

  if (!name) return { error: "Give the chore a name." };
  if (!Number.isInteger(effortWeight) || effortWeight < 1 || effortWeight > 5) {
    return { error: "Effort must be a whole number between 1 and 5." };
  }
  if (!Number.isInteger(frequencyDays) || frequencyDays < 1) {
    return { error: "Frequency must be at least 1 day." };
  }

  const { supabase, householdId } = await requireHouseholdMember();

  const { data: chore, error: choreError } = await supabase
    .from("chores")
    .insert({
      household_id: householdId,
      name,
      effort_weight: effortWeight,
      frequency_days: frequencyDays,
    })
    .select("id")
    .single();

  if (choreError || !chore) {
    return { error: "Couldn't create the chore. Try again." };
  }

  const { error: assignError } = await createNextAssignment(
    supabase,
    householdId,
    chore.id,
    frequencyDays,
  );
  if (assignError) {
    return { error: "Chore created, but couldn't assign its first turn. Try again." };
  }

  redirect("/chores");
}
