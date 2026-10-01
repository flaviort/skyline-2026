# Part NN: Name

Status: spec | build | review | approved
Approved by / date:

## Reference

What extrafazant does in this part, measured at 1440x900: positions, sizes, spacing, colors, type styles, timings. Screenshot references.

## Skyline version

What changes for Skyline: content, layout adjustments, astronaut touches. Anything that deliberately differs from the reference and why.

## Content

Exact copy (from `docs/CONTENT.md`) and data sources (`src/content/*`).

## Assets

| Asset | Source | Status |
|---|---|---|

Placeholders from `public/_ref/` listed here and in the register in `docs/CONTENT.md`.

## Motion

| Element | Trigger | Animation | Ease / duration |
|---|---|---|---|

Reduced-motion behavior.

## Components

| Component | Reuse / extend / new | Props added | Notes |
|---|---|---|---|

Every new or extended component gets a `/lab` entry before the part is composed.

## Acceptance

- [ ] Matches the reference composition at 1440x900
- [ ] No overflow or breakage at 1280, 992 and 390
- [ ] Reduced motion and keyboard paths work
- [ ] No duplicated markup or logic that belongs in a library component
- [ ] Impeccable detector clean, or findings accepted with a reason
- [ ] Approved by the user
