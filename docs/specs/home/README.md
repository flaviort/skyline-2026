# Homepage

Overview of the Skyline homepage in build order. Detailed specs: [01](01-banner.md), [02](02-logos.md), [03](03-agency.md), [04](04-recent-projects.md), [05](05-what-we-do.md), [06](06-brands-launched.md), [07](07-contact-cta.md), [08](08-footer.md), [09](09-menu.md), [10](10-mobile.md), [11](11-page-transitions.md). Each part has its own detailed spec in this folder (`01-banner.md` to `11-page-transitions.md`); this file is the map and holds the direction contract. Layout, spacing and motion follow `docs/REFERENCE.md`; words and media come from `docs/CONTENT.md`.

## Direction contract

- **THESIS:** A Dallas agency that grows brands like a space mission, told in the reference's grammar: centered stacks of heavy grotesk caps where one line drops to a hairline weight, on a black ground (changed from white after the first review). It refuses the old site's dark-starfield 3D look and the agency default of hero plus stats plus icon cards.
- **OWN-WORLD:** Ink `#101010` ground with off-white `#f4f4f4` text, international orange `#ff4f00` for the logo, arrow chips and primary buttons. One typeface: Inter Tight bold caps at 0.8 leading against a hairline accent line of the same family. Media always sits in thick solid color frames, tilted a few degrees. Sticker-style mission patches. Nova, the white-suited astronaut, floats through the banner as a live 3D character and shows up in stickers.
- **STORY:** The visitor learns Skyline is a full-service growth agency in Dallas, sees brands it has worked with, sees real projects stacked in front of them, grasps the three service pillars, and starts a conversation.
- **FIRST VIEWPORT:** Logo mark top-left, centered white pill nav, Contact button top-right. Centered serif lead in two lines at about 36px. Headline "WE GROW / BRANDS / ASTRONOMICALLY" at 144px on a 1440 screen, last line in the serif. "Discover more" squiggle link with an orange arrow chip. Client logo marquee on the bottom edge. A 3D Nova floats in from the top or a side and keeps floating around the screen: wandering when idle, gently following the mouse with his whole body, pulling the odd backflip, staying clear of links. Primary action: Contact in the nav.
- **FORM:** Brief-pinned: the user asked for the extrafazant.nl homepage layout, rebuilt for Skyline. No concept roll was run.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Page order vs build order

Top to bottom the page reads: menu, banner, logos, agency/about, recent projects, what we do, part 6 collage, contact CTA, footer. The build order in `docs/PLAN.md` follows the same sequence, with the menu, mobile pass and page transitions last.

## Parts

### 1. Banner (light, 100vh)
- Serif lead, two lines, centered.
- Headline: two grotesk caps lines and a serif line, 144px at 1440 (`heading-xxl`). Masked SplitText reveal on load; letter weight rises near the cursor.
- "Discover more" squiggle link scrolls to the agency section.
- Nova in 3D (D14): the rigged model from Skyline's 3D designer, rendered with three.js on a page-wide layer, replaces the reference's cursor card. He floats in from the top or a side, wanders the banner when idle, gently follows the mouse with his whole body (lean, look, trailing limbs, springy antenna), does idle tricks (backflips, rolls, spins, a wave), drifts aside over links, and floats out of the screen as you scroll down.
- Leaves room at the bottom edge for part 2.

### 2. Logos
- Client logo marquee along the bottom of the banner viewport, single-color ink, infinite loop.
- Speed and direction follow scroll direction.
- Logos from the user; the 6 case clients are the minimum set.

### 3. Agency / about (light, about 765px)
- Left: two or three tilted polaroid-style office photos plus a sticker. Hovering a photo brings it forward and the others make room.
- Right: serif lead, two-line headline (caps then serif), short paragraph about the agency, "More about us" button.
- No team content.

### 4. Recent projects (dark, pinned, about 3000px)
- Serif lead plus "RECENT WORK" (WORK in serif).
- Pinned stack of project cards from the 6 real cases: each card a framed still (video where one exists), frame color from the project's own brand color, client name in heavy caps over the lower third. Cards rise and stack while scrolling.
- "See all work" button pinned under the stack.
- Cursor marquee pill with the project subtitle follows the pointer over a card.
- Rotating "THIS IS HOW WE ORBIT" badge bottom-right.

### 5. What we do (light, about 920px)
- "WHAT WE DO" (DO in serif).
- Three tilted framed cards: STRATEGY, DESIGN, SOCIAL, each with a still (video on hover if available), the title in heavy caps and a one-line serif description. Same hover-to-focus behavior as the agency collage.
- "Discover more" squiggle link.

### 6. Brands we've launched, growing into Nova was here (light, tall)
- Same structure as the reference team section: round sticker plus headline, scattered images at several depths with parallax, hand-lettered labels, loose stickers pushed by pointer velocity, a closing link.
- Launch version (A): project images from the 6 cases, each labeled with the client's name in hand lettering.
- Over time (B): images get swapped one by one for Nova placed in each client's world, same labels, same layout. The component takes a list of items, so the swap is a content change.

### 7. Contact CTA (dark)
- "READY FOR / LIFTOFF?" (LIFTOFF in serif), one line of copy, "Start your mission" button.
- Stickers trail the mouse across the block. Reference stickers as dev-only placeholders first; replaced later with Skyline's own astronaut-themed stickers and internal jokes.

### 8. Footer (dark, continues the CTA band)
- Large Skyline wordmark left; columns Navigation, Contact, Socials; bottom bar with copyright, privacy and terms; scroll-to-top button.
- Nova's goodbye: at the bottom of the page the same Nova rises from the bottom middle of the screen, upper half only, looks at the user and the mouse, and waves goodbye. The footer keeps the bottom middle clear for him.

### 9. Menu
- Fixed, 64px at 1440. Skyline S mark top-left in orange, white over dark bands. Centered white pill: ABOUT, WORK, SERVICES at 12px uppercase 500. CONTACT button top-right.
- Custom cursors if D5 lands on yes.

### 10. Mobile
- Every part below 992px: toggle menu with a full-screen panel, stacked agency section, unpinned project stack, swipeable service cards, lighter part 6 scatter, cursor effects off (stickers and cards appear on tap or scroll instead where it helps).

### 11. Page transitions
- First load: short intro (logo mark, then headline lines rise).
- Route changes: a thick hand-drawn stroke scribbles across and covers the screen, then unwinds to reveal the next page (custom GSAP overlay, replacing the reference's Barba setup).

## Acceptance checks (whole page)

- At 1440x900 the first viewport matches the reference's composition within a few pixels once content is swapped.
- Lighthouse desktop: Performance 90+, Accessibility 100, CLS under 0.05.
- Reduced motion shows every part complete, with no pinning or scroll-jacking.
- Keyboard reaches every link and button with visible focus; hover-only effects have a static or tap path.
- No file from `public/_ref/` referenced anywhere on the production build.
