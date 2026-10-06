# Part 07: Contact CTA

Status: spec
Approved by / date:

The dark closing block: a big question, one line, one button, and stickers that spill out behind the mouse. It opens the footer band.

## Reference

Measured at 1440x900. The footer is one dark band (`#101010`, `data-nav-theme="dark"`); this CTA is its top 730px.

| Element | Position / size | Style |
|---|---|---|
| CTA area | full content width (page padding each side: 24px on the reference, 33px on Skyline since 2026-10-05), 730px tall | dark, the sticker trail lives across this whole area |
| Heading | centered, 788px wide, 2 lines, about 240px from the top | `heading-xl` 96px (8rem); "OOK IETS IN" grotesk, "BEWEGING BRENGEN?" serif; off-white |
| Paragraph | centered under the heading, 1 line | `para-m` 15px, off-white |
| Button | centered, 191 x 36 | pink label and chip, ink text |

Sticker trail: 6 sticker SVGs from the brand's sticker set.

## Skyline version

- Heading: READY FOR / *LIFTOFF?* One line of copy and a "Start your mission" button to `/contact`, lilac with ink text.
- Stickers: the reference's 6 stickers as dev-only placeholders first (in `public/_ref/stickers/`, gitignored, listed in the placeholder register), replaced by the stickers the user is generating (astronaut theme, internal jokes) (Q21).
- The same trail component is reused anywhere else a sticker spill is wanted (the about page hero, for instance).

## Content

- Heading: READY FOR / *LIFTOFF?*
- Line: Tell us where you want to go. We'll plot the route.
- Button: Start your mission, `/contact`
- Stickers: `src/content/site.ts` (`stickers: { src, alt }[]`), decorative, `aria-hidden`

## Assets

| Asset | Source | Status |
|---|---|---|
| Placeholder stickers (6 SVG) | Reference sticker set, saved to `public/_ref/stickers/` | Log in the placeholder register when added |
| Skyline stickers (6 to 10 SVG): astronaut theme, internal jokes | To produce with the user | Later |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Heading, line, button | enters view | Char reveal on the heading, then line, then button in a group | `expo.out`, 1s; group stagger 0.12s |
| Heading letters | pointer | Weight hover as in the banner | 0.4s `power2.out` |
| Sticker spawn | every (viewport width / 8) px of pointer travel inside the CTA, about 180px at 1440 | Next sticker in the cycle appears at the pointer, offset randomly (±40% x, ±5% y) | |
| Sticker pop | on spawn | Scales from 1.3 to 1 | `elastic.out(2, 0.6)`, 0.6s |
| Sticker drift | on spawn | Travels 4x the last pointer movement, tilting from a random -10..10deg to another | `power4.out`, 1.5s |
| Sticker exit | after the drift | Shrinks to 0.5 and is removed | `back.in(1.5)`, 0.3s, 0.1s delay |

Touch and reduced motion: no trail. The CTA reads complete without it.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Section` (dark), `Heading`, `WeightHover`, `Button`, `ScrollReveal` | reuse | | |
| `CursorTrail` | new | `items`, `spacing` (8, as viewport width / spacing), `pop`, `drift`, `lifetime` | Spawns and cleans up its own nodes; one engine for every trail effect |
| `ContactCta` | new, section-level | `heading`, `line`, `button`, `stickers` | Placed on every page before the footer, like the reference |

## Acceptance

- [ ] Heading, line and button positions match the reference at 1440
- [ ] Trail never blocks clicks on the button (stickers are `pointer-events: none`)
- [ ] No memory growth after a minute of wild mouse movement (nodes are removed)
- [ ] No reference sticker is referenced outside `/_ref/`, and the register lists all of them
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
