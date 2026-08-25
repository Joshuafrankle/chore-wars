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

// Same check, but for Route Handlers: redirect() would send a JSON-fetching
// client an HTML redirect response instead of an error it can handle, so
// this returns null and lets the caller decide the response.
export async function requireHouseholdMemberApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profile?.household_id) return null;

  return { supabase, user, householdId: profile.household_id as string };
}

// households has a permissive "readable by any signed-in user" RLS policy
// (needed so the join-by-code flow can look one up before joining), so
// unlike the tenant checks above, RLS alone won't stop a random user from
// opening another owner's house page — this explicitly checks ownership.
export async function requireHouseholdOwner(householdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: household } = await supabase
    .from("households")
    .select("id, name, invite_code, room_count, whatsapp_link, owner_id")
    .eq("id", householdId)
    .maybeSingle();

  if (!household || household.owner_id !== user.id) redirect("/");

  return { supabase, user, household };
}
