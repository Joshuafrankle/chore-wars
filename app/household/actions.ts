"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultChores } from "@/lib/chores";

// Uppercase, no ambiguous chars (0/O, 1/I) — invite codes get typed by hand.
const generateInviteCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export type ActionState = { error?: string };

// Owner-only: configures a house (name, bathroom count, room count, and an
// optional WhatsApp group link) but does not join it as a tenant — an
// owner can manage several houses without ever appearing in any of their
// chore rotations.
export async function createHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const bathroomCount = Number(formData.get("bathroomCount"));
  const roomCount = Number(formData.get("roomCount"));
  const whatsappLink = (formData.get("whatsappLink") as string)?.trim() || null;

  if (!name) return { error: "Give the house a name." };
  if (!Number.isInteger(bathroomCount) || bathroomCount < 1 || bathroomCount > 10) {
    return { error: "Bathroom count must be a whole number between 1 and 10." };
  }
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 50) {
    return { error: "Room count must be a whole number between 1 and 50." };
  }
  if (whatsappLink && !/^https?:\/\//i.test(whatsappLink)) {
    return { error: "The WhatsApp link should start with http:// or https://." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      name,
      invite_code: generateInviteCode(),
      owner_id: user.id,
      room_count: roomCount,
      whatsapp_link: whatsappLink,
    })
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
// off to step 2 (the onboarding form) at /household/join/[householdId].
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

// Step 2 (onboarding): name, room, and bathroom, then provision the
// household's standing chores if this is the first tenant to need them.
export async function joinHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const displayName = (formData.get("displayName") as string)?.trim();
  const bathroomId = formData.get("bathroomId") as string;
  const roomNumber = Number(formData.get("roomNumber"));

  if (!householdId) return { error: "Something went wrong. Try again." };
  if (!displayName) return { error: "Enter your name." };
  if (!bathroomId) return { error: "Pick which bathroom you use." };
  if (!Number.isInteger(roomNumber) || roomNumber < 1) return { error: "Pick your room." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: household }, { data: bathroom }] = await Promise.all([
    supabase.from("households").select("room_count").eq("id", householdId).maybeSingle(),
    supabase
      .from("bathrooms")
      .select("id, label")
      .eq("id", bathroomId)
      .eq("household_id", householdId)
      .maybeSingle(),
  ]);

  if (!household) return { error: "That house couldn't be found. Try again." };
  if (!bathroom) return { error: "That bathroom doesn't belong to this house. Try again." };
  if (roomNumber > household.room_count) {
    return { error: `Room number must be between 1 and ${household.room_count}.` };
  }

  const { error: joinError } = await supabase
    .from("profiles")
    .update({
      household_id: householdId,
      bathroom_id: bathroomId,
      room_number: roomNumber,
      display_name: displayName,
    })
    .eq("id", user.id);

  if (joinError) {
    // Most likely cause: someone else claimed that room number in the gap
    // between loading the form and submitting it (the unique constraint on
    // (household_id, room_number) is the real guard, this just explains it).
    if (joinError.code === "23505") {
      return { error: "Someone just took that room — pick another." };
    }
    return { error: "Couldn't join the house. Try again." };
  }

  await ensureDefaultChores(supabase, householdId, bathroom.id, bathroom.label);

  redirect(`/household/welcome/${householdId}`);
}
