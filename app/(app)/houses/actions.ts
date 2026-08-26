"use server";

import { redirect } from "next/navigation";
import { requireHouseholdOwner } from "@/lib/auth";

export type ActionState = { error?: string };

// Bathrooms aren't a plain count here — they're individual labeled rows
// tenants get assigned to, each with its own chore history — so they get
// their own add/remove actions below instead of a number field on this
// form. Name, room count, and the WhatsApp link have no such dependency.
export async function updateHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const name = (formData.get("name") as string)?.trim();
  const roomCount = Number(formData.get("roomCount"));
  const whatsappLink = (formData.get("whatsappLink") as string)?.trim() || null;

  if (!name) return { error: "Give the house a name." };
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 50) {
    return { error: "Room count must be a whole number between 1 and 50." };
  }
  if (whatsappLink && !/^https?:\/\//i.test(whatsappLink)) {
    return { error: "The WhatsApp link should start with http:// or https://." };
  }

  const { supabase, household } = await requireHouseholdOwner(householdId);

  const { data: highestRoom } = await supabase
    .from("profiles")
    .select("room_number")
    .eq("household_id", householdId)
    .order("room_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (highestRoom?.room_number && roomCount < highestRoom.room_number) {
    return {
      error: `Can't be lower than ${highestRoom.room_number} — a tenant already occupies that room.`,
    };
  }

  const { error } = await supabase
    .from("households")
    .update({ name, room_count: roomCount, whatsapp_link: whatsappLink })
    .eq("id", household.id);

  if (error) return { error: "Couldn't save changes. Try again." };

  redirect(`/houses/${household.id}`);
}

export async function deleteHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const { supabase, household } = await requireHouseholdOwner(householdId);

  const { data: memberCount } = await supabase.rpc("household_member_count", {
    target_household_id: household.id,
  });

  if ((memberCount ?? 0) > 0) {
    return { error: "Remove all tenants before deleting this house." };
  }

  const { error } = await supabase.from("households").delete().eq("id", household.id);
  if (error) return { error: "Couldn't delete the house. Try again." };

  redirect("/");
}

export async function addBathroom(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const { supabase, household } = await requireHouseholdOwner(householdId);

  const { count } = await supabase
    .from("bathrooms")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id);

  const { error } = await supabase
    .from("bathrooms")
    .insert({ household_id: household.id, label: `Bathroom ${(count ?? 0) + 1}` });

  if (error) return { error: "Couldn't add a bathroom. Try again." };

  redirect(`/houses/${household.id}`);
}

// Deleting an empty bathroom also removes its auto-provisioned chore and
// that chore's completion history (chores.bathroom_id and
// chore_completions.chore_id both cascade) — acceptable since nobody was
// ever assigned to it; the tenant-occupied check below is what actually
// matters for safety.
export async function removeBathroom(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const householdId = formData.get("householdId") as string;
  const bathroomId = formData.get("bathroomId") as string;
  const { supabase, household } = await requireHouseholdOwner(householdId);

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("bathroom_id", bathroomId);

  if ((count ?? 0) > 0) {
    return { error: "Someone's still assigned to that bathroom — move them first." };
  }

  const { error } = await supabase
    .from("bathrooms")
    .delete()
    .eq("id", bathroomId)
    .eq("household_id", household.id);

  if (error) return { error: "Couldn't remove that bathroom. Try again." };

  redirect(`/houses/${household.id}`);
}
