import Link from "next/link";
import type { Member } from "@/lib/chores-data";
import { AVATAR_OPACITIES, initials } from "@/lib/avatar";

export function MemberGrid({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {members.map((member, index) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-doorframe p-4 text-center transition-colors hover:bg-doorframe/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brass font-display text-sm font-semibold text-doorframe"
            style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
            aria-hidden="true"
          >
            {initials(member.displayName)}
          </span>
          <p className="truncate text-sm font-medium text-ink">{member.displayName}</p>
          <p className="text-xs text-ink/60">
            {member.streak > 0 ? (
              <>
                <span aria-hidden="true">🔥</span> {member.streak} streak
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
