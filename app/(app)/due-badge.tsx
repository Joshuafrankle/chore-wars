import { getChoreStatus } from "@/lib/chore-status";

export function DueBadge({ dueDate }: { dueDate: string }) {
  const status = getChoreStatus(dueDate);
  const label =
    status === "overdue"
      ? "Overdue"
      : status === "due-today"
        ? "Due today"
        : `Due ${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  const className =
    status === "overdue"
      ? "font-medium text-overdue"
      : status === "due-today"
        ? "font-medium text-coral"
        : "text-ink/60";

  return <span className={className}>{label}</span>;
}
