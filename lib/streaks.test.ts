import { describe, expect, it } from "vitest";
import { computeStreak } from "./streaks";

describe("computeStreak", () => {
  it("counts consecutive on-time completions", () => {
    const streak = computeStreak([
      { completedAt: "2026-08-01", dueDate: "2026-08-01" },
      { completedAt: "2026-07-25", dueDate: "2026-07-26" },
      { completedAt: "2026-07-18", dueDate: "2026-07-18" },
    ]);
    expect(streak).toBe(3);
  });

  it("stops at the first late completion, working backward from most recent", () => {
    const streak = computeStreak([
      { completedAt: "2026-08-01", dueDate: "2026-08-01" }, // on time
      { completedAt: "2026-07-27", dueDate: "2026-07-25" }, // late — breaks streak
      { completedAt: "2026-07-18", dueDate: "2026-07-18" }, // on time, but after the break
    ]);
    expect(streak).toBe(1);
  });

  it("is order-independent — sorts internally by completedAt", () => {
    const streak = computeStreak([
      { completedAt: "2026-07-18", dueDate: "2026-07-18" },
      { completedAt: "2026-08-01", dueDate: "2026-08-01" },
    ]);
    expect(streak).toBe(2);
  });

  it("returns 0 for no completions", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("returns 0 when the most recent completion was already late", () => {
    const streak = computeStreak([{ completedAt: "2026-08-02", dueDate: "2026-08-01" }]);
    expect(streak).toBe(0);
  });
});
