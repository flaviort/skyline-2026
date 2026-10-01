# Content and assets

Copy deck, project inventory, asset checklist and the placeholder register. Copy is **approved** (2026-09-25) except where marked new. English only. Facts come from the legacy site and the old WordPress project data; nothing here invents clients, numbers or quotes.

The reference opens most sections with a two-line sentence above the headline (a serif in the reference, Inter Tight here). We keep that rhythm but always write a real sentence there, never a one-word label. *Italic = the thin accent line (Inter Tight hairline weight; the site is sans only since 2026-10-01).*

## Copy deck, in build order

**1. Banner**
- Lead: Strategy, brands and websites / made in Dallas, TX
- Headline: WE GROW / BRANDS / *ASTRONOMICALLY*
- Link: Discover more

**2. Logos**
- No copy. Accessible label: "Brands we've worked with".

**3. Agency / about**
- Lead: Seasoned pros and sharp new minds, / one crew
- Headline: THE CREW / *BEHIND SKYLINE*
- Body: No bloated agency process. We're a tight crew of industry veterans and forward-thinking strategists who move fast, think with you and say it straight. We've been launching brands and multimillion-dollar portfolios for over ten years.
- Button: More about us

**4. Recent projects**
- Lead: Hard to miss, easy to share. / A few missions we flew lately.
- Headline: RECENT *WORK*
- Cards: from the project inventory below
- Button: See all work
- Badge: THIS IS HOW WE ORBIT

**5. What we do**
- Headline: WHAT WE *DO*
- STRATEGY: Digital strategy and SEO that aim the rocket somewhere worth going.
- DESIGN: Branding, UX and websites people actually remember.
- SOCIAL: Social campaigns, content and video that keep people watching and coming back. (the third pillar was renamed from Growth to Social on 2026-10-01)
- Link: Discover more

**6. Brands we've launched** (new copy, to confirm in the part 6 spec)
- Headline: BRANDS WE'VE / *LAUNCHED*
- Labels: client names in hand lettering (Airly, Dymatize, Think Apollo, Barker Wellness, Sophie Brussaux, Andrew Callaghan)
- Stickers: Less talk, more launches / Dallas, TX / Houston, we have a brand
- Link: See all work
- Later, as Nova art replaces the project images, the headline can switch to NOVA WAS / *HERE*.

**7. Contact CTA**
- Headline: READY FOR / *LIFTOFF?*
- Line: Tell us where you want to go. We'll plot the route.
- Button: Start your mission

**8. Footer**
- Navigation: About, Work, Services, FAQ, Contact
- Contact: 1529 Dragon St, Dallas, TX 75207 / accounts@theskylineagency.com / +1-972-861-0416
- Socials: Instagram, LinkedIn, Behance, Facebook, X
- Bottom bar: 2026 The Skyline Agency LLC / Privacy / Terms

**9. Menu:** ABOUT, WORK, SERVICES, CONTACT

## Project inventory

Pulled read-only from the old WordPress endpoint on 2026-09-25. Each project also has about 12 content blocks (text, grids, sliders, marquees, full-screen images) for the case pages later.

| Project | Subtitle | Industry | Year | Services | Color | Media |
|---|---|---|---|---|---|---|
| Andrew Callaghan | Digital journalism experience | Entertainment | 2023 | Video, Website | `#fad7b1` | few stills, video |
| Barker Wellness | Vegan wellness company | CBD | 2023 | 3D, Website | `#d3d3d3` | ~19 stills, video |
| Airly | Climate friendly snacking | Food | 2021 | 3D, Photography, Social, Website | `#97d0de` | ~19 stills, video |
| Sophie Brussaux | Impactful art for social change | Art | 2021 | Website | `#e9f4f6` | ~14 stills |
| Think Apollo | Higher than you've ever been | CBD | 2020 | 3D, Photography, Social, Website | `#0d151c` | ~18 stills, video |
| Dymatize | World Class Athletic Nutrition | Fitness, Supplement | 2017 | 3D, Advertising, Photography, Social, Video, Website | `#333e4e` | ~26 stills, video |

Video counts are rough (the export will confirm). The homepage stack uses 4 or 5 of these; the user picks which and in what order when part 4 starts.

## Assets

| Asset | Used in | Source | Status |
|---|---|---|---|
| Skyline wordmark and S mark (SVG) | Menu, footer, favicon | `public/brand/` (legacy) | On hand |
| Nova render (PNG, transparent) | Stickers, banner poster until the model loads | `public/images/legacy/nova.png` | On hand, 932x1289 |
| Nova 3D source file, rigged | Banner, 404 page | Skyline's 3D designer | Received 2026-10-01 (`assets/3d/nova/`, gitignored); rig fixes and optional clips requested, see `docs/NOVA-3D.md` |
| Nova web model, optimized `.glb` | Banner, 404 page | Optimized from the source in part 01 | Tested at 149 KB |
| Office photos (3) | Agency / about | `public/images/legacy/agency-0*.jpg` | On hand; more would help part 6 option C |
| Client logos (SVG preferred) | Logos marquee | User | Waiting; ask the user when part 02 starts |
| Project stills and videos | Recent projects, part 6, footer | Old WordPress export | Export during part 4 |
| Service card media (3) | What we do | Cut from project work or produced | Decide in part 5 |
| Skyline stickers (astronaut theme, internal jokes) | Contact CTA, agency, part 6 | Authored SVG | Later; reference stickers as placeholders first |
| Hand-lettered labels | Part 6 | Authored SVG | Part 6 |
| Custom cursors (4) | Global | Authored SVG | If D5 is yes |
| Legacy reel (17 MB MP4) | Recent projects or banner | `skyline-2023/assets/videos/skyline-reel.mp4` | Needs trim and re-encode |
| OG image 1200x630 | Metadata | From the final banner | Later |

Every generated or edited raster keeps its provenance: the generation prompt or source embedded in the file (impeccable `embed-prompt`).

## Placeholder register

Anything taken from extrafazant.nl for development. These files live only in `public/_ref/` (gitignored) and must all be replaced before launch.

| File | Used in | Replace with | Status |
|---|---|---|---|
| Cursor SVGs (5) | Global cursors (part 09) | Skyline cursors drawn in the same style | Planned |
| Sticker SVGs (6) | Contact CTA sticker trail (part 07) | Skyline astronaut stickers and internal jokes | Planned |

Temporary stock photos (not from the reference) live in `public/images/placeholder/` and are listed here too when added: about page office scatter (Q12).
