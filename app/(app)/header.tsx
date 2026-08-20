import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/avatar";

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

  return (
    <header className="flex items-center justify-end gap-2 px-6 py-4">
      {profile?.household_id && (
        <Link
          href={`/members/${user.id}`}
          aria-label="Your profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brass font-display text-xs font-semibold text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          {initials(profile.display_name)}
        </Link>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
