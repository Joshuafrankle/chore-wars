import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5",
  "aria-hidden": true,
};

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/tenants",
    label: "Tenants",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

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
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-ink/10 bg-doorframe">
      {TABS.map((tab, index) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-label={tab.label}
          className={`flex flex-1 items-center justify-center py-3 text-ink/70 transition-colors hover:bg-hallway hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset ${
            index > 0 ? "border-l border-ink/10" : ""
          }`}
        >
          {tab.icon}
        </Link>
      ))}
    </nav>
  );
}
