import type { ChoreKind } from "@/lib/chores-data";

const CATEGORY: Record<ChoreKind, { emoji: string; bg: string; ink: string }> = {
  kitchen: { emoji: "🍳", bg: "bg-kitchen", ink: "text-kitchen-ink" },
  bathroom: { emoji: "🚿", bg: "bg-bathroom", ink: "text-bathroom-ink" },
  common_area: { emoji: "🛋️", bg: "bg-common", ink: "text-common-ink" },
};

export function ChoreIcon({ kind }: { kind: ChoreKind | null }) {
  const category = kind ? CATEGORY[kind] : { emoji: "🧹", bg: "bg-hallway", ink: "text-ink/60" };

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${category.bg} ${category.ink}`}
      aria-hidden="true"
    >
      {category.emoji}
    </span>
  );
}
