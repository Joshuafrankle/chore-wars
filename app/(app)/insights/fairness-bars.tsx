"use client";

import { motion } from "framer-motion";
import type { Member } from "@/lib/chores-data";
import { AVATAR_OPACITIES } from "@/lib/avatar";

export function FairnessBars({ members }: { members: Member[] }) {
  const total = members.reduce((sum, member) => sum + member.score, 0) || 1;

  return (
    <div className="flex items-end justify-center gap-4 rounded-3xl bg-doorframe p-6 shadow-sm">
      {members.map((member, index) => {
        const pct = Math.round((member.score / total) * 100);
        return (
          <div key={member.id} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-semibold text-ink">{pct}%</span>
            <div className="relative h-36 w-full max-w-12 overflow-hidden rounded-full bg-hallway">
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-full bg-brass"
                style={{ opacity: AVATAR_OPACITIES[index % AVATAR_OPACITIES.length] }}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              />
            </div>
            <p className="w-full truncate text-center text-xs font-medium text-ink/70">
              {member.displayName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
