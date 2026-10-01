// Joins class names, skipping falsy values. Kept dependency-free on purpose.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
