import { DrawLineLink } from "@/components/ui/draw-line-link";
import type { NavLink } from "@/content/site";
import { cn } from "@/lib/utils";

type NavPillProps = {
  links: NavLink[];
  /** The current path, to keep its squiggle drawn and mark it for assistive tech */
  current: string;
  className?: string;
};

/** The black box of menu links in the center of the header. */
export function NavPill({ links, current, className }: NavPillProps) {
  return (
    <nav aria-label="Main" className={cn("flex h-[3rem] items-center bg-black px-[1.25rem] text-ground", className)}>
      <ul className="flex items-center gap-[1.5rem]">
        {links.map((link) => (
          <li key={link.href}>
            <DrawLineLink href={link.href} label={link.label} variant="menu" persist={isCurrent(current, link.href)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const isCurrent = (path: string, href: string) => path === href || path.startsWith(`${href}/`);
