// The fairness engine: no DB or network calls, pure functions over plain
// data, so it can be understood and tested on its own.

export type Completion = { userId: string; effortAwarded: number };

// Sums effort points per household member. Members with no completions
// yet default to 0 — this is what makes a newly-joined roommate the first
// pick for the next chore.
export function computeFairnessScores(
  completions: Completion[],
  memberIds: string[],
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const id of memberIds) scores[id] = 0;
  for (const completion of completions) {
    if (completion.userId in scores) {
      scores[completion.userId] += completion.effortAwarded;
    }
  }
  return scores;
}

// Whoever has the lowest accumulated score goes next. Ties are broken by
// userId ordering — arbitrary but deterministic, so the same inputs always
// produce the same pick (and tests stay stable).
export function pickNextAssignee(
  scores: Record<string, number>,
  eligibleMemberIds: string[],
): string {
  if (eligibleMemberIds.length === 0) {
    throw new Error("pickNextAssignee: no eligible members to assign to");
  }

  return [...eligibleMemberIds].sort((a, b) => {
    const scoreDiff = (scores[a] ?? 0) - (scores[b] ?? 0);
    return scoreDiff !== 0 ? scoreDiff : a.localeCompare(b);
  })[0];
}

// Composes the two: given the full completion history and the household's
// members, who should be assigned next? `excludeMemberIds` lets a chore's
// turn skip anyone away/ineligible without touching their score.
export function assignNextTurn(
  completions: Completion[],
  memberIds: string[],
  excludeMemberIds: string[] = [],
): string {
  const scores = computeFairnessScores(completions, memberIds);
  const eligibleMemberIds = memberIds.filter((id) => !excludeMemberIds.includes(id));
  return pickNextAssignee(scores, eligibleMemberIds);
}
