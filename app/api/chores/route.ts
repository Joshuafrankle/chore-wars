import { NextResponse } from "next/server";
import { requireHouseholdMemberApi } from "@/lib/auth";
import { getChoresData } from "@/lib/chores-data";

export async function GET() {
  const auth = await requireHouseholdMemberApi();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const data = await getChoresData(auth.supabase, auth.householdId);
  return NextResponse.json(data);
}
