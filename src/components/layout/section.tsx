import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & {
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
      // Dark sections are transparent over the body's ink and the fixed stars; light ones paint their own ground.
      className={cn("relative text-(--theme-text)", theme === "light" && "bg-(--theme-bg)", className)}
      {...props}
    />
  );
}
