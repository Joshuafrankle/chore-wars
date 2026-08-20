export type ChoreStatus = "overdue" | "due-today" | "upcoming";

// Shared by the chore card and the dashboard's "due soon" preview so the
// date math (and what counts as "today") only lives in one place.
export function getChoreStatus(dueDateIso: string): ChoreStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);

  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "due-today";
  return "upcoming";
}
