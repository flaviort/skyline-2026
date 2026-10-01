import { cn } from "@/lib/utils";

// The site's whole icon set (no icon library, decision Q20). Paths come from
// the legacy site's SVGs where one exists; one arrow path is rotated for every
// direction so arrows always match.

const ARROW =
  "M13.5,9.9l-5.9,6.2c-0.2,0.2-0.4,0.3-0.6,0.3c-0.2,0-0.4-0.1-0.6-0.3L0.5,9.9C0.2,9.6,0.2,9,0.5,8.7c0.3-0.3,0.9-0.3,1.2,0 l4.4,4.7v-12C6.1,1,6.5,0.6,7,0.6c0.5,0,0.8,0.4,0.8,0.8v12l4.5-4.7c0.3-0.4,0.9-0.4,1.2,0C13.8,9,13.8,9.6,13.5,9.9z";

const ICONS = {
  arrow: { viewBox: "0 0 14 17", d: ARROW },
  angle: {
    viewBox: "0 0 13 8",
    d: "M12.6083 1.82656L7.0126 7.18789C6.83681 7.33437 6.66103 7.39297 6.51455 7.39297C6.33877 7.39297 6.16299 7.33437 6.0165 7.21719L0.391502 1.82656C0.0985333 1.56289 0.0985333 1.09414 0.362205 0.830467C0.625877 0.537498 1.09463 0.537498 1.3583 0.80117L6.51455 5.72304L11.6415 0.80117C11.9052 0.537498 12.3739 0.537498 12.6376 0.830467C12.9013 1.09414 12.9013 1.56289 12.6083 1.82656Z",
  },
  close: {
    viewBox: "0 0 19 20",
    d: "M18.4863 19.1113C18.1348 19.4629 17.4902 19.4629 17.1387 19.1113L9.4043 11.3184L1.61133 19.1113C1.25977 19.4629 0.615234 19.4629 0.263672 19.1113C-0.0878906 18.7598 -0.0878906 18.1152 0.263672 17.7637L8.05664 9.9707L0.263672 2.23633C-0.0878906 1.88477 -0.0878906 1.24023 0.263672 0.888672C0.615234 0.537109 1.25977 0.537109 1.61133 0.888672L9.4043 8.68164L17.1387 0.888672C17.4902 0.537109 18.1348 0.537109 18.4863 0.888672C18.8379 1.24023 18.8379 1.88477 18.4863 2.23633L10.6934 9.9707L18.4863 17.7637C18.8379 18.1152 18.8379 18.7598 18.4863 19.1113Z",
  },
  diagonal: {
    viewBox: "0 0 30 30",
    d: "M0 30L0 24.6L30 24.6L30 30L0 30Z M24.6 0L30 0L30 30L24.6 30L24.6 0Z M2.48421 6.30258L6.30259 2.48421L27.5158 23.6974L23.6974 27.5158L2.48421 6.30258Z",
  },
} as const;

export type IconName = keyof typeof ICONS;
export type Direction = "down" | "up" | "left" | "right";

const ROTATION: Record<Direction, number> = { down: 0, left: 90, up: 180, right: 270 };

type IconProps = {
  name: IconName;
  /** Rotates directional icons (arrow, angle); ignored by the rest */
  direction?: Direction;
  className?: string;
  /** Accessible name; icons are decorative when omitted */
  title?: string;
};

export function Icon({ name, direction = "down", className, title }: IconProps) {
  const icon = ICONS[name];
  const rotate = name === "arrow" || name === "angle" ? ROTATION[direction] : 0;
  return (
    <svg
      viewBox={icon.viewBox}
      className={cn("inline-block shrink-0", className)}
      fill="currentColor"
      style={rotate ? { rotate: `${rotate}deg` } : undefined}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={icon.d} />
    </svg>
  );
}
