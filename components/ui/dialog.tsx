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
      {/* Flexbox centers the content instead of fixed + top/left 50% +
          negative translate — that approach put the same `transform`
          property under contention with the entrance animation's own
          transform, and had no height cap, so tall content (a long
          WhatsApp link, a multi-field form) pushed the box past the
          viewport top/bottom with no way to scroll to it. */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <DialogPrimitive.Content
          className={`dialog-content max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-doorframe p-6 shadow-xl focus:outline-none ${className}`}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </div>
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
