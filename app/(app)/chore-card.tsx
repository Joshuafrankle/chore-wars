"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ChoreListItem } from "@/lib/chores-data";
import { DueBadge } from "./due-badge";

export function ChoreCard({
  chore,
  isAnimating,
  disabled,
  errorMessage,
  onComplete,
}: {
  chore: ChoreListItem;
  isAnimating: boolean;
  disabled: boolean;
  errorMessage?: string;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const assignment = chore.assignment;

  return (
    <li className="relative overflow-hidden rounded-2xl bg-doorframe p-4">
      {/* The signature completion moment: a spruce pulse behind the card,
          effort chips launching off the button, and the button itself
          morphing into a checkmark — all skipped in favor of an instant
          state swap when the user prefers reduced motion. */}
      <AnimatePresence>
        {isAnimating && !reducedMotion && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-2xl bg-spruce"
            initial={{ opacity: 0.3, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <span className="font-medium text-ink">{chore.name}</span>
          <span
            className="ml-2 inline-flex gap-1 align-middle"
            aria-label={`Effort ${chore.effortWeight} of 5`}
          >
            {Array.from({ length: chore.effortWeight }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-brass" />
            ))}
          </span>
        </div>

        <button
          type="button"
          onClick={onComplete}
          disabled={disabled || isAnimating || !assignment}
          className="relative shrink-0 rounded-xl bg-brass px-3 py-2 text-sm font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe disabled:opacity-60"
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

      <p className="relative mt-1 text-sm text-ink/60">
        {assignment?.assigneeName ?? "Unassigned"}&apos;s turn
        {assignment && (
          <>
            {" · "}
            <DueBadge dueDate={assignment.dueDate} />
          </>
        )}
      </p>
      {errorMessage && <p className="relative mt-1 text-sm text-overdue">{errorMessage}</p>}
    </li>
  );
}
