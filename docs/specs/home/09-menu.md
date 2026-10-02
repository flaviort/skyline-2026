# Part 09: Menu

Status: review (built 2026-10-02)
Approved by / date:

The fixed header: logo, a small white pill of links in the center, and the Contact button. The full-screen mobile panel is specced here and polished in part 10.

Order note (2026-10-02): built ahead of parts 02 to 08 at the user's request, while part 01 stays in review.

## Reference

Measured at 1440x900.

| Element | Position / size | Style |
|---|---|---|
| Bar | fixed, full width, 64px tall, padding 12px 24px 0 (1rem 2rem 0) | transparent, no border or shadow |
| Logo | left, 120 x 52 (10rem wide) | script logo in the brand accent; turns white over dark bands |
| Link pill | centered, 182 x 36 (3rem tall) | white background, no radius, padding 7px 15px; links 12px grotesk uppercase 500, 18px apart |
| Link underline | 8px box under each link | tiny squiggle in the accent on hover and on the current page |
| Contact button | right, 74 x 30 | pill that grows a few px wider and taller on hover, with a small dot animation; label rolls to a second copy |

Over a dark band (`data-nav-theme="dark"`) the logo turns white while the pill and button stay white; the switch triggers when the band's top or bottom crosses the bar's height.

Mobile (479px and under in the reference): the pill hides; a toggle with two bars opens a panel that slides down from the top.

## Skyline version

Updated 2026-10-02 for the dark site (D16), sans only (D15), Q19, Q22 and the orange rule (Q17).

- **Bar:** same as the reference: fixed, full width, 64px, transparent, padding 1rem 2rem 0. Sits above everything, Nova included (Nova's canvas is z-40, the bar z-50). Nova already keeps below the bar and steps aside from links and buttons, so he never covers it.
- **Logo:** the "S." mark (`public/brand/logo-mark.svg`), linking home. Mark only, no wordmark (Q19: the wordmark lives in the footer). **White with `mix-blend-mode: difference`** (user, 2026-10-02, replacing orange), so it inverts against what is under it: white on the dark ground, dark over light bands and over Nova. It is its own fixed layer above the bar, because inside the fixed header it could only blend with the header's empty background.
- **Link pill:** black face, off-white text, no radius, padding 7px 15px (decision 1). Links ABOUT, WORK, SERVICES (Q22), Inter Tight 12px uppercase 500, 18px apart.
- **Squiggle under links:** orange, drawn in on hover and always shown on the current page (`aria-current="page"`). Reuses the `DrawLineLink` squiggles.
- **Contact button:** black box, off-white label CONTACT, a small orange dot before it. On hover it grows a few px, the dot spins out as new dots spin in (orange, then off-white), and the label rolls up to its copy. Same behavior as the reference, our own code.
- **Theme flip:** none needed: the blend inverts the logo by itself, and the boxes are always black.
- **Custom cursors (D5 / Q5):** five SVG cursors (default, text, pointer, grab, grabbing) site-wide through CSS with `data-cursor` overrides, same hotspots as the reference (decision 2).
- **Mobile:** under 768px (Q6) the pill hides and a two-bar toggle opens the full-screen panel (motion below). Polished in part 10.

## Decisions (user, 2026-10-02)

1. **The box stays, in black.** Like the reference's white box around the links, but black, always: the link pill and the Contact button are black (`#000`, a step darker than the ink ground) with off-white text. No theme flip at all, so no scroll watcher.
2. **Cursors:** the reference's five cursor SVGs as development placeholders in `public/_ref/cursors/` (gitignored, in the placeholder register), swapped for Skyline's own before launch. They are white with a dark outline, so they read on the dark ground.

## Content

- `src/content/site.ts` (new): `nav` (About `/about`, Work `/work`, Services `/services`), `contactCta` (Contact `/contact`). The pages themselves come later; until then the links point at their future routes.

## Assets

| Asset | Source | Status |
|---|---|---|
| S mark SVG | `public/brand/logo-mark.svg` | On hand |
| Cursor SVGs (5): default, text, pointer, grab, grabbing | Reference placeholders in `public/_ref/cursors/` (downloaded 2026-10-02), then Skyline's own | Placeholder |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Link squiggle | hover; always on for the current page | Draws in, out on leave | `power2.inOut`, 0.5s |
| Contact button | hover | Grows by a few px in width and height, dots animate, label rolls up to its copy | CSS, spring curve |
| Mobile panel open | toggle | Background and panel slide from `yPercent: -100` to 0 (panel 0.05s later); links rise from `yPercent: 40` and fade in, 0.05s apart, starting at 0.25s; bars rotate into an X (±45deg); smooth scroll pauses; logo turns light | `power3.inOut`, 0.6s; links `power3.out`, 0.5s |
| Mobile panel close | toggle, a link, or Escape | Reverse of the open timeline at 1.4x speed; logo returns 350ms later | |

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Menu` | new, layout | content from `site.ts` | Root layout, on every page |
| `NavPill` | new | `links`, `current` | Uses `DrawLineLink` with `variant="menu"` (new prop: 12px uppercase, small squiggle) |
| `PillButton` | new | `href`, `label`, `grow` | Port of the reference's growing pill button; reused wherever a small pill CTA is needed |
| `MobileMenu` | new | `links`, `open`, `onClose` | Focus trapped while open, returns focus to the toggle |
| `IconButton` | reuse | | The toggle |
| `CustomCursor` | new | `data-cursor` values: `default`, `text`, `pointer`, `grab`, `grabbing` | Global CSS, no JS; hotspots set per cursor |

## Acceptance

- [ ] Bar, logo, pill and button positions match the reference at 1440
- [ ] Bar stays above Nova; Nova never covers a menu link
- [ ] Current page is marked visually and with `aria-current`
- [ ] Mobile panel: focus trap, Escape closes, scroll locked while open
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
