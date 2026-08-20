// Same opacity-stepped brass palette used by the fairness bar, so a
// member's avatar and their segment in the bar read as the same person.
const AVATAR_OPACITIES = [1, 0.75, 0.55, 0.4, 0.28];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function MemberCard({
  displayName,
  bathroomLabel,
  score,
  index,
}: {
  displayName: string;
  bathroomLabel: string | null;
  score: number;
  index: number;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-hallway p-3">
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
    </li>
  );
}
