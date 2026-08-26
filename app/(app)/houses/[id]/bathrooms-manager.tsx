"use client";

import { useActionState } from "react";
import { addBathroom, removeBathroom, type ActionState } from "../actions";

const initialState: ActionState = {};

type Bathroom = { id: string; label: string; occupantCount: number };

function AddBathroomButton({ householdId }: { householdId: string }) {
  const [state, formAction, pending] = useActionState(addBathroom, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="householdId" value={householdId} />
      {state.error && <p className="mb-2 text-sm text-overdue">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-hallway focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add a bathroom"}
      </button>
    </form>
  );
}

function RemoveBathroomButton({
  householdId,
  bathroom,
}: {
  householdId: string;
  bathroom: Bathroom;
}) {
  const [state, formAction, pending] = useActionState(removeBathroom, initialState);
  const canRemove = bathroom.occupantCount === 0;

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between rounded-xl bg-hallway px-4 py-3">
        <span className="text-ink">{bathroom.label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/60">
            {bathroom.occupantCount} tenant{bathroom.occupantCount === 1 ? "" : "s"}
          </span>
          <form action={formAction}>
            <input type="hidden" name="householdId" value={householdId} />
            <input type="hidden" name="bathroomId" value={bathroom.id} />
            <button
              type="submit"
              disabled={!canRemove || pending}
              aria-label={`Remove ${bathroom.label}`}
              className="text-sm font-medium text-overdue disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
      {state.error && <p className="text-sm text-overdue">{state.error}</p>}
    </li>
  );
}

export function BathroomsManager({
  householdId,
  bathrooms,
}: {
  householdId: string;
  bathrooms: Bathroom[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {bathrooms.map((bathroom) => (
          <RemoveBathroomButton key={bathroom.id} householdId={householdId} bathroom={bathroom} />
        ))}
      </ul>
      <AddBathroomButton householdId={householdId} />
    </div>
  );
}
