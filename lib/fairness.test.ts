import { describe, expect, it } from "vitest";
import { assignNextTurn, computeFairnessScores, pickNextAssignee } from "./fairness";

describe("computeFairnessScores", () => {
  it("sums effort points per member", () => {
    const scores = computeFairnessScores(
      [
        { userId: "alice", effortAwarded: 3 },
        { userId: "bob", effortAwarded: 1 },
        { userId: "alice", effortAwarded: 2 },
      ],
      ["alice", "bob"],
    );
    expect(scores).toEqual({ alice: 5, bob: 1 });
  });

  it("defaults members with no completions to 0", () => {
    const scores = computeFairnessScores([], ["alice", "bob"]);
    expect(scores).toEqual({ alice: 0, bob: 0 });
  });
});

describe("pickNextAssignee", () => {
  it("picks the member with the lowest score", () => {
    const winner = pickNextAssignee({ alice: 5, bob: 1, carol: 3 }, ["alice", "bob", "carol"]);
    expect(winner).toBe("bob");
  });

  it("breaks ties deterministically by userId", () => {
    const winner = pickNextAssignee({ bob: 2, alice: 2 }, ["bob", "alice"]);
    expect(winner).toBe("alice");
  });

  it("respects the eligible-members list, not just the lowest overall score", () => {
    const winner = pickNextAssignee({ alice: 0, bob: 5 }, ["bob"]);
    expect(winner).toBe("bob");
  });

  it("throws if no one is eligible", () => {
    expect(() => pickNextAssignee({ alice: 0 }, [])).toThrow();
  });
});

describe("assignNextTurn", () => {
  it("gives a brand-new member (no completions) the first turn", () => {
    const winner = assignNextTurn(
      [{ userId: "alice", effortAwarded: 10 }],
      ["alice", "bob"],
    );
    expect(winner).toBe("bob");
  });

  it("skips excluded members even if they have the lowest score", () => {
    const winner = assignNextTurn(
      [{ userId: "bob", effortAwarded: 10 }],
      ["alice", "bob", "carol"],
      ["alice"], // alice is away
    );
    expect(winner).toBe("carol");
  });
});
