import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Every household-scoped page/action needs the same three things: a
// logged-in user, their profile, and their household. Centralized here
// since chores, bills, and the dashboard all repeat this exact check.
export async function requireHouseholdMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profile?.household_id) redirect("/household");

  return { supabase, user, householdId: profile.household_id as string };
}
