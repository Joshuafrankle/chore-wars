"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Member } from "@/lib/chores-data";

// Same brand color at descending opacity per member — keeps the bar inside
// the existing token set instead of inventing a per-person palette.
const SEGMENT_OPACITIES = [1, 0.75, 0.55, 0.4, 0.28];

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.6,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reducedMotion]);

  return <span>{display}</span>;
}

export function FairnessBar({ members }: { members: Member[] }) {
  const total = members.reduce((sum, member) => sum + member.score, 0);

  return (
    <div className="rounded-2xl bg-doorframe p-4">
      <p className="mb-2 text-sm text-ink/60">Fairness</p>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-hallway">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            className="h-full rounded-full bg-brass"
            style={{ opacity: SEGMENT_OPACITIES[index % SEGMENT_OPACITIES.length] }}
            animate={{ width: total > 0 ? `${(member.score / total) * 100}%` : `${100 / members.length}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {members.map((member, index) => (
          <li key={member.id} className="flex items-center gap-1.5 text-sm text-ink">
            <span
              className="h-2 w-2 rounded-full bg-brass"
              style={{ opacity: SEGMENT_OPACITIES[index % SEGMENT_OPACITIES.length] }}
            />
            {member.displayName} · <CountUp value={member.score} />
          </li>
        ))}
      </ul>
    </div>
  );
}
