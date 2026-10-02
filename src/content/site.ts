// Site-wide content: the menu's links and the Contact button (part 09).
// The pages come later; until then the links point at their future routes.

export type NavLink = { label: string; href: string };

export const nav: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
];

export const contactCta: NavLink = { label: "Contact", href: "/contact" };
