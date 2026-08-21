"use client";

import { useActionState } from "react";
import { createHousehold, type ActionState } from "../actions";

const initialState: ActionState = {};

const fieldClass =
  "rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-brass";

export function NewHouseholdForm() {
  const [state, formAction, pending] = useActionState(createHousehold, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium text-ink">
        House name
      </label>
      <input
        id="name"
        name="name"
        required
        placeholder="e.g. 14 Cedar Road"
        className={fieldClass}
      />

      <label htmlFor="roomCount" className="text-sm font-medium text-ink">
        Number of rooms
      </label>
      <input
        id="roomCount"
        name="roomCount"
        type="number"
        min={1}
        max={50}
        defaultValue={4}
        required
        className={fieldClass}
      />
      <p className="-mt-1 text-sm text-ink/60">Caps how many tenants can join — one per room.</p>

      <label htmlFor="bathroomCount" className="text-sm font-medium text-ink">
        Number of bathrooms
      </label>
      <input
        id="bathroomCount"
        name="bathroomCount"
        type="number"
        min={1}
        max={10}
        defaultValue={1}
        required
        className={fieldClass}
      />
      <p className="-mt-1 text-sm text-ink/60">
        Tenants will pick which one they use when they join.
      </p>

      <label htmlFor="whatsappLink" className="text-sm font-medium text-ink">
        WhatsApp group link (optional)
      </label>
      <input
        id="whatsappLink"
        name="whatsappLink"
        type="url"
        placeholder="https://chat.whatsapp.com/..."
        className={fieldClass}
      />
      <p className="-mt-1 text-sm text-ink/60">Shown to tenants right after they join.</p>

      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create house"}
      </button>
    </form>
  );
}
