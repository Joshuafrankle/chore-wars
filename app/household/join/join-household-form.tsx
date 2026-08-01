"use client";

import { useActionState } from "react";
import { findHouseholdByCode, type ActionState } from "../actions";

const initialState: ActionState = {};

export function JoinHouseholdForm() {
  const [state, formAction, pending] = useActionState(findHouseholdByCode, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="inviteCode" className="text-sm font-medium text-ink">
        Invite code
      </label>
      <input
        id="inviteCode"
        name="inviteCode"
        required
        autoCapitalize="characters"
        placeholder="e.g. 7K4RXQ"
        className="rounded-xl border border-ink/15 bg-doorframe px-4 py-3 uppercase text-ink outline-none placeholder:text-ink/40 placeholder:normal-case focus-visible:ring-2 focus-visible:ring-brass"
      />
      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway disabled:opacity-60"
      >
        {pending ? "Looking up…" : "Continue"}
      </button>
    </form>
  );
}
