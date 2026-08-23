"use client";

import { useActionState } from "react";
import { joinHousehold, type ActionState } from "../../actions";

const initialState: ActionState = {};

type Bathroom = { id: string; label: string };

const fieldClass =
  "rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-coral";

export function OnboardingForm({
  householdId,
  defaultName,
  bathrooms,
  availableRooms,
}: {
  householdId: string;
  defaultName: string;
  bathrooms: Bathroom[];
  availableRooms: number[];
}) {
  const [state, formAction, pending] = useActionState(joinHousehold, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="householdId" value={householdId} />

      <label htmlFor="displayName" className="text-sm font-medium text-ink">
        Your name
      </label>
      <input
        id="displayName"
        name="displayName"
        required
        maxLength={40}
        defaultValue={defaultName.slice(0, 40)}
        placeholder="e.g. Priya"
        className={fieldClass}
      />

      <label htmlFor="roomNumber" className="text-sm font-medium text-ink">
        Your room
      </label>
      <select id="roomNumber" name="roomNumber" required defaultValue="" className={fieldClass}>
        <option value="" disabled>
          Choose a room
        </option>
        {availableRooms.map((room) => (
          <option key={room} value={room}>
            Room {room}
          </option>
        ))}
      </select>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Which bathroom do you use?</legend>
        {bathrooms.map((bathroom, index) => (
          <label
            key={bathroom.id}
            className="flex items-center gap-3 rounded-xl border border-ink/15 bg-doorframe px-4 py-3 text-ink has-[:checked]:border-coral"
          >
            <input
              type="radio"
              name="bathroomId"
              value={bathroom.id}
              required
              defaultChecked={index === 0}
              className="accent-coral"
            />
            {bathroom.label}
          </label>
        ))}
      </fieldset>

      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-coral px-5 py-3 font-medium text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-hallway disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join house"}
      </button>
    </form>
  );
}
