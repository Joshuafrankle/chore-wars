"use client";

// Hand-written in shadcn's standard shape (Dialog/DialogContent/DialogTitle/
// DialogDescription over @radix-ui/react-dialog), styled with our own
// design tokens instead of shadcn's default theme — the CLI needs
// interactive prompts this environment can't drive, so this was written
// directly rather than generated. Swap for the generated version later if
// you ever run `shadcn add dialog` yourself; the API is the same.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={`dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-doorframe p-6 shadow-xl focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={`font-display text-xl font-semibold text-ink ${className}`}
      {...props}
    />
  );
}

export function DialogDescription({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={`mt-1 text-sm text-ink/60 ${className}`} {...props} />;
}
