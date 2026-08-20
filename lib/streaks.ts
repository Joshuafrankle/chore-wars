// Pure, no DB/network calls — same pattern as lib/fairness.ts.

export type StreakCompletion = { completedAt: string; dueDate: string };

// Counts consecutive *on-time* completions working backward from the most
// recent, stopping at the first late one. Order of the input doesn't
// matter — it's sorted here.
export function computeStreak(completions: StreakCompletion[]): number {
  const sorted = [...completions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  let streak = 0;
  for (const completion of sorted) {
    const completedDate = new Date(completion.completedAt);
    completedDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(completion.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (completedDate > dueDate) break;
    streak += 1;
  }

  return streak;
}
