// Site-wide content: the menu, footer, contact details and socials.

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

// Legacy site (components/atoms/globals.php).
export const contact = {
  email: "accounts@theskylineagency.com",
  phone: { label: "+1 972 861 0416", href: "tel:+19728610416" },
  address: { lines: ["1529 Dragon St", "Dallas, TX 75207"], map: "https://maps.google.com/?q=1529+Dragon+St,+Dallas,+TX+75207" },
};

export const socials: NavLink[] = [
  { label: "Instagram", href: "https://instagram.com/skylineagency/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/the-skyline-agency/" },
  { label: "Behance", href: "https://www.behance.net/theskylineagency" },
  { label: "Facebook", href: "https://facebook.com/theskylineagency/" },
  { label: "X", href: "https://twitter.com/Skyline_Agency" },
];

// Part 07 and 08 (approved copy, docs/CONTENT.md).
export const footer = {
  cta: {
    lines: [{ text: "Ready for" }, { text: "liftoff?", accent: true }],
    line: "Tell us where you want to go. We'll plot the route.",
    button: { label: "Start your mission", href: "/contact" },
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  // Where Skyline's people are (legacy countries marquee).
  bases: ["Dallas", "Brazil", "Canada"],
  legal: "The Skyline Agency LLC",
  legalLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};
