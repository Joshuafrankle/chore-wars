import Link from "next/link";

export default function HouseholdChoicePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Get started
        </h1>
        <p className="mt-2 text-ink/70">
          Set up a house you manage, or join one with an invite code.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/household/new"
          className="rounded-xl bg-coral px-5 py-3 text-center font-medium text-doorframe transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Set up a house
        </Link>
        <Link
          href="/household/join"
          className="rounded-xl border border-ink/15 px-5 py-3 text-center font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Join with a code
        </Link>
      </div>
    </main>
  );
}
