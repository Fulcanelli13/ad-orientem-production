# Ad Orientem — production application

This is the **new, clean production repository**. It is **not** a fork, mirror or automatic continuation of the research PR queue.

- **Research and experiments (still active):** [Fulcanelli13/ad-orientem](https://github.com/Fulcanelli13/ad-orientem)
- **Production source (this repository):** [Fulcanelli13/ad-orientem-production](https://github.com/Fulcanelli13/ad-orientem-production)
- **Target publication:** https://fulcanelli13.github.io/ad-orientem-production/
- **Production contract:** [PRODUCTION_CONTRACT.md](./PRODUCTION_CONTRACT.md)

## Current milestone

Phase 1 foundation:
- The new visual orientation follows the selected Claude **Home V9** prototype, including its painting-led hero, carousel pager, week ribbon, gold Mass entrance, typography, and four source-guided bottom-tab SVG icons.
- Primary typefaces: Cinzel, Cormorant Garamond, EB Garamond. Tokens are recorded in `site/styles.css`.
- Mobile-first Home layout and horizontal hero carousel; working hash navigation into clearly marked untransferred module entrances.
- Neutral civil-week strip. The 1962 liturgical calendar is **not** imported.
- **Three Met Open Access visual-study assets**, served locally: Carlo Saraceni's *Paradise*, Philippe de Champaigne's *The Annunciation*, and Ingres's *The Virgin Adoring the Host*. No day-specific Mass or Rosary mystery assignments are inferred. See `site/artwork/provenance.json` and `site/artwork/home-prayer-provenance.json`.
- No Mass, prayer, formation, Atlas or calendar engines/data have been transferred.

This is a **foundation, not a completed application**. Source-guided visual screenshot QA at 320 px, 390 px and desktop passed, including repair of the inherited prayer-wrapper layout defect. Full interactive acceptance, exact embedded font parity, final daily liturgical data and module activation are still pending.

## Publication

The only deployment workflow is [Publish Ad Orientem production](.github/workflows/pages.yml).

Configure Settings → Pages → Build and deployment → **GitHub Actions**, if it is not already selected. The workflow runs on pushes to `main` that affect `site/`, and also on manual dispatch. It validates the curated shell, then publishes **only `site/`**. No Vercel deployment is present.

## Working principle

Promote features one at a time **after the owner selects the exact approved donor**. Preserve source provenance, artwork rights, dependencies, mobile acceptance criteria, and a rollback path. Do not import old workflows or research scaffolding.
