"use client";

import { useActionState } from "react";
import { createHousehold, type ActionState } from "../actions";

const initialState: ActionState = {};

export function NewHouseholdForm() {
  const [state, formAction, pending] = useActionState(createHousehold, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium text-ink">
        Household name
      </label>
      <input
        id="name"
        name="name"
        required
        placeholder="e.g. 14 Cedar Road"
        className="rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-brass"
      />
      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create household"}
      </button>
    </form>
  );
}
