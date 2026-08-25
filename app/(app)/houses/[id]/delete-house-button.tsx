"use client";

import { useActionState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteHousehold, type ActionState } from "../actions";

const initialState: ActionState = {};

export function DeleteHouseButton({
  householdId,
  tenantCount,
}: {
  householdId: string;
  tenantCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteHousehold, initialState);
  const canDelete = tenantCount === 0;

  return (
    <Dialog>
      <DialogTrigger
        disabled={!canDelete}
        className="w-full rounded-xl border border-overdue/30 px-4 py-3 text-sm font-medium text-overdue transition-colors hover:bg-overdue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-overdue disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete house
      </DialogTrigger>
      {!canDelete && (
        <p className="text-center text-sm text-ink/60">
          Remove all {tenantCount} tenant{tenantCount === 1 ? "" : "s"} before this house can be
          deleted.
        </p>
      )}
      <DialogContent>
        <DialogTitle>Delete this house?</DialogTitle>
        <DialogDescription>
          This permanently removes the house, its chores, and its full completion history. This
          can&apos;t be undone.
        </DialogDescription>

        {state.error && <p className="mt-2 text-sm text-overdue">{state.error}</p>}

        <div className="mt-4 flex gap-2">
          <DialogClose className="flex-1 rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-hallway focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
            Cancel
          </DialogClose>
          <form action={formAction} className="flex-1">
            <input type="hidden" name="householdId" value={householdId} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-overdue px-4 py-2 text-sm font-medium text-doorframe transition-colors hover:bg-overdue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-overdue focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
