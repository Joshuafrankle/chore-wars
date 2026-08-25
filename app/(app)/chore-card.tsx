"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ChoreListItem } from "@/lib/chores-data";
import { DueBadge } from "./due-badge";
import { ChoreIcon } from "./chore-icon";

export function ChoreCard({
  chore,
  index,
  isAnimating,
  disabled,
  errorMessage,
  onComplete,
}: {
  chore: ChoreListItem;
  index: number;
  isAnimating: boolean;
  disabled: boolean;
  errorMessage?: string;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const assignment = chore.assignment;

  return (
    <motion.li
      className="relative overflow-hidden rounded-3xl bg-doorframe p-4 card-elevated"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      {/* The signature completion moment: a spruce pulse behind the card,
          effort chips launching off the button, and the button itself
          morphing into a checkmark — all skipped in favor of an instant
          state swap when the user prefers reduced motion. */}
      <AnimatePresence>
        {isAnimating && !reducedMotion && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-3xl bg-spruce"
            initial={{ opacity: 0.3, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start gap-3">
        <ChoreIcon kind={chore.defaultKind} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-ink">{chore.name}</span>
            <span className="shrink-0 text-sm font-medium text-coral">+{chore.effortWeight} pts</span>
          </div>
          <p className="mt-0.5 text-sm text-ink/60">
            {assignment?.assigneeName ?? "Unassigned"}&apos;s turn
            {assignment && (
              <>
                {" · "}
                <DueBadge dueDate={assignment.dueDate} />
              </>
            )}
          </p>
          {errorMessage && <p className="mt-1 text-sm text-overdue">{errorMessage}</p>}

          <button
            type="button"
            onClick={onComplete}
            disabled={disabled || isAnimating || !assignment}
            className="relative mt-3 w-full overflow-hidden rounded-2xl bg-coral px-3 py-2.5 text-sm font-medium text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe disabled:opacity-60"
          >
            {isAnimating && !reducedMotion && (
              <span className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center gap-1">
                {Array.from({ length: chore.effortWeight }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-spruce"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -28, opacity: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                  />
                ))}
              </span>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {isAnimating ? (
                <motion.span
                  key="done"
                  initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  ✓ Done
                </motion.span>
              ) : (
                <motion.span key="mark" initial={false}>
                  Mark done
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.li>
  );
}
