// Homepage copy. Approved copy is in docs/CONTENT.md; edit words here, not in components.

export const banner = {
  // New copy (2026-10-02, banner direction F), waiting for approval in
  // docs/CONTENT.md. Each word is a fact from docs/PRODUCT.md: Skyline
  // launches brands, helps startups, builds websites (Web Development) and
  // runs campaigns (Digital Marketing).
  headline: { line: "We launch", words: ["brands", "startups", "websites", "campaigns"] },
  // Legacy site copy.
  intro: { plain: "Born in Dallas,", strong: "we're an agency that thinks outside the box." },
  // Real facts about the Dallas studio, shown as a ground-control readout.
  readout: {
    coordinates: "32.7767° N / 96.7970° W",
    place: "Dallas, TX",
    timeZone: "America/Chicago",
  },
  nova: { name: "Nova / EVA-01", status: "Orbit stable" },
  scroll: { label: "Scroll", href: "#about", duration: 6 },
};

// Part 01b. New copy (2026-10-06, round 3), built only from facts in
// docs/PRODUCT.md and the capabilities decks; waiting for approval in
// docs/CONTENT.md. "Grow them astronomically" keeps the old site's line.
export const about = {
  eyebrow: "About Skyline",
  /** Nova lands in the gap between the two parts of the statement */
  statement: {
    before: "We launch brands",
    after: "and grow them astronomically. Industry veterans and sharp new minds from Dallas, working for national names, global players and startups that need to punch above their weight.",
  },
  link: { label: "Get to know us", href: "/about" },
};

// Part 01c. Facts behind each figure (waiting for approval in docs/CONTENT.md):
// - 30+: distinct clients named in Skyline's capabilities decks (19 in the 2025
//   edition, 9 more in 2023) and the old portfolio (Dymatize, Sophie Brussaux).
// - 10+: "over a decade of experience" (2025 deck), "over 10 years" (old site).
// - 3x: "Lifestyle rebrand that generated a threefold increase in revenue
//   within one year" (2025 deck).
export const stats = {
  label: "Skyline in numbers",
  photo: { src: "/images/legacy/agency-01.jpg", alt: "The Skyline office in the Dallas Design District", width: 1400, height: 1982 },
  items: [
    { value: 30, suffix: "+", label: "Brands on our roster", detail: "Scooter Braun, Axl Rose, Dymatize, Barker Wellness and Cypress Hemp among them." },
    { value: 10, suffix: "+", label: "Years in the business", detail: "Launching and scaling national and global brands from the Dallas Design District." },
    { value: 3, suffix: "x", label: "Revenue in one year", detail: "What a lifestyle brand made the year after we rebuilt it." },
  ],
};

// Part 02 stand-in until the logo SVGs arrive: the names, set in type. Every
// one is a real client (old portfolio, capabilities decks, docs/CONTENT.md).
export const clients = {
  label: "Brands we've worked with",
  names: ["Dymatize", "Airly", "Barker Wellness", "Think Apollo", "Scooter Braun", "Sophie Brussaux", "Axl Rose", "Andrew Callaghan", "Cypress Hemp"],
};

// Part 04 (approved copy, docs/CONTENT.md).
export const recentWork = {
  lead: ["Hard to miss, easy to share.", "A few missions we flew lately."],
  title: [{ text: "Recent" }, { text: "work", accent: true }],
  badge: "This is how we orbit",
  link: { label: "See all work", href: "/work" },
  count: 4,
};

// Part 05 (approved copy, docs/CONTENT.md); the pillars live in src/content/services.ts.
export const whatWeDo = {
  title: [{ text: "What we" }, { text: "do", accent: true }],
  link: { label: "Discover more", href: "/services" },
};
