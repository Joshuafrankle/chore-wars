import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/avatar";
import { SignOutDialog } from "./sign-out-dialog";
import { ThemeToggle } from "./theme-toggle";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, household_id")
    .eq("id", user.id)
    .maybeSingle();

  let householdName = "Chore Wars";
  if (profile?.household_id) {
    const { data: household } = await supabase
      .from("households")
      .select("name")
      .eq("id", profile.household_id)
      .maybeSingle();
    if (household?.name) householdName = household.name;
  }

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-coral font-display text-xs font-bold text-doorframe"
          aria-hidden="true"
        >
          CW
        </span>
        <span className="truncate font-display text-sm font-semibold text-ink">{householdName}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        {profile?.household_id && (
          <Link
            href={`/members/${user.id}`}
            aria-label="Your profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-coral font-display text-xs font-semibold text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
          >
            {initials(profile.display_name)}
          </Link>
        )}
        <SignOutDialog signOutAction={signOut} />
      </div>
    </header>
  );
}
