import { requireHouseholdMember } from "@/lib/auth";
import { getChoresData } from "@/lib/chores-data";
import { MemberGrid } from "../member-grid";

export default async function TenantsPage() {
  const { supabase, householdId } = await requireHouseholdMember();
  const { members } = await getChoresData(supabase, householdId);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">The Squad</h1>
      <MemberGrid members={members} />
    </main>
  );
}
