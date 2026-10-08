# Part 01c: Stats

Status: built, in review (2026-10-06)
Approved by / date:

The first light section, right after the about section. It slides over the about block as that one leaves (`useScrollAway`, see `01b-about.md`). Requested by the user from a reference screenshot: one portrait photo and three paper cards in a row, a big light number at the top of each card and its label at the bottom.

## Layout

- Light theme ground (`--color-ground`), cards on `--color-paper`, four equal columns with the grid gap, each 3:4. Tablets two by two, phones stacked (photo 4:5, cards as tall as they need with a 28rem floor).
- Number: Inter Tight light (300), `--heading-xl`, tabular figures; the suffix (+, x, %) in orange. Label: the `readout` style in ink.
- Photo: `public/images/legacy/agency-01.jpg` (the Dallas office). Part 03's collage also lists it; swap one of them if the user wants no repeat.

## Content (waiting for approval in `docs/CONTENT.md`)

Round 2 (2026-10-06, user: round 1 was "very generic", the 45% did not make sense; wanted something like a count of clients or big brands). Each card now has a label and one concrete line.

| Figure | Label | Detail line | Source |
|---|---|---|---|
| 30+ | Brands on our roster | Scooter Braun, Axl Rose, Dymatize, Barker Wellness and Cypress Hemp among them. | 30 distinct clients named in the capabilities decks (19 in the 2025 edition, 9 more in 2023) and the old portfolio (Dymatize, Sophie Brussaux). A floor, not a total |
| 10+ | Years in the business | Launching and scaling national and global brands from the Dallas Design District. | "over a decade of experience" (2025 deck), "over 10 years" (old site) |
| 3x | Revenue in one year | What a lifestyle brand made the year after we rebuilt it. | "Lifestyle rebrand that generated a threefold increase in revenue within one year" (2025 deck) |

Dropped: 45% engagement (true, but meaningless without the brand).

## Motion

- Staggered open when the row's top reaches 80% of the viewport, once: each card opens upward (clip from the bottom edge, 1.2s, `move` ease), 0.14s apart, left to right. Card content rises 18% behind the opening edge; the photo settles from 1.2x inside its frame; each number counts up from zero (1.6s) starting 0.25s into its card's open. The real figures are in the markup. Everything shows as is with reduced motion.
- Nova's canvas is clipped at this section's top edge (`NOVA_COVER` in `src/lib/nova-landing.ts`), so Nova and the space cast, which trail a fast scroll, never draw over the light ground.

## Components

| Component | Reuse / new | Notes |
|---|---|---|
| `Section` | reuse | `theme="light"`, `data-nova-cover` |
| `StatCard` | new, `src/components/ui/stat-card.tsx` | `value`, `suffix`, `label`, `detail`, `className`; static, marked with `data-stat-card` and `data-count` for the section's animation |
| `Stats` | new, `src/components/sections/home/stats.tsx` | copy in `src/content/home.ts` (`stats`) |
