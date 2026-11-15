# Sacred Art — prayer-card asset registry

This is the **permanent production-repository source** for the owner-selected prayer-painting curation (15 November 2026). The data is imported without bulk-merging the research repository or its old backlog.

## Contents

- `prayer-card-index.v1.json`: 179 prayer routes, 288 historical/proposed card slots, scene crosswalk, status flags, and exact production-home asset bindings.
- `artwork-catalogue-01.v1.json` and `artwork-catalogue-02.v1.json`: 860 artwork entries with original artwork IDs, rights notes, source URLs, approval state and duplicate evidence.
- `card-eligible-artworks.v1.json`: 660 card–artwork candidates with their evidence hierarchy; 134 links record an exact card-level owner choice, **not** a publication-ready source image.
- `staged-image-provenance.v1.json`: locally available production images and nonpublished source-image binaries, with rights and image QA.
- `staged-images/`: WebP files physically stored in GitHub but **not** bundled into GitHub Pages.

## Critical interpretation

The STG/COV/ROUTE card identifiers in the imported source are historical or editorial references, not verified production runtime IDs. No actual prayer module is imported into the new app yet. The 149 original owner-selected prayer category placements include cases for parent prayers and do not imply that all 149 are distinct exact-card approvals. **Never convert eligible artwork candidates into defaults.**

The matrix records **zero automatically publishable images** because exact-card selection, reproduction provenance, final image quality and production runtime IDs are independent gates. It is normal for a selected work to have a missing final binary or to appear in more than one card's candidates.

Three images already live in `site/artwork/` for *Home* studies/previews and are not thereby selected for any prayer stage. Two other owner-selected, rights-documented WebP files are retained under `staged-images/`; they are **not live** until final pixel, crop and mobile-cinematic QA and card-level authorization. The Dolci source file remains in the independent research archive and is not yet physically copied into this branch.

The full 3,516-entry historical archive stays in the original research repository and the cited curation workbook. This curated app-source registry includes its relevant prayer-card data without moving rejected or research-only paintings into the live app.

## Acceptance checks

Run `node tools/validate-prayer-artwork-assets.mjs` after checkout. It validates all stable IDs, link referential integrity, staged WebP bytes, and absence of implicit publication permission. When prayer modules are implemented, bind explicitly approved runtime IDs to locally QA-cleared images, preserving the approved Claude integrated experience and painting-led camera animations.

**Only `site/` is published** by the existing GitHub Actions/Pages workflow. No site, UI, typography or deployment workflow changes are included in this import.
