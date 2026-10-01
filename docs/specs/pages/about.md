# Page: About (`/about`)

Status: spec
Approved by / date:

The agency's story, the office, and how Skyline works. Built part by part like the homepage; each part below gets its own approval.

## Reference (`/over`)

| Section | What it does |
|---|---|
| Hero | Centered serif lead ("Over ons"), big headline ("Wij zijn makers") with text reveal and weight hover, a paragraph about the studio, a "Meet the team" squiggle link; the sticker trail runs over the whole hero |
| Team | The tall scatter from the homepage, now with a role line under each portrait (grotesk caps role, serif one-liner), stickers with momentum hover, parallax that can be disabled per breakpoint |
| Contact CTA and footer | Same as the homepage |

## Skyline version

No team (D2), so the scatter shows the office and the way Skyline works instead.

| # | Part | Content | Components |
|---|---|---|---|
| A1 | Hero | Lead: About us / Headline: WE GROW / *ASTRONOMICALLY* (or a new line, to agree) / Paragraph from the legacy about copy: a full-service digital advertising and branding agency in Dallas, helping national, global and startup brands punch above their weight / Link: How we work. Sticker trail over the hero. | `Section`, `Lead`, `Heading`, `WeightHover`, `DrawLineLink`, `CursorTrail` |
| A2 | Statement | One large paragraph, revealed line by line: "We are not just an ad agency. We are a full-service growth facility." plus the legacy paragraph on hiring with intent and being good stewards of the client's budget | `Heading` or `para-xl`, `ScrollReveal` |
| A3 | Office scatter | The part 06 layout with office photos and Nova, each with a short hand-lettered caption (1529 Dragon St, the lobby, the studio...). Photos (Q12, approved): the three from the current about page plus temporary stock office photos to fill the scatter, all swapped for real ones later. Stock placeholders live in `public/images/placeholder/` and are listed in the placeholder register. | `ScatterLayout`, `Polaroid`, `Lettering`, `Parallax`, `MomentumHover`, `Sticker` |
| A4 | Where we work | Marquee of places (Q7, approved): Dallas, Brazil, Canada | `Marquee` |
| A5 | Capabilities deck | Short line plus a button to download the deck PDF. Kept (Q8): same button as the current About hero. Ships with the 2023 PDF (`../skyline-2023/assets/downloads/capabilities-deck-2023.pdf`) until the user sends the latest deck. | `Button` |
| A6 | Contact CTA and footer | Shared | `ContactCta`, `Footer` |

## Content

- Legacy about copy in `../skyline-2023/about.php` is the starting point; final copy drafted in the spec review for A1 and A2.
- Presence confirmed (Q7): Dallas, Brazil and Canada.
- Capabilities deck stays (Q8); the PDF gets updated later.

## Assets

| Asset | Source | Status |
|---|---|---|
| Office photos | Current about page (3) plus temporary stock photos | Placeholders until real photos arrive |
| Nova scenes for A3 | To produce | Later |
| Capabilities deck PDF | Legacy 2023 version for now | Latest version from the user later |

## Acceptance

Per part, as in `docs/specs/_TEMPLATE.md`.
