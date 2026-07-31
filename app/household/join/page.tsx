import { JoinHouseholdForm } from "./join-household-form";

export default function JoinHouseholdPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Join a household
        </h1>
        <JoinHouseholdForm />
      </div>
    </main>
  );
}
