"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultChores } from "@/lib/chores";

// Uppercase, no ambiguous chars (0/O, 1/I) — invite codes get typed by hand.
const generateInviteCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

const MAX_TENANTS = 20;

export type ActionState = { error?: string };

// Owner-only: configures a house (name + bathroom count) but does not
// join it as a tenant — an owner can manage several houses without ever
// appearing in any of their chore rotations.
export async function createHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const bathroomCount = Number(formData.get("bathroomCount"));

  if (!name) return { error: "Give the house a name." };
  if (!Number.isInteger(bathroomCount) || bathroomCount < 1 || bathroomCount > 10) {
    return { error: "Bathroom count must be a whole number between 1 and 10." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name, invite_code: generateInviteCode(), owner_id: user.id })
    .select("id")
    .single();

  if (householdError || !household) {
    return { error: "Couldn't create the house. Try again." };
  }

  const bathrooms = Array.from({ length: bathroomCount }, (_, i) => ({
    household_id: household.id,
    label: `Bathroom ${i + 1}`,
  }));
  const { error: bathroomError } = await supabase.from("bathrooms").insert(bathrooms);

  if (bathroomError) {
    return { error: "House created, but couldn't set up its bathrooms. Try again." };
  }

  redirect("/");
}

// Step 1 of joining: resolve the invite code to a household, then hand
// off to step 2 (bathroom picker) at /household/join/[householdId].
export async function findHouseholdByCode(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const code = (formData.get("inviteCode") as string)?.trim().toUpperCase();
  if (!code) return { error: "Enter an invite code." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household } = await supabase
    .from("households")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();

  if (!household) {
    return { error: "No house found with that code. Double-check it and try again." };
  }

  redirect(`/household/join/${household.id}`);
}

// Step 2: finalize joining with a chosen bathroom, then provision the
// household's standing chores if this is the first tenant to need them.
export async function joinHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const bathroomId = formData.get("bathroomId") as string;
  if (!householdId || !bathroomId) return { error: "Pick which bathroom you use." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bathroom } = await supabase
    .from("bathrooms")
    .select("id, label")
    .eq("id", bathroomId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (!bathroom) {
    return { error: "That bathroom doesn't belong to this house. Try again." };
  }

  const { data: memberCount } = await supabase.rpc("household_member_count", {
    target_household_id: householdId,
  });

  if ((memberCount ?? 0) >= MAX_TENANTS) {
    return { error: "This house already has its full number of tenants." };
  }

  const { error: joinError } = await supabase
    .from("profiles")
    .update({ household_id: householdId, bathroom_id: bathroomId })
    .eq("id", user.id);

  if (joinError) {
    return { error: "Couldn't join the house. Try again." };
  }

  await ensureDefaultChores(supabase, householdId, bathroom.id, bathroom.label);

  redirect("/");
}
