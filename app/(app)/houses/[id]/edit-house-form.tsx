"use client";

import { useActionState } from "react";
import { updateHousehold, type ActionState } from "../actions";

const initialState: ActionState = {};

const fieldClass =
  "rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-coral";

type Household = { id: string; name: string; room_count: number; whatsapp_link: string | null };

export function EditHouseForm({ household }: { household: Household }) {
  const [state, formAction, pending] = useActionState(updateHousehold, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="householdId" value={household.id} />

      <label htmlFor="name" className="text-sm font-medium text-ink">
        House name
      </label>
      <input id="name" name="name" required defaultValue={household.name} className={fieldClass} />

      <label htmlFor="roomCount" className="text-sm font-medium text-ink">
        Number of rooms
      </label>
      <input
        id="roomCount"
        name="roomCount"
        type="number"
        min={1}
        max={50}
        required
        defaultValue={household.room_count}
        className={fieldClass}
      />

      <label htmlFor="whatsappLink" className="text-sm font-medium text-ink">
        WhatsApp group link (optional)
      </label>
      <input
        id="whatsappLink"
        name="whatsappLink"
        type="url"
        placeholder="https://chat.whatsapp.com/..."
        defaultValue={household.whatsapp_link ?? ""}
        className={fieldClass}
      />

      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-coral px-5 py-3 font-medium text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
