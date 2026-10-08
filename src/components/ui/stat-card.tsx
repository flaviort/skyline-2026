import { cn } from "@/lib/utils";

type StatCardProps = {
  value: number;
  /** Written after the number in the accent, like + or x */
  suffix?: string;
  label: string;
  /** One concrete line under the label: who, what, where */
  detail?: string;
  className?: string;
};

/**
 * A figure on a paper card: a big light number at the top, its label and a
 * line of detail at the bottom. Static markup; the section animates it (the
 * number carries `data-count` for a count-up, the card `data-stat-card` for
 * the open).
 */
export function StatCard({ value, suffix, label, detail, className }: StatCardProps) {
  return (
    <div data-stat-card="" className={cn("flex flex-col justify-between bg-paper p-[3.6rem] text-ink max-md:p-[2.4rem]", className)}>
      <p className="text-(length:--heading-xl) leading-[0.9] font-light tracking-[-0.04em] tabular-nums">
        <span data-count={value}>{value}</span>
        {suffix && <span className="text-orange">{suffix}</span>}
      </p>
      <div className="mt-[4rem]">
        <p className="readout leading-[1.4] text-ink">{label}</p>
        {detail && <p className="para-m mt-[1.2rem] max-w-[30rem] text-mute">{detail}</p>}
      </div>
    </div>
  );
}
