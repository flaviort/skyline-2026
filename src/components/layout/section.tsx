import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  /** Dark is the site default; light flips every theme token to the ground */
  theme?: "light" | "dark";
  /** Tells the menu which logo color to use while it sits over this section */
  navTheme?: "light" | "dark";
};

export function Section({ theme = "dark", navTheme, className, ...props }: SectionProps) {
  return (
    <section
      data-theme={theme}
      data-nav-theme={navTheme ?? (theme === "dark" ? "dark" : undefined)}
      className={cn("relative bg-(--theme-bg) text-(--theme-text)", className)}
      {...props}
    />
  );
}
