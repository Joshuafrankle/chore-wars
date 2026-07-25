import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-hallway px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Chore Wars
          </h1>
          <p className="mt-2 text-ink/70">
            No passwords. We&apos;ll email you a link to sign in.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
