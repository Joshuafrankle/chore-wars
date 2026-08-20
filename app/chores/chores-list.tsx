"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ChoresData } from "@/lib/chores-data";
import { ChoreCard } from "./chore-card";
import { FairnessBar } from "./fairness-bar";

async function fetchChores(): Promise<ChoresData> {
  const res = await fetch("/api/chores");
  if (!res.ok) throw new Error("Couldn't load chores.");
  return res.json();
}

async function completeAssignment(assignmentId: string) {
  const res = await fetch(`/api/chores/${assignmentId}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("Couldn't mark that done.");
  return res.json();
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

  const { data } = useQuery({ queryKey: ["chores"], queryFn: fetchChores, initialData });

  const mutation = useMutation({
    mutationFn: completeAssignment,
    onMutate: async (assignmentId: string) => {
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
    onError: (_error, _assignmentId, context) => {
      if (context?.previous) queryClient.setQueryData(["chores"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      // Let the animation play out before the row settles into its (likely
      // reassigned) next state.
      setTimeout(() => setAnimatingId(null), 650);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <FairnessBar members={data.members} />

      {!data.chores.length ? (
        <p className="rounded-2xl bg-doorframe p-6 text-center text-ink/70">
          Nothing set up yet — kitchen, bathroom, and common area duty appear here as soon as
          your household has members.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.chores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              isAnimating={animatingId === chore.assignment?.id}
              disabled={mutation.isPending}
              onComplete={() => chore.assignment && mutation.mutate(chore.assignment.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
