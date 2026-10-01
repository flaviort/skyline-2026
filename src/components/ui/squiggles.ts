// Hand-drawn underline strokes for DrawLineLink, drawn for Skyline.
// Same idea as the reference: one round-capped stroke in a 310 x 40 box,
// stretched to the link's width. Links cycle through them in order.

export const SQUIGGLES = [
  "M6 22C58 11 104 31 156 20S258 10 304 20",
  "M6 27C70 15 138 30 178 19C206 11 216 33 198 31C178 29 206 13 248 14C276 15 296 16 304 15",
  "M6 21Q30 9 55 21T105 21T155 21T205 21T255 21T304 21",
  "M6 31C92 25 190 12 304 8",
  "M9 16C100 11 212 11 301 15C222 23 122 27 40 31",
  "M6 24C82 20 150 15 230 18C270 19 300 14 290 8C281 2 262 15 304 23",
] as const;

let next = Math.floor(Math.random() * SQUIGGLES.length);

/** Returns the next squiggle path in the shared cycle. */
export function nextSquiggle() {
  const path = SQUIGGLES[next];
  next = (next + 1) % SQUIGGLES.length;
  return path;
}
