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
- No Mass, prayer, formation, Atlas or calendar engines/data have been transferred.

This is a **foundation, not a completed application**. Visual parity with the approved source has not been signed off.

## Publication

The only deployment workflow is [Publish Ad Orientem production](.github/workflows/pages.yml).

Configure Settings → Pages → Build and deployment → **GitHub Actions**, if it is not already selected. The workflow runs on pushes to `main` that affect `site/`, and also on manual dispatch. It validates the curated shell, then publishes **only `site/`**. No Vercel deployment is present.

## Working principle

Promote features one at a time **after the owner selects the exact approved donor**. Preserve source provenance, artwork rights, dependencies, mobile acceptance criteria, and a rollback path. Do not import old workflows or research scaffolding.
