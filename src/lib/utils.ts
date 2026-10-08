// Joins class names, skipping falsy values. Kept dependency-free on purpose.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Whether ink (dark) text reads better than white on a hex background (WCAG relative luminance). */
export function prefersInk(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast against near-black ink versus white; pick the stronger.
  return (luminance + 0.05) / 0.0555 >= 1.05 / (luminance + 0.05);
}

/** Two-digit index: 1 -> "01". */
export const pad = (value: number) => String(value).padStart(2, "0");
