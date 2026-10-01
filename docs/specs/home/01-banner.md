# Part 01: Banner

Status: review
Approved by / date: spec approved by the user, 2026-10-01

The first viewport: serif lead, the big type stack, a "Discover more" link, and a 3D Nova who lives on the screen: he floats in, wanders around, follows the mouse, does the odd trick, and floats away when you scroll. He replaces the reference's cursor-following media card (decision D14). His goodbye at the bottom of the page is built with the footer (part 08), on the same Nova. The logo marquee on the bottom edge is part 02.

## Reference

Measured at 1440x900 (root font 12px, so 1rem = 12px at this width).

| Element | Position / size | Style |
|---|---|---|
| Section | full viewport, `100svh` | light theme, ground `#f4f4f4` |
| Serif lead | centered, top about 240px, box 288 x 72 | 2 lines, 36px (3rem), leading 1, serif |
| Headline | centered, starts about 335px | `heading-xxl`: 144px (12rem), leading 0.8, tracking -0.02em, uppercase; grotesk 700 lines, last line in the serif at 300 |
| Link | centered, top about 592px | serif 21px (1.75rem), 93px of text plus a 1.5rem arrow chip in the accent; squiggle box 13px tall directly under the text |
| Logo band | bottom 132px of the viewport | part 02 |
| Cursor card (replaced by Nova) | 192 x 192 (16rem) | no frame, no radius; inner media layer 230 x 230 (120%) clipped by the card |

The reference headline runs four lines ("BRENGT / JE / MERK IN / BEWEGING"). The block is vertically centered in the space above the logo band.

What we keep from the reference card is its feel: the follower trails the pointer with a soft 1s lag, banks with horizontal speed, settles when the pointer stops, and gets out of the way of links. Nova goes further: he is a character with his own life on the screen, not a cursor accessory.

## Skyline version

- Same composition, three headline lines instead of four: WE GROW / BRANDS / ASTRONOMICALLY. The block is re-centered so the stack sits optically in the middle of the space between the menu and the logo band.
- ASTRONOMICALLY in the serif fits about 1000px wide at 1440, checked in the scaffold, so no line breaks inside it at desktop sizes.
- Link squiggle and chip use international orange; the chip's arrow is ink (Q17). The chip points down and the link scrolls to part 03 through Lenis.
- **Nova in 3D** lives in the banner instead of the media card. He is a rigged model from Skyline's 3D designer, rendered live with three.js. Behavior and details in the "Nova 3D" section below.
- With no reference media in the banner, this part needs no placeholders from `public/_ref/`.
- The menu (part 09) does not exist yet when this part is reviewed; the top 64px stay clear for it.

## Nova 3D

**Stack.** three.js through React Three Fiber (`@react-three/fiber`) with `@react-three/drei` helpers (`useGLTF`, `useAnimations`). R3F keeps Nova a normal React component in our library, so the banner, the 404 page and later pages reuse the same piece. Plain three.js would work too, but would need its own lifecycle code that R3F already handles. GSAP still drives the timed moves (entrance, tricks, avoid, scroll-out) so motion stays in one system; the continuous follow and per-bone springs run in the render loop.

**Rendering.**
- One transparent, fixed, full-viewport `<canvas>` above the page content, `pointer-events: none`, so text and links stay fully usable underneath. It belongs to the page, not to the banner, so the same Nova can float in at the top and wave goodbye at the bottom without loading twice.
- Loaded after the page is interactive (`next/dynamic` with `ssr: false`). Nothing is shown in his place while loading; he simply makes his entrance once the model is ready (the banner is complete without him).
- Device pixel ratio capped at 2; antialiasing on; soft studio lighting from a small local HDR plus one key light, tuned to the white ground. No hard shadow (he's in zero-g); at most a very soft contact glow.
- Frame loop runs only while Nova is on screen (banner or goodbye) and the tab is visible; in between, the canvas renders nothing.

**Scale.** About the height of two headline lines (roughly 240 to 300px at 1440). Nova renders in front of the text; since he drifts away from links and buttons, he never blocks anything clickable. Final size is tuned in the browser.

**Behavior.** Nova is one character with four states, driven by scroll position:

1. **Entrance.** After the headline reveal he comes from far away in the top-right corner (scale 0) and flies head first, like a flying hero (level, arms tight along his body, legs together and trailing, head up), down to the bottom middle of the banner, **behind the text**. There he pulls up, comes **in front of everything** and front-flips up to the middle of the banner, coming close to the screen at the top of the arc (2.2 times his size) and settling at his normal size, then waves hello. The layer switch is a z-index change on Nova's canvas (1 behind the banner text, which sits at z-2; 40 in front). Tricks, following and wandering start after the wave; clicks do nothing until then. While floating afterwards he drifts very slightly toward and away from the screen (scale within 4%).
2. **Floating in the banner.** He never leaves the screen while the banner is in view.
   - *Idle (pointer still or away):* he wanders around the banner on a slow, smooth path (noise-driven drift within safe margins that keep him on screen and clear of the menu and the logo band), turning to look around.
   - *Pointer moving:* he gently drifts after the mouse with a soft lag, never snapping to it. His whole body reacts, not just his position: the spine leans toward the pointer, the upper spine (his "head") turns to look at it, he banks with the pointer's speed, the arms and legs trail behind the motion, and the antenna springs and wobbles.
   - *Tricks:* every few seconds he performs a trick, then goes back to floating, whether the pointer is moving or not. Set of tricks: backflip, frontflip, barrel roll, a slow spin, a stretch, a look around, a little wave. One at a time, random order, never the same twice in a row, the first about 1.5 seconds after he arrives, then a gap of 1.8 to 4 seconds after each one.
   - *Click:* a click anywhere that is not a link, button or form field makes him play a random trick at once, cutting short the one in progress.
   - *Beacon:* the antenna tip blinks every 2.4 seconds and sends out a radio wave (two red rings that expand and fade).
   - *Links and buttons:* when the pointer reaches one, he drifts aside so he never covers it.
3. **Leaving.** As the user scrolls down, he floats up and out of the screen with the scroll (scrubbed, so scrolling back up brings him back in the same way). Once the banner is gone, he is gone.
4. **Goodbye (bottom of the page).** When the user reaches the bottom, he rises from the bottom middle of the screen, showing only his upper half (visor and chest), looks at the user and follows the mouse with his gaze, and waves goodbye with one arm. Specced and built with the footer (part 08), on this same Nova.

**Pipeline.**
1. Source file into `assets/3d/nova/` (kept out of `public/`; large sources stay gitignored and are listed in `docs/CONTENT.md`).
2. Inspect: bone names, existing animation clips, polycount, textures, scale and orientation.
3. Export to `.glb` and optimize with `gltf-transform` (Meshopt compression, texture resize to what the on-screen size needs, KTX2 or WebP) into `public/models/nova.glb`.
4. Render the poster PNG from the same camera.

**What the file gives us** (inspected 2026-10-01, details in `docs/NOVA-3D.md`). A 25-bone rig with no animation clips and no textures. There is no separate head bone: the visor sits on `Spine.02` and `Spine.03`, so the look-at turns the upper spine. The antenna has its own 3-bone chain, which we use for a springy lag when Nova moves. Some parts (zipper, flags, a backpack detail, the antenna chain) are not attached to the spine yet; the fix list has gone to the designer, and parts 1 to 4 of it can be patched in code if the new file is late. If the designer adds clips (`Idle_Float`, `Wave`, tricks such as `Backflip`), they replace the procedural versions. Either way the behavior in the Motion table is the same.

## Content

- Lead: Strategy, brands and websites / made in Dallas, TX
- Headline: WE GROW / BRANDS / *ASTRONOMICALLY* (italic = serif)
- Link: Discover more, target `#agency`
- Source: `src/content/home.ts` (`banner`)

## Assets

| Asset | Source | Status |
|---|---|---|
| Nova 3D source file with skeleton | Skyline's 3D designer | Received 2026-10-01 and inspected: `assets/3d/nova/Astronalt_09_Rig_Website.glb`. Rig fixes requested, see `docs/NOVA-3D.md` |
| Nova web model: optimized `.glb` with Meshopt | Optimized from the source | Tested: 149 KB (about 93 KB gzipped), well under the 1.5 MB budget; no textures to compress |
| Nova still pose: transparent PNG, for reduced motion and no-WebGL | Rendered from the model | To produce (the legacy `nova.png` works until then) |
| Studio lighting: small local HDR environment | Bundled, no CDN | To produce |
| Squiggle SVGs (6 hand-drawn variants) | Authored for Skyline, same idea as the reference: one stroke, 310 x 40 viewBox, round caps | To produce |

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|
| Serif lead, headline | first load, after the page transition reveal (part 11) | Split by lines (lead) and chars (headline), masked; each piece rises from `yPercent: 135` to 0 | `expo.out`, 1s; lines stagger 0.07s; chars stagger 0.0175s; group stagger 0.12s between the lead and the headline |
| Headline letters | pointer moves anywhere on the page, after the reveal finishes | Each char's weight follows distance to the pointer within a 400px radius: grotesk 700 at rest down to 200 when close; serif 300 at rest up to 800 when close | `quickTo` on the weight, 0.4s `power2.out`; skipped on touch and reduced motion |
| Link underline | hover | A random squiggle (cycled from 6 variants) draws in 0% to 100%; on leave it draws out from the start | `power2.inOut`, 0.5s both ways |
| Nova entrance | after the headline reveal, once the model is loaded | Flies head first from the top-right corner (scale 0) to the bottom middle behind the text; pulls up, comes in front, front-flips to the middle (up to 2.2x, back to 1x); waves hello | flight 2.1s, flip 1.5s, wave 1.6s; about 5.3s in all |
| Nova float | always while in the banner | Zero-g bob and sway on the root, arms and legs drifting slightly (procedural, or the `Idle_Float` clip if the designer sends one) | looping |
| Nova wander | pointer idle or outside the window | Slow noise-driven path around the banner inside safe margins; turns toward the direction he drifts | continuous, slow |
| Nova follow | pointer moves | Drifts after the pointer with a soft lag (spring, comparable to the reference's 1s `power4` follow); banks with horizontal speed, pitches with vertical speed | damped spring; tilt settles about 66ms after the pointer stops |
| Nova body | pointer moves | Spine leans toward the pointer; `Spine.02` and `Spine.03` turn to look at it (clamped); arms and legs lag behind the motion; antenna chain springs | per-bone damped springs |
| Nova tricks | every few seconds, pointer moving or not; at once on a click outside links and controls | One of: backflip, frontflip, barrel roll, slow spin, stretch, look around, small wave; random, no repeats in a row, 1.8 to 4s apart | each trick about 1.2 to 2s, eased in and out of the float; a click cuts the current one short smoothly |
| Nova beacon | always | Antenna tip flashes, a soft halo pulses and two rings expand and fade | every 2.4s, wave 1.2s |
| Nova avoid | pointer over a link or button | Drifts aside so the control is never covered | 0.4s |
| Nova leave | scrolling down past the banner | Floats up and out with the scroll | scrubbed to scroll; reverses when scrolling back up |
| Nova render | Nova off screen | Frame loop stops | |

Reduced motion: text shows immediately, no weight effect; Nova appears as a still pose (poster) in the banner, no wandering, no tricks, no scroll animation. Touch or screens under 992px: no pointer follow and no weight effect; Nova still floats in, wanders, does tricks and leaves on scroll (part 10 tunes size and paths for phones).

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|
| `Section` | new | `theme`, `id`, `className` | Sets `data-theme`; used by every part |
| `Lead` | new | `lines`, `size` | |
| `Heading` | new | `as`, `size`, `lines: { text, serif? }[]`, `reveal`, `weightHover` | The grotesk plus serif stack in one component |
| `TextReveal` | new | `split`, `trigger`, `stagger`, `delay`, `groupStagger` | Uses SplitText `autoSplit`; fires a `revealdone` callback that `WeightHover` waits for |
| `WeightHover` | new | `rest`, `near`, `radius` | Defaults per font: sans 700 / 200 / 400, serif 300 / 800 / 400 |
| `DrawLineLink` | new | `href`, `label`, `color`, `chip`, `persist`, `always` | Squiggle variants shared through one module |
| `ArrowChip` | new | `color`, `direction`, `size` | |
| `NovaLayer` | new | `scenes` (which states the page uses and their scroll triggers: `banner`, `goodbye`), `avoid` (selector, default `a, button`), `bounds` | Fixed full-viewport canvas for the whole page; one instance of Nova that moves between states. Reused on the 404 page with only the floating state |
| `Nova` | new | `state`, `target` (pointer or path), `lookAt`, `trick` | The model: loads the `.glb`, drives bones (lean, look, limb lag, antenna spring), plays clips or procedural tricks |
| `novaTricks` | new, module | | Procedural trick timelines (backflip, frontflip, barrel roll, spin, stretch, look around, wave); swapped for designer clips when they exist |
| `Media` | new | `src`, `video`, `poster`, `play`, `sizes` | |
| `usePointer`, `useFinePointer`, `useReducedMotion` | new hooks | | Shared by every pointer effect |

Every new component gets a `/lab` entry before the banner is composed.

### Review round 1 (2026-10-01)

User feedback and what changed:
- Accent font: the narrow serif is not liked. Options rendered in `/lab` (sans-only and five serifs); the user picked sans only: the accent line is Inter Tight at weight 150 (thickening to 700 near the cursor), and the serif is removed site-wide (D15). `Lead` became `Lead`.
- Background: dark, and the whole site follows (D16). Light stays available as a section theme.
- Nova stays in front of the headline (Q26).
- Nova: about 45% bigger (around 385px tall at 1440; at least 210px on phones).
- Nova "needs more life": layered procedural motion now runs on every limb. Whole-body drift (roll, pitch, turn), breathing, a curious head when idle, arms floating with soft elbows and hands, an alternating swim kick with knees, limbs trailing behind his motion, and a tuck during flips. Motion uses non-repeating noise (three sines at unrelated speeds). Arms stay low because the suit hoses stretch when they swing forward or up.
- Rig fixes needed for this, patched in code: feet re-attached to the legs, backpack leg weights moved to the spine, and the missing right hand rebuilt as a mirror of the left (see `docs/NOVA-3D.md`).

### Review round 2 (2026-10-01)

- Weight effect "jumps": two causes fixed. The headline shrink-wrapped its text, so weight changes changed its width and SplitText re-split, resetting every letter; headings and leads are now full width. The effect also used the pointer's page position from the last mouse event, which went stale while scrolling or while Nova moved under a still mouse; it now uses the live viewport position plus scroll. Accent lines are fitted at a partly thickened weight so hover can never push them past the screen. Verified with a scripted mouse sweep: no re-splits, no overflow, smooth weight changes.
- Nova motion: every bone channel now runs through a damped spring (lag and overshoot), limbs react to acceleration as well as speed (follow-through), the float and wander are larger and quicker, a slow body turn shows his side now and then, arms do a lazy alternating stroke, legs a fuller swim kick, tricks every 6 to 11 seconds.
- Nova look, matched to the old about-page render: a generated studio environment (dark sky, warm horizon band, a sun glint behind the viewer, blue and magenta rim panels) plus matching rim lights; glossy white suit that only lightly reflects the environment, dark mirror visor that shows the horizon and glint, dark gloves, black zipper, hoses and seams, glowing red antenna tip. All in `src/components/three/nova-look.ts`.
- Bounds widened so his arms never leave the screen at the larger size.

### Built (2026-10-01)

| Planned | Built as | Note |
|---|---|---|
| `Section`, `Lead`, `Heading`, `DrawLineLink`, `ArrowChip` | same names | `Heading` and `Lead` fit their column (`useFitText`) so long words never overflow small screens |
| `TextReveal`, `WeightHover` | one hook, `useKineticText` | One split drives both effects |
| `Icon` | `Icon` | Legacy SVG paths, one arrow rotated for every direction |
| `NovaLayer`, `Nova`, `novaTricks` | `NovaLayer`, `nova-stage.tsx`, `nova-rig.ts`, `nova-tricks.ts` | Rig patches run only when the file needs them |
| `Media` | not built yet | Nothing in the banner needs it now that Nova replaced the media card; arrives with part 03 |
| `usePointer`, `useFinePointer`, `useReducedMotion` | `lib/pointer.ts`, `lib/hooks/use-media-query.ts` | Shared pointer store, no React re-renders |

## Acceptance

- [ ] At 1440x900 the stack sits where the reference's does, with the lead, headline and link spacing matching within a few pixels
- [ ] ASTRONOMICALLY never wraps at 1280 to 1920
- [ ] Weight effect runs smoothly (no layout shift, no dropped frames) with the pointer moving fast across the headline
- [ ] Nova never covers the link: he moves aside when the pointer reaches it
- [ ] Nova never leaves the screen while the banner is in view, and never sits on the menu or the logo band
- [ ] Following feels gentle: no snapping, no jitter, the whole body reacts
- [ ] Tricks look natural, start and end in the float, play while the pointer moves, and a click starts one
- [ ] Scrolling down floats him out; scrolling back up floats him back in the same way
- [ ] Nova loads after the text (no effect on LCP); the banner is complete and readable before he arrives
- [ ] 60fps on a mid-range laptop with the pointer moving; nothing renders while he is off screen
- [ ] The still pose shows when WebGL is unavailable or reduced motion is on
- [ ] Model weight within budget (under 1.5 MB) and three.js only loaded on pages that use Nova
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work (link is focusable and visibly focused)
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
