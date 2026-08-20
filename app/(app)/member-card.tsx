import Link from "next/link";
import { AVATAR_OPACITIES, initials } from "@/lib/avatar";

export function MemberCard({
  id,
  displayName,
  bathroomLabel,
  score,
  index,
}: {
  id: string;
  displayName: string;
  bathroomLabel: string | null;
  score: number;
  index: number;
}) {
  return (
    <li>
      <Link
        href={`/members/${id}`}
        className="flex items-center gap-3 rounded-xl bg-hallway p-3 transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass font-display text-sm font-semibold text-doorframe"
          style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
          aria-hidden="true"
        >
          {initials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{displayName}</p>
          <p className="truncate text-sm text-ink/60">
            {bathroomLabel ?? "No bathroom set"} · {score} pt{score === 1 ? "" : "s"}
          </p>
        </div>
      </Link>
    </li>
  );
}
