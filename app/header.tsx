import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/avatar";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Owners aren't tenants and have no profile page yet — no icon for them.
  if (!profile) return null;

  return (
    <header className="flex items-center justify-end px-6 py-4">
      <Link
        href={`/members/${user.id}`}
        aria-label="Your profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brass font-display text-xs font-semibold text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        {initials(profile.display_name)}
      </Link>
    </header>
  );
}
