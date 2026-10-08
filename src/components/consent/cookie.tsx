import { useId, type Ref } from "react";
import { cn } from "@/lib/utils";

/** Where the bites land, in the cookie's 100-unit box (animated by the banner through `data-bite`) */
const BITES = [
  { cx: 92, cy: 24 },
  { cx: 100, cy: 46 },
  { cx: 78, cy: 10 },
];

const CHIPS = [
  "M30 30c3-2 8-1 9 3s-3 7-7 6-5-7-2-9z",
  "M58 24c3-1 6 1 6 4s-3 5-6 4-3-6 0-8z",
  "M22 56c3-2 7 0 7 4s-4 6-7 4-3-6 0-8z",
  "M48 48c4-2 9 1 8 5s-5 6-9 4-3-7 1-9z",
  "M64 68c3-1 7 1 6 5s-4 5-7 3-2-7 1-8z",
  "M38 74c3-1 6 1 5 4s-4 5-6 3-2-6 1-7z",
  "M72 40c2-1 5 1 4 3s-3 4-5 3-1-5 1-6z",
];

/**
 * A chocolate chip cookie, drawn in code. The bites start at zero size; the
 * banner grows them (`[data-bite]` circles in the mask) when a choice is made.
 */
export function Cookie({ className, ref }: { className?: string; ref?: Ref<SVGSVGElement> }) {
  const mask = `cookie-bites-${useId().replace(/:/g, "")}`;
  return (
    <svg ref={ref} viewBox="0 0 100 100" aria-hidden className={cn("block", className)}>
      <defs>
        <mask id={mask}>
          <rect width="100" height="100" fill="white" />
          {BITES.map((bite, index) => (
            <circle key={index} data-bite="" cx={bite.cx} cy={bite.cy} r="0" fill="black" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <circle cx="50" cy="50" r="46" className="fill-cookie" />
        <circle cx="50" cy="50" r="46" fill="none" strokeWidth="3" className="stroke-chip/25" />
        {CHIPS.map((d) => (
          <path key={d} d={d} className="fill-chip" />
        ))}
        <circle cx="68" cy="22" r="1.6" className="fill-chip/40" />
        <circle cx="16" cy="40" r="1.4" className="fill-chip/40" />
        <circle cx="56" cy="86" r="1.6" className="fill-chip/40" />
      </g>
    </svg>
  );
}
