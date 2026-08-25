"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteDialog({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
        Invite
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Invite a roommate</DialogTitle>
        <DialogDescription>
          Share this code — they'll enter it when they join the house.
        </DialogDescription>

        <p className="mt-4 rounded-xl bg-hallway py-4 text-center font-display text-3xl font-semibold tracking-[0.2em] text-coral">
          {inviteCode}
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 w-full rounded-xl bg-coral px-4 py-3 text-sm font-medium text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-doorframe"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>

        <DialogClose className="mt-2 w-full rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-hallway focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
          Close
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
