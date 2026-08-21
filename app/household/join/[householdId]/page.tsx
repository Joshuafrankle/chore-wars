import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user!.id)
    .single();
  if (profile?.household_id) redirect("/");

  const [{ data: household }, { data: bathrooms }, { data: takenRooms }] = await Promise.all([
    supabase.from("households").select("name, room_count").eq("id", householdId).maybeSingle(),
    supabase.from("bathrooms").select("id, label").eq("household_id", householdId).order("label"),
    supabase
      .from("profiles")
      .select("room_number")
      .eq("household_id", householdId)
      .not("room_number", "is", null),
  ]);

  if (!household || !bathrooms?.length) redirect("/household/join?error=invalid");

  const taken = new Set((takenRooms ?? []).map((row) => row.room_number as number));
  const availableRooms = Array.from({ length: household.room_count }, (_, i) => i + 1).filter(
    (room) => !taken.has(room),
  );

  if (!availableRooms.length) redirect("/household/join?error=full");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Joining {household.name}
        </h1>
        <p className="mb-6 text-center text-ink/70">A few details before you're in.</p>
        <OnboardingForm
          householdId={householdId}
          defaultName={profile?.display_name ?? ""}
          bathrooms={bathrooms}
          availableRooms={availableRooms}
        />
      </div>
    </main>
  );
}
