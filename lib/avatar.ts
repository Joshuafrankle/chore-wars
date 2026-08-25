// Same opacity-stepped coral palette used by the fairness bar, member
// cards, and the profile page, so a person reads as the same "color" of
// coral everywhere they appear.
export const AVATAR_OPACITIES = [1, 0.75, 0.55, 0.4, 0.28];

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
