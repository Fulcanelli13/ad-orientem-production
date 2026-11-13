# Ad Orientem — production application

This is the **new, clean production repository**. It is **not** a fork, mirror or automatic continuation of the research PR queue.

- **Research and experiments (still active):** [Fulcanelli13/ad-orientem](https://github.com/Fulcanelli13/ad-orientem)
- **Production source (this repository):** [Fulcanelli13/ad-orientem-production](https://github.com/Fulcanelli13/ad-orientem-production)
- **Target publication:** https://fulcanelli13.github.io/ad-orientem-production/
- **Production contract:** [PRODUCTION_CONTRACT.md](./PRODUCTION_CONTRACT.md)

## Current milestone

Phase 1 foundation:
- The new visual orientation follows the selected Claude **Home V9** prototype, including its painting-led hero, carousel pager, week ribbon, gold Mass entrance, typography, and four exact bottom-tab SVG icon drawings.
- Primary typefaces: Cinzel, Cormorant Garamond, EB Garamond. Tokens are recorded in `site/styles.css`.
- Mobile-first Home layout and horizontal hero carousel; working hash navigation into clearly marked untransferred module entrances.
- Neutral civil-week strip. The 1962 liturgical calendar is **not** imported.
- **One approved CC0 artwork**: a locally served Home V9 compressed reproduction of Carlo Saraceni's *Paradise* from The Met. The image is a visual-study asset **not a day-specific calendar assignment**. See `site/artwork/provenance.json`.
- No Mass, prayer, formation or calendar engines/data have been transferred.
- **Explore pilot on draft PR #1 only:** an independently validated, two-lens MapLibre module is connected to the existing `#atlas` entrance on the staging branch. It contains 18 sourced Sacred Places and 10 ICKSP venues matched to already mapped CL2/Excel sites; no Mass schedules or approved site photos were imported. It is NOT part of published `main` until owner-reviewed and merged. See [stage 2 transfer](docs/explore-transfer-stage2.md).

This is a **foundation with an owner-review Explore pilot on a draft branch**, not a completed application. Full Claude visual parity and worldwide Atlas coverage are not signed off.

## Publication

The only deployment workflow is [Publish Ad Orientem production](.github/workflows/pages.yml).

Configure Settings → Pages → Build and deployment → **GitHub Actions**, if it is not already selected. The workflow runs on pushes to `main` that affect `site/`, and also on manual dispatch. It validates the curated shell, then publishes **only `site/`**. No Vercel deployment is present.

## Working principle

Promote features one at a time **after the owner selects the exact approved donor**. Preserve source provenance, artwork rights, dependencies, mobile acceptance criteria, and a rollback path. Do not import old workflows or research scaffolding.
