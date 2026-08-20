import { NextResponse } from "next/server";
import { requireHouseholdMemberApi } from "@/lib/auth";
import { createNextAssignment } from "@/lib/chores";

type AssignmentWithChore = {
  id: string;
  chore_id: string;
  chores: { effort_weight: number; frequency_days: number; bathroom_id: string | null };
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const auth = await requireHouseholdMemberApi();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { supabase, user, householdId } = auth;
  const { assignmentId } = await params;

  const { data: assignment } = await supabase
    .from("chore_assignments")
    .select("id, chore_id, chores(effort_weight, frequency_days, bathroom_id)")
    .eq("id", assignmentId)
    .eq("household_id", householdId)
    .maybeSingle<AssignmentWithChore>();

  if (!assignment) {
    return NextResponse.json({ error: "That chore couldn't be found." }, { status: 404 });
  }

  // The pending -> done transition *is* the concurrency guard: this UPDATE
  // only matches (and only one concurrent request can win the row) if the
  // assignment is still pending. A double-click, a retried request, or two
  // tabs racing each other all lose gracefully instead of double-logging a
  // completion and opening two next-turns for the same chore.
  const { data: updated } = await supabase
    .from("chore_assignments")
    .update({ status: "done" })
    .eq("id", assignment.id)
    .eq("status", "pending")
    .select("id");

  if (!updated?.length) {
    return NextResponse.json(
      { error: "That chore isn't waiting to be done anymore." },
      { status: 409 },
    );
  }

  const { error: completionError } = await supabase.from("chore_completions").insert({
    household_id: householdId,
    assignment_id: assignment.id,
    chore_id: assignment.chore_id,
    user_id: user.id,
    effort_awarded: assignment.chores.effort_weight,
  });
  if (completionError) {
    // The assignment is already marked done at this point with no completion
    // logged and no next turn opened, which is a real (if rare) inconsistent
    // state — acceptable ceiling for now since these two calls aren't in a
    // single transaction; the fix would be wrapping both in a Postgres RPC.
    return NextResponse.json({ error: "Couldn't log that. Try again." }, { status: 500 });
  }

  await createNextAssignment(
    supabase,
    householdId,
    assignment.chore_id,
    assignment.chores.frequency_days,
    assignment.chores.bathroom_id,
  );

  return NextResponse.json({ ok: true });
}
