import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-hallway px-6 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Chore Wars
      </h1>
      <p className="max-w-xs text-ink/70">
        Signed in as <span className="font-medium">{user?.email}</span>.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-doorframe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
