"use client";

import { motion } from "framer-motion";
import type { Member } from "@/lib/chores-data";
import { AVATAR_OPACITIES, initials } from "@/lib/avatar";
import { AnimatedNumber } from "./animated-number";

export function Leaderboard({ members }: { members: Member[] }) {
  const ranked = [...members].sort((a, b) => b.score - a.score);
  const topScore = Math.max(...ranked.map((m) => m.score), 1);

  return (
    <div className="rounded-3xl bg-doorframe p-5 card-elevated">
      <p className="mb-3 text-sm text-ink/60">Fairness leaderboard</p>
      <ul className="flex flex-col gap-2">
        {ranked.map((member, index) => (
          <li key={member.id} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-center text-sm font-medium text-ink/50">
              {index + 1}
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral font-display text-xs font-semibold text-doorframe"
              style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
              aria-hidden="true"
            >
              {initials(member.displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">{member.displayName}</span>
                <span className="shrink-0 text-sm font-medium text-ink">
                  <AnimatedNumber value={member.score} />
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hallway">
                <motion.div
                  className="h-full rounded-full bg-coral"
                  style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
                  animate={{ width: `${(member.score / topScore) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
