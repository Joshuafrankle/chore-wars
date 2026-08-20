import { JoinHouseholdForm } from "./join-household-form";

export default async function JoinHouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Join a house
        </h1>
        {error === "invalid" && (
          <p className="mb-4 text-sm text-overdue">
            That house couldn&apos;t be found, or isn&apos;t set up yet. Double-check the code
            with whoever invited you.
          </p>
        )}
        <JoinHouseholdForm />
      </div>
    </main>
  );
}
