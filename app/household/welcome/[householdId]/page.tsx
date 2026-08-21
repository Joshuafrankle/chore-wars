import Link from "next/link";
import { requireHouseholdMember } from "@/lib/auth";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId: paramHouseholdId } = await params;
  const { supabase, householdId } = await requireHouseholdMember();

  // Only meaningful right after joining this specific household — anyone
  // else just gets sent home rather than seeing someone else's welcome
  // screen.
  if (paramHouseholdId !== householdId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-hallway px-6 text-center">
        <Link
          href="/"
          className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Go home
        </Link>
      </main>
    );
  }

  const { data: household } = await supabase
    .from("households")
    .select("name, whatsapp_link")
    .eq("id", householdId)
    .single();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6 py-10 text-center">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          You&apos;re in! 🎉
        </h1>
        <p className="mt-2 text-ink/70">Welcome to {household?.name}.</p>
      </div>

      {household?.whatsapp_link && (
        <a
          href={household.whatsapp_link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm rounded-xl bg-spruce px-5 py-3 text-center font-medium text-doorframe transition-colors hover:bg-spruce/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spruce focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Join the house WhatsApp group
        </a>
      )}

      <Link
        href="/"
        className="w-full max-w-sm rounded-xl border border-ink/15 px-5 py-3 text-center font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        Continue to home
      </Link>
    </main>
  );
}
