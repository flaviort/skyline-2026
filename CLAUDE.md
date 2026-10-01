@AGENTS.md

# Skyline 2026

New website for The Skyline Agency (Dallas). Homepage first, rebuilt in the layout and motion language of extrafazant.nl, with a dark direction (ink ground, off-white text, changed from white on 2026-10-01), one typeface (Inter Tight), international orange accent and the astronaut theme (Nova). Fully static, English only, deployed on Vercel.

## Read before working

All project documentation lives in `docs/`. Start with `docs/STATUS.md` (where things stand and what is next), then `docs/README.md`.


- `docs/PLAN.md`: build order, status table, approval gates, decisions, the per-part loop with impeccable steps
- `docs/PRODUCT.md`: who the site is for, facts we can claim, brand commitments
- `docs/specs/`: one spec per part; `docs/specs/home/README.md` holds the homepage map and direction contract
- `docs/REFERENCE.md`: measured teardown of extrafazant.nl (tokens, type scale, motion)
- `docs/ARCHITECTURE.md`: folder structure, static content, code rules
- `docs/CONTENT.md`: copy deck, project inventory, assets, placeholder register

## Rules

- Keep every doc, spec and guideline inside `docs/`. Only `CLAUDE.md`, `AGENTS.md` and `README.md` stay at the root (tools expect them there).
- Build one part at a time in the order of `docs/PLAN.md`. Each part: spec, user approval, build, review, user approval. Never start the next part without an explicit yes. Internal pages follow the same rule.
- Use `/impeccable` through the loop as `docs/PLAN.md` describes (shape, craft floor, animate, detect/audit, critique, polish; adapt for mobile; extract, document, harden, optimize at milestones).
- Reusable, prop-driven components, DRY: check the inventory in `docs/ARCHITECTURE.md` before writing markup; extend with props instead of copying; new components go through `/lab`.
- Import GSAP only from `@/lib/gsap`. Colors, fonts and eases only from tokens in `src/app/globals.css`.
- Static data only: no WordPress or database calls at runtime. Projects live in `src/content/projects/`.
- Media taken from extrafazant for development goes only in `public/_ref/` (gitignored) and is logged in the placeholder register. Never copy their copy, logo, font files or code. Never invent clients, numbers or quotes.
- English only. No em dashes and no emojis anywhere: copy, comments, docs, commits.
- The legacy site lives at `../skyline-2023` for content reference only.
