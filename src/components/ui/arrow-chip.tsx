import { cn } from "@/lib/utils";
import { Icon, type Direction } from "./icon";

export type ChipColor = "orange" | "ink" | "paper" | "cobalt" | "lilac" | "visor";

// Background and icon color per chip color. Text on orange is always ink
// (white on orange is only 3.3:1, decision Q17).
const COLORS: Record<ChipColor, string> = {
  orange: "bg-orange text-ink",
  ink: "bg-ink text-paper",
  paper: "bg-paper text-ink",
  cobalt: "bg-cobalt text-paper",
  lilac: "bg-lilac text-ink",
  visor: "bg-visor text-ink",
};

type ArrowChipProps = {
  color?: ChipColor;
  direction?: Direction;
  className?: string;
};

/** Small square with an arrow. Sized in em so it scales with the text beside it. */
export function ArrowChip({ color = "orange", direction = "right", className }: ArrowChipProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid size-[0.95em] shrink-0 place-items-center", COLORS[color], className)}
    >
      <Icon name="arrow" direction={direction} className="h-[0.5em] w-auto" />
    </span>
  );
}
