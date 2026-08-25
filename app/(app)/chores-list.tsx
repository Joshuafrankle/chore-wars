"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ChoresData } from "@/lib/chores-data";
import { ChoreCard } from "./chore-card";
import { Leaderboard } from "./leaderboard";

async function fetchChores(): Promise<ChoresData> {
  const res = await fetch("/api/chores", { cache: "no-store" });
  if (!res.ok) throw new Error("Couldn't load chores.");
  return res.json();
}

async function completeAssignment(assignmentId: string) {
  const res = await fetch(`/api/chores/${assignmentId}/complete`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Couldn't mark that done.");
  return body;
}

export function ChoresList({
  initialData,
  currentUserId,
}: {
  initialData: ChoresData;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [error, setError] = useState<{ assignmentId: string; message: string } | null>(null);

  const { data } = useQuery({ queryKey: ["chores"], queryFn: fetchChores, initialData });

  const mutation = useMutation({
    mutationFn: completeAssignment,
    onMutate: async (assignmentId: string) => {
      setError(null);
      setAnimatingId(assignmentId);
      await queryClient.cancelQueries({ queryKey: ["chores"] });

      const previous = queryClient.getQueryData<ChoresData>(["chores"]);
      const chore = previous?.chores.find((c) => c.assignment?.id === assignmentId);
      if (previous && chore) {
        queryClient.setQueryData<ChoresData>(["chores"], {
          ...previous,
          members: previous.members.map((member) =>
            member.id === currentUserId
              ? { ...member, score: member.score + chore.effortWeight }
              : member,
          ),
        });
      }
      return { previous };
    },
    onError: (err, assignmentId, context) => {
      if (context?.previous) queryClient.setQueryData(["chores"], context.previous);
      // No point playing the success animation for a rejected completion.
      setAnimatingId(null);
      setError({ assignmentId, message: err instanceof Error ? err.message : "Something went wrong." });
    },
    onSuccess: () => {
      // Let the animation play out before the row settles into its (likely
      // reassigned) next state.
      setTimeout(() => setAnimatingId(null), 650);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Leaderboard members={data.members} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Tasks</h2>
        {!data.chores.length ? (
          <p className="card-elevated rounded-3xl bg-doorframe p-6 text-center text-ink/70">
            Nothing set up yet — kitchen, bathroom, and common area duty appear here as soon as
            your household has members.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.chores.map((chore, index) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                index={index}
                isAnimating={animatingId === chore.assignment?.id}
                disabled={mutation.isPending}
                errorMessage={
                  error && error.assignmentId === chore.assignment?.id ? error.message : undefined
                }
                onComplete={() => chore.assignment && mutation.mutate(chore.assignment.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
