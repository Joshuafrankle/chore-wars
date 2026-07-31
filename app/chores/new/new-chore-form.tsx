"use client";

import { useActionState } from "react";
import { createChore, type ActionState } from "../actions";

const initialState: ActionState = {};

const fieldClass =
  "rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-brass";

export function NewChoreForm() {
  const [state, formAction, pending] = useActionState(createChore, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium text-ink">
        Chore name
      </label>
      <input
        id="name"
        name="name"
        required
        placeholder="e.g. Kitchen bins"
        className={fieldClass}
      />

      <label htmlFor="effortWeight" className="text-sm font-medium text-ink">
        Effort (1 = quick, 5 = a slog)
      </label>
      <input
        id="effortWeight"
        name="effortWeight"
        type="number"
        min={1}
        max={5}
        defaultValue={2}
        required
        className={fieldClass}
      />

      <label htmlFor="frequencyDays" className="text-sm font-medium text-ink">
        Repeats every (days)
      </label>
      <input
        id="frequencyDays"
        name="frequencyDays"
        type="number"
        min={1}
        defaultValue={7}
        required
        className={fieldClass}
      />

      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add chore"}
      </button>
    </form>
  );
}
