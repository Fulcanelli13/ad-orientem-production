# Explore — clean production integration slice (15 November 2026)

## Release status
**DRAFT / NOT DEPLOYED.** This branch starts at production main
`314baf7f5e71ee48093a6056e434cbd747adb1de` rather than merging
the 130-commit, conflicting historical Explore draft PR #1.

## Exact source
Selected implementation files and original image blobs come from
`transfer/explore-selected-core-20261113`, reviewed commit
`bcd42e9357943aa5466810886f1d9f2245cf5263`.
Visual authority: owner-supplied `AO_Explore_AppDesign(1).html`,
SHA-256 `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`.
Home continues to follow the later integrated Claude design, not a new
Explore-specific design. The old PR is retained as archival comparison,
not cherry-picked into production.

## What this integration contains
- One MapLibre instance with two lenses, Sacred Atlas and TLM Atlas,
  English/French UI, Claude full-screen design, zoom-aware medallions,
  3-state card sheet, image cards and Liber Locorum folios.
- 18 verified Sacred sites and 10 officially sourced TLM venues,
  preserving each canonical Place/Excel site identity and exact geo.
  TLM times are **not** imported; not a worldwide directory.
- Exactly six owner-selected licensed WebP reproductions in published
  site/media and duplicate review originals in a nonpublished review
  directory, plus the corresponding licensing/source manifest.
  All other sites use verified nonphotographic fallbacks.
- Four explicitly reviewed source-only geo/source/fallback modules in
  `src/find/`. The identical four modules are now *also committed*
  under `site/explore/core/`; the published site is therefore
  self-contained and does not depend on deployment steps copying
  research code at build time.
- The source-derived mobile hit/overlap, safe-area, touch and viewport
  corrections from PR #1. The later viewport keyboard/rotation behavior
  is not yet independently CI-verified.
- Minimal Home integration in `site/app.js` and `site/index.html`.
  No overwrite of `site/styles.css`, `site/artwork/`, `site/prayers/`,
  or the production deployment workflow.

## Deliberate exclusions
- Old PR commits or workflows, broad research dataset, unpublished
  Mass schedules, auto-inferred places, fake images and global registry.
- Existing owner artwork/prayer work is unchanged. No changes to the
  research repository or to production `main` from this branch.
- No new hosting services, expenses, Vercel or provider contacting.

## Acceptance gate
1. On the **current new PR head**, the existing read-only GitHub workflow
   `Review selected Explore core` must pass provenance/site tests,
   desktop/mobile Chromium, touch gestures, source marker selection,
   phone notch safe-area cases, keyboard/rotation reflow and map/CDN
   outage fallback. Green runs from historic PR #1 are not evidence.
2. The exact Claude visual design must be compared side by side and
   accepted by the owner; physical iPhone/Android functionality remains
   a distinct acceptance check.
3. Check the diff is isolated to the allowlisted Explore core and small
   Home route integration, with **zero modifications** of production
   `pages.yml`, `site/styles.css`, `site/artwork/` and `site/prayers/`.
4. Only after explicit owner approval, merge then validate GitHub Pages
   output. Until then leave this PR draft and unmerged.

## Rollback
If the owner later publishes this slice and rejects it, revert its
single integration commit. The research repository and previous draft
are unaffected. Production is still deployed solely by the existing
GitHub Pages Actions workflow.

## Gallery coexistence on current main
During validation, production main advanced to
`c613d77bfa357250b2e6546d7ce63d6f024ca19e`, adding the owner's
permanent Sacred Art Gallery (862 records and physical originals).
The integration branch must **inherit that complete new main tree**
and retain its `site/gallery/`, `site/app.js` Gallery route,
`site/index.html` Gallery presentation, new `pages.yml`
validation and existing prayer/artwork registry. Only the two shared
Home navigation/mount files receive an intentional dual-route
reconciliation. The Explore branch remains **draft**; the Gallery
already published on main is not modified or rolled back.

The clean integration parent merge can add a commit, but not restore the
old 130-commit backlog. Review exact diff relative to the *updated*
main and run both Explore and Gallery regression guards.
