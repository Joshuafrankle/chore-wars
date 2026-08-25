"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignOutDialog({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Sign out?</DialogTitle>
        <DialogDescription>You&apos;ll need your email again to sign back in.</DialogDescription>

        <div className="mt-4 flex gap-2">
          <DialogClose className="flex-1 rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-hallway focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
            Cancel
          </DialogClose>
          <form action={signOutAction} className="flex-1">
            <button
              type="submit"
              className="w-full rounded-xl bg-overdue px-4 py-2 text-sm font-medium text-doorframe transition-colors hover:bg-overdue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-overdue focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe"
            >
              Sign out
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
