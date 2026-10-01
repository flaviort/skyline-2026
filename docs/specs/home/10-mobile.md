# Part 10: Mobile

Status: spec
Approved by / date:

A full pass over parts 01 to 09 below 992px. Parts 01 to 09 only have to avoid breaking on small screens; this part makes them good. Run with `/impeccable adapt`.

## Reference behavior

Breakpoints: 991, 767 and 479px. The fluid scale switches to a new ideal canvas at each one (see `docs/REFERENCE.md` section 1), so type and spacing stay proportional instead of shrinking forever.

| Pattern | Rule in the reference |
|---|---|
| Pointer effects (cursor card, weight hover, sticker trail, cursor marquee, momentum hover) | Off on touch and coarse pointers; the cursor card also needs at least 992px (Skyline: the same rules apply to Nova following the pointer) |
| Featured stack pin | Only at 992px and up; below that the cards sit in normal flow |
| Focus collage | Tap to focus, tap outside to reset |
| Parallax | Distance x0.5 on tablet, x0.3 on phones |
| Marquee speed | x0.5 under 991px, x0.25 under 479px |
| Menu | Pill replaced by a toggle and a slide-down panel at 479px and under |
| Heading sizes | Per-breakpoint scale: `heading-xxl` 12 / 6.5 / 5 / 4rem, and so on (`globals.css`) |

## Skyline version, part by part

| Part | Below 992px |
|---|---|
| 01 Banner | Headline stack scales with the tablet and phone scale; ASTRONOMICALLY must fit one line at 360px (drop to `heading-xl` sizing if it does not). Lead stays 2 lines. Nova stays, smaller, without pointer following: he floats in, wanders around the stack, does tricks and floats out on scroll; a tap near him can trigger a trick. Low-power devices or no WebGL get the still pose. |
| 02 Logos | Slot size scales down; loop speed per the reference factors |
| 03 Agency | Stack: collage on top (scaled to fit the width, same tilts), text below, left-aligned heading stays centered like desktop |
| 04 Recent projects | No pin. Cards full width in a column, frames and titles kept, 1rem gap. Badge stays, rotates with scroll. |
| 05 What we do | Cards become a horizontal swipe row with scroll snap, one and a bit cards visible, tilts kept |
| 06 Brands launched | Zigzag becomes two staggered columns, items at about 45% width; parallax x0.3; lettering scales with the item |
| 07 Contact CTA | No trail. Two or three stickers placed statically around the heading so the block keeps its personality |
| 08 Footer | Wordmark on top, then the three columns stacked, bottom bar stacked with a clear middle for Nova's goodbye (smaller peek, same wave) |
| 09 Menu | Toggle under 768px; full-screen panel with large caps links, contact details and socials at the bottom |

## Checks

- Widths: 991, 768, 767, 480, 479, 390, 360.
- Real devices where possible: an iPhone (Safari) and an Android phone (Chrome). Check the `100svh` banner with the browser bars in both states.
- Touch targets at least 44px. No horizontal scroll at any width.
- Reference comparison: capture the reference at 390 and 768 at the start of this part and compare side by side.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| All from parts 01 to 09 | extend | responsive props only where a rule above needs one (for example `FeaturedStack` `pinFrom`, `Parallax` `scale`) | No mobile copies of components |
| `SwipeRow` | new | `snap`, `peek` | Used by part 05, reusable for galleries on internal pages |

## Acceptance

- [ ] Every part checked at every width in the list, screenshots in `.impeccable/review/`
- [ ] No horizontal scroll, no clipped text, no overlapping controls
- [ ] Nova still appears on phones
- [ ] Lighthouse mobile: Performance 85+, Accessibility 100, CLS under 0.05
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
