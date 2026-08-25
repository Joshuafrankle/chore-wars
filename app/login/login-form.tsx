"use client";

import { useState, type SubmitEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const email = event.currentTarget.email.value;
    setEmail(email);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="bg-spruce/10 text-ink rounded-2xl px-5 py-4 text-center">
        Link sent to <span className="font-medium">{email}</span>. Open it on this device to sign
        in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label htmlFor="email" className="text-ink text-sm font-medium">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="border-ink/15 bg-doorframe text-ink placeholder:text-ink/40 focus-visible:ring-coral rounded-xl border px-4 py-3 outline-none focus-visible:ring-2"
      />
      {status === "error" && (
        <p className="text-overdue text-sm">
          Couldn&apos;t send the link: {errorMessage}. Check the address and try again.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-coral text-doorframe hover:bg-coral/90 focus-visible:ring-coral focus-visible:ring-offset-hallway rounded-xl px-5 py-3 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
