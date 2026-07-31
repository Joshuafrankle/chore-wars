"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Uppercase, no ambiguous chars (0/O, 1/I) — invite codes get typed by hand.
const generateInviteCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export type ActionState = { error?: string };

export async function createHousehold(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Give your household a name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name, invite_code: generateInviteCode(), created_by: user.id })
    .select("id")
    .single();

  if (householdError || !household) {
    return { error: "Couldn't create the household. Try again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Household created, but couldn't add you to it. Try again." };
  }

  redirect("/");
}

export async function joinHousehold(
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
    return { error: "No household found with that code. Double-check it and try again." };
  }

  const { data: memberCount } = await supabase.rpc("household_member_count", {
    target_household_id: household.id,
  });

  if ((memberCount ?? 0) >= 6) {
    return { error: "This household already has its full 6 members." };
  }

  const { error: joinError } = await supabase
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", user.id);

  if (joinError) {
    return { error: "Couldn't join the household. Try again." };
  }

  redirect("/");
}
