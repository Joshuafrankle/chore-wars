import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BathroomPickerForm } from "./bathroom-picker-form";

export default async function ChooseBathroomPage({
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
    .select("household_id")
    .eq("id", user!.id)
    .single();
  if (profile?.household_id) redirect("/");

  const [{ data: household }, { data: bathrooms }] = await Promise.all([
    supabase.from("households").select("name").eq("id", householdId).maybeSingle(),
    supabase.from("bathrooms").select("id, label").eq("household_id", householdId).order("label"),
  ]);

  if (!household || !bathrooms?.length) redirect("/household/join?error=invalid");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Joining {household.name}
        </h1>
        <p className="mb-6 text-center text-ink/70">One more thing before you're in.</p>
        <BathroomPickerForm householdId={householdId} bathrooms={bathrooms} />
      </div>
    </main>
  );
}
