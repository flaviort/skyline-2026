// Site-wide content: the menu's links and the Contact button (part 09).
// The pages come later; until then the links point at their future routes.

export type NavLink = { label: string; href: string };

export const nav: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
];

export const contactCta: NavLink = { label: "Contact", href: "/contact" };

// The launch intro on every full page load (part 11a). New copy, waiting for
// approval in docs/CONTENT.md. Each of the four stage lights lands with its
// number, counting down from here (04, 03, 02, 01), then the liftoff word shows.
export const launchIntro = {
  label: "T-minus",
  from: 4,
  liftoff: "Liftoff",
};
