"use server";

import { redirect } from "next/navigation";
import { requireHouseholdOwner } from "@/lib/auth";

export type ActionState = { error?: string };

// Bathroom count isn't editable here — bathrooms are individual labeled
// rows tenants are already assigned to, so shrinking/renaming them safely
// needs its own reassignment flow. Name, room count, and the WhatsApp link
// are plain fields with no such dependency.
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
