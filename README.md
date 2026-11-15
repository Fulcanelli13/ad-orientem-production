# Ad Orientem — production application

This is the **new, clean production repository**. It is **not** a fork, mirror or automatic continuation of the research PR queue.

- **Research and experiments (still active):** [Fulcanelli13/ad-orientem](https://github.com/Fulcanelli13/ad-orientem)
- **Production source (this repository):** [Fulcanelli13/ad-orientem-production](https://github.com/Fulcanelli13/ad-orientem-production)
- **Target publication:** https://fulcanelli13.github.io/ad-orientem-production/
- **Production contract:** [PRODUCTION_CONTRACT.md](./PRODUCTION_CONTRACT.md)

## Current milestone

Phase 1 integrated-design foundation:
- Visual precedence is now the **12 November integrated Claude package** and **13 November Home screenshots**, with standalone Home V9 retained only as a subordinate donor. Source lineage is documented in [design/CLAUDE_INTEGRATED_BASELINE.md](design/CLAUDE_INTEGRATED_BASELINE.md).
- The first screen now has a day-led celebration position, Mass entrance, compact week ribbon, and owner-drawn tab icon silhouettes. Celebration / Observance / Gospel slides are reserved for source-verified data.
- Primary typefaces are the **exact five offline WOFF files** from the approved Claude typography package: Cinzel, Cormorant Garamond, and EB Garamond. Their original OFL notices, verified Git blob IDs, brand emblem, and navigation assets are included. See `design/approved-visual-asset-import.v1.json`.
- Mobile-first Home layout and horizontal hero carousel; working hash navigation into clearly marked untransferred module entrances.
- Neutral civil-week strip. The 1962 liturgical calendar is **not** imported.
- **Three Met Open Access visual-study assets** remain locally curated: Saraceni's *Paradise* is **no longer forced into the daily hero**; Champaigne's *Annunciation* and Ingres's *Virgin Adoring the Host* remain Home prayer-previews only. No feast/day or Rosary mystery assignment is inferred. See `site/artwork/provenance.json` and `site/artwork/home-prayer-provenance.json`.
- No Mass, prayer, formation, Atlas or calendar engines/data have been transferred.

**Visual acceptance: BLOCKED.** The 320 px, 390 px and desktop screenshots confirm only that the current foundation renders and that the flex-layout defect was repaired. The owner identified that these screenshots **do not reflect the latest integrated Claude application**. See [issue #2](https://github.com/Fulcanelli13/ad-orientem-production/issues/2) for the verified discrepancies. Do not describe this screen as the latest approved design or as visually complete. The liturgical calendar, hour-aware prayer content, Customs/DYK/Coming Up, exact font-file parity, and later integrated church/navigation choices are pending selective transfer.

## Publication

The only deployment workflow is [Publish Ad Orientem production](.github/workflows/pages.yml).

Configure Settings → Pages → Build and deployment → **GitHub Actions**, if it is not already selected. The workflow runs on pushes to `main` that affect `site/`, and also on manual dispatch. It validates the curated shell, then publishes **only `site/`**. No Vercel deployment is present.

## Working principle

Promote features one at a time **after the owner selects the exact approved donor**. Preserve source provenance, artwork rights, dependencies, mobile acceptance criteria, and a rollback path. Do not import old workflows or research scaffolding.

## Explore — production draft only (14 November 2026)

[Draft PR #1](https://github.com/Fulcanelli13/ad-orientem-production/pull/1) stages one MapLibre map for Sacred Atlas / TLM Atlas, 18 sourced Sacred Places and 10 Excel-matched ICKSP TLM venues, with floating controls, draggable swipe-card sheet and immersive source folios. It is **not merged or deployed**. The later integrated Claude Home baseline and approved offline typography remain authoritative. Visual acceptance remains pending, and unapproved site images or Mass times are not represented as facts.
