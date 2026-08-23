import Link from "next/link";
import type { Member } from "@/lib/chores-data";
import { AVATAR_OPACITIES, initials } from "@/lib/avatar";

// Score/fairness intentionally left off these cards — the leaderboard is
// the one place that owns the score, so this stays streak-only rather than
// showing the same number twice in two different shapes on one screen.
export function MemberGrid({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {members.map((member, index) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="flex min-w-0 flex-col items-center gap-2 rounded-3xl bg-doorframe p-5 text-center shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-coral font-display text-lg font-semibold text-doorframe"
            style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
            aria-hidden="true"
          >
            {initials(member.displayName)}
          </span>
          <p className="w-full truncate text-sm font-medium text-ink">{member.displayName}</p>
          <p className="rounded-full bg-hallway px-2.5 py-1 text-xs font-medium text-ink/70">
            {member.streak > 0 ? (
              <>
                <span aria-hidden="true">🔥</span> {member.streak} day streak
              </>
            ) : (
              "No streak yet"
            )}
          </p>
        </Link>
      ))}
    </div>
  );
}
