import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Just one tab for now — chores live on the home screen itself. This grows
// again once there's a second real destination (e.g. bills).
const TABS = [{ href: "/", label: "Home" }];

export async function BottomNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();

  // Owners aren't tenants — nothing here applies to them yet.
  if (!profile?.household_id) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-ink/10 bg-doorframe px-4 py-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
