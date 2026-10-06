# Specs

One spec per homepage part and per internal page, all written from measurements of the reference (the live page and its animation source) on 2026-09-25. Each spec follows [_TEMPLATE.md](_TEMPLATE.md): reference, Skyline version, content, assets, motion, components, acceptance.

Nothing gets built until its spec is approved. When a part's turn comes, its spec is re-read, adjusted if anything changed, and approved again before code.

## Homepage

Overview and direction contract: [home/README.md](home/README.md)

| # | Spec | Status |
|---|---|---|
| 01 | [Banner](home/01-banner.md) | review |
| 01b | [About, Nova lands](home/01b-about.md) | review (round 2) |
| 02 | [Logos](home/02-logos.md) | spec |
| 03 | [Agency / about](home/03-agency.md) | spec |
| 04 | [Recent projects](home/04-recent-projects.md) | spec |
| 05 | [What we do](home/05-what-we-do.md) | spec |
| 06 | [Brands we've launched](home/06-brands-launched.md) | spec |
| 07 | [Contact CTA](home/07-contact-cta.md) | spec |
| 08 | [Footer](home/08-footer.md) | spec |
| 09 | [Menu](home/09-menu.md) | review |
| 10 | [Mobile](home/10-mobile.md) | spec |
| 11 | [Page transitions](home/11-page-transitions.md) | spec |

## Internal pages

Each page lists its own parts (A1, W1, P1...), approved one at a time like the homepage.

| Page | Spec | Status |
|---|---|---|
| About | [pages/about.md](pages/about.md) | spec |
| Work | [pages/work.md](pages/work.md) | spec |
| Project | [pages/project.md](pages/project.md) | spec |
| Services | [pages/services.md](pages/services.md) | spec |
| Contact | [pages/contact.md](pages/contact.md) | spec |
| FAQ (optional) | [pages/faq.md](pages/faq.md) | spec |
| Privacy and Terms | [pages/legal.md](pages/legal.md) | spec |
| 404 | [pages/not-found.md](pages/not-found.md) | spec |

## Site-wide changes after the first banner review (2026-10-01)

These supersede what older specs say until each spec is re-read before its part is built:
- **Sans only.** Where a spec says "serif" (lead lines, accent lines, link text, descriptions), read Inter Tight: leads at a regular weight, accent lines at the hairline `accent` weight.
- **Dark site.** Where a spec says light ground or light section, the default is now the ink ground with off-white text; the "dark bands" of the reference become the norm, and contrast comes from orange, the frames, Nova and the occasional light section.

## Questions raised by the specs

Collected here so the review can answer them in one pass. Each answer is also written into its spec.

| # | Question | Spec | Answer |
|---|---|---|---|
| Q1 | Which projects go in the homepage stack, in what order? | 04 | **Answered:** Airly, Dymatize, Think Apollo, Barker Wellness, Andrew Callaghan |
| Q2 | Frame colors for the stack | 04 | **Answered:** each project's own brand color, as the reference does (signature brand colors, picked side by side with the covers) |
| Q3 | Media for the service cards | 05 | **Answered:** Strategy: Think Apollo; Design: Airly 3D; Social: Dymatize social. Third pillar renamed from Growth to Social. Animations replace the stills later |
| Q4 | Page transition stroke color | 11 | **Answered:** orange everywhere |
| Q5 | Custom cursors | 09 | **Answered:** yes, same set and behavior as the reference (reference files as placeholders, then Skyline's own) |
| Q6 | Mobile menu breakpoint | 09, 10 | **Answered:** under 768px |
| Q7 | Where Skyline works | About | **Answered:** Dallas, Brazil and Canada (Malta was added, then removed: one designer there, no clients) |
| Q8 | Keep, update or drop the 2023 capabilities deck? It's the "Download our Capabilities Deck" button in the hero of the current About page (`theskylineagency.com/about`) | About | **Answered:** keep it; the PDF gets replaced with the latest deck later |
| Q9 | Contact form and email provider | Contact | **Answered:** yes; the user's Resend for testing, SendGrid for production; keys from the user when the page is built |
| Q10 | Build the FAQ page? | FAQ | **Answered:** yes; 20 questions drafted in `pages/faq.md`, adjusted along the way |
| Q11 | Analytics, cookie banner, privacy page | Legal | **Answered:** yes; banner and preferences ported from igethi.com, privacy and terms pages (see `pages/legal.md`) |
| Q12 | Office photos for the about page | About | **Answered:** the current about page photos plus temporary stock photos, swapped later |
| Q13 | Nova 3D file | 01 | **Answered 2026-10-01:** build with the current file now (rig issues patched in code where possible), swap in the fixed file when the designer sends it. See `docs/NOVA-3D.md` |
| Q14 | Nova's size in the banner | 01 | **Answered:** about two headline lines tall, adjusted later if needed |
| Q15 | Nova's idle tricks | 01 | **Answered:** backflip, frontflip, barrel roll, spin, stretch, look around, wave; procedural first, designer clips later |
| Q16 | Nova's goodbye on every page or only on the homepage? | 08 | **Answered 2026-10-01:** homepage only for now; revisit when internal pages are specced |
| Q17 | Text on orange (white on orange is 3.3:1) | 01, 03 | **Answered:** anything written on orange uses ink (5.8:1); orange is never used for body text or small labels; selection is orange with ink text. Applied in `globals.css` |
| Q18 | Secondary colors | 05, 07 | **Answered:** approved as is: cobalt `#2340ff`, visor `#ffb800`, lilac `#c8b6ff` |
| Q19 | Logo use | 08, 09 | **Answered:** keep both: "S." mark in the menu (white with a difference blend since 2026-10-02, first orange), wordmark in white in the footer; no refresh |
| Q20 | Icon set | 01, 08, 09 | **Answered:** no icon library. Reuse the legacy SVGs (diagonal arrow, arrow down, angle down, close, file, volume, socials) and draw the few missing ones (menu toggle, plus/minus, arrow right/up/back) at one stroke weight, all served through one `Icon` component |
| Q21 | Stickers and hand lettering | 03, 06, 07 | **Answered:** the user generates Skyline's stickers; until then the reference's stickers are dev-only placeholders in `public/_ref/stickers/` (logged in the register). Client-name lettering for part 06 uses set type as a stand-in until the user's art arrives |
| Q22 | FAQ and the deck in the navigation | 08, 09 | **Answered:** menu pill stays About, Work, Services; footer navigation is About, Work, Services, FAQ, Contact; the deck lives on the About page only |
| Q23 | SOCIAL card line | 05 | **Answered:** "Social campaigns, content and video that keep people watching and coming back." |

Handled during the build, no decision needed: section spacing tokens (the reference's 8rem section rhythm), the serif weight for lead lines, cursor visibility on dark bands, title legibility over project covers, Nova's lighting on the dark footer. The site has no dark mode, like the reference: it is a light site with dark bands.
| Q24 | Accent font for the third headline line | 01 | **Answered:** sans only. The accent line is Inter Tight at a hairline weight (150, thickening to 700 near the cursor); the serif is gone from the whole site, including leads and links |
| Q25 | Dark banner or whole site dark | 01 | **Answered:** the whole site is dark (ink ground, off-white text). Light stays available as a section theme if a part needs it |
| Q26 | Nova in front of the headline or behind it | 01 | **Answered:** in front (as built); he still never covers a link |
