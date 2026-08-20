import { requireHouseholdMember } from "@/lib/auth";
import { getChoresData } from "@/lib/chores-data";
import { Header } from "../header";
import { ChoresList } from "./chores-list";

export default async function ChoresPage() {
  const { supabase, user, householdId } = await requireHouseholdMember();
  const data = await getChoresData(supabase, householdId);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-6 bg-hallway px-6 py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Chores</h1>
        <ChoresList initialData={data} currentUserId={user.id} />
      </main>
    </>
  );
}
