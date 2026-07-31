import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user!.id)
    .single();

  if (!profile?.household_id) {
    redirect("/household");
  }

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase
      .from("households")
      .select("name, invite_code")
      .eq("id", profile.household_id)
      .single(),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("household_id", profile.household_id)
      .order("display_name"),
  ]);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-hallway px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {household?.name}
        </h1>
        <p className="mt-2 text-ink/70">
          Signed in as <span className="font-medium">{profile.display_name}</span>
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-doorframe p-5">
        <p className="text-sm text-ink/60">Invite code</p>
        <p className="font-display text-2xl font-semibold tracking-[0.2em] text-brass">
          {household?.invite_code}
        </p>
        <p className="mt-1 text-sm text-ink/60">
          Share this with roommates so they can join.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-doorframe p-5">
        <p className="mb-3 text-sm text-ink/60">
          {members?.length} member{members?.length === 1 ? "" : "s"}
        </p>
        <ul className="flex flex-col gap-2">
          {members?.map((member) => (
            <li key={member.id} className="text-ink">
              {member.display_name}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/chores"
        className="rounded-xl bg-brass px-5 py-3 font-medium text-doorframe transition-colors hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-hallway"
      >
        View chores
      </Link>

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
