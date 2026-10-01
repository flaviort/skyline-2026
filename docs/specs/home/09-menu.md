# Part 09: Menu

Status: spec
Approved by / date:

The fixed header: logo, a small white pill of links in the center, and the Contact button. It flips to light over dark bands. The full-screen mobile panel is specced here and polished in part 10.

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

- Logo: Skyline S mark (`public/brand/logo-mark.svg`) in orange; the wordmark appears on wider screens if it fits the 10rem slot (checked in build).
- Pill links: ABOUT, WORK, SERVICES. Contact button: CONTACT.
- Squiggles and the Contact button hover in orange.
- Custom cursors (D5 / Q5, approved): yes, the same set and behavior as the reference: five SVG cursors (default, text, pointer, grab, grabbing) applied site-wide through CSS, with `data-cursor` overrides. The reference's cursor files are used as dev-only placeholders (`public/_ref/cursors/`, in the register) until Skyline's own versions are drawn in the same style.
- Mobile toggle breakpoint: under 768px (Q6, approved; Skyline's menu will carry a bit more than the reference's).

## Content

- `src/content/site.ts` (`nav`, `contactCta`)

## Assets

| Asset | Source | Status |
|---|---|---|
| S mark SVG | `public/brand/logo-mark.svg` | On hand |
| Cursor SVGs (5): default, text, pointer, grab, grabbing | Placeholders from the reference in `public/_ref/cursors/`, then Skyline's own | Placeholder first |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Theme flip | a dark band passes under the bar | Logo color switches instantly (no fade), matching the reference | instant |
| Link squiggle | hover; always on for the current page | Draws in, out on leave | `power2.inOut`, 0.5s |
| Contact button | hover | Grows by a few px in width and height, dots animate, label rolls up to its copy | CSS, spring curve |
| Mobile panel open | toggle | Background and panel slide from `yPercent: -100` to 0 (panel 0.05s later); links rise from `yPercent: 40` and fade in, 0.05s apart, starting at 0.25s; bars rotate into an X (±45deg); smooth scroll pauses; logo turns light | `power3.inOut`, 0.6s; links `power3.out`, 0.5s |
| Mobile panel close | toggle, a link, or Escape | Reverse of the open timeline at 1.4x speed; logo returns 350ms later | |

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Menu` | new, layout | content from `site.ts` | Root layout; watches `Section` `navTheme` via ScrollTrigger |
| `NavPill` | new | `links`, `current` | Uses `DrawLineLink` with `variant="menu"` |
| `PillButton` | new | `href`, `label`, `grow` | Port of the reference's growing pill button; reused wherever a small pill CTA is needed |
| `MobileMenu` | new | `links`, `open`, `onClose` | Focus trapped while open, returns focus to the toggle |
| `IconButton` | reuse | | The toggle |
| `CustomCursor` | new | `data-cursor` values: `default`, `text`, `pointer`, `grab`, `grabbing` | Global CSS, no JS; hotspots set per cursor |

## Acceptance

- [ ] Bar, logo, pill and button positions match the reference at 1440
- [ ] Logo flips exactly at the dark bands' edges, both scrolling down and up
- [ ] Current page is marked visually and with `aria-current`
- [ ] Mobile panel: focus trap, Escape closes, scroll locked while open
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
