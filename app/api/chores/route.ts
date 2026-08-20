import { NextResponse } from "next/server";
import { requireHouseholdMemberApi } from "@/lib/auth";
import { getChoresData } from "@/lib/chores-data";

// Always reflects the latest assignment/completion state — never cached,
// server or browser side (paired with `cache: "no-store"` on the client
// fetch, since a completed chore's reassignment needs to show up on the
// very next request, not a stale cached one).
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireHouseholdMemberApi();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const data = await getChoresData(auth.supabase, auth.householdId);
  return NextResponse.json(data);
}
