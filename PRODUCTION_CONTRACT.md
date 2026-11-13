# Ad Orientem — production integration contract

This is the **production application repository**. `Fulcanelli13/ad-orientem` remains an active, independent research repository. Nothing in this repository freezes or modifies research.

## Non-negotiable rules

- Publish only through GitHub Actions and GitHub Pages. No Vercel dependencies.
- Use the user-approved Claude prototypes as visual references. Preserve their typography, proportions, restrained gold-on-dark palette, and painting-led presentation. Do **not** copy the previous integrated app shell as a visual baseline.
- Never bulk-merge the old repository, old pull requests, generated output, research branches, or hundreds of old workflows into this one.
- Transfer features only after specific user selection. Record donor source path and commit SHA, required dependencies, licencing/provenance of artwork, acceptance tests, and rollback strategy for each transfer.
- Unimplemented features must say so; no dummy content presented as canonical Mass, prayer, calendar or directory data.
- Keep the published application useful, visually coherent, responsive and navigable after every main-branch change.
- Keep exactly one production deployment workflow. Research automation must never deploy here.

## Phase 1: visual and deployment foundation (13 November 2026)

- A mobile-first, source-guided Home V9 layout (hero, pager, calendar ribbon, Mass entrance, prayer entrance, tab icons), using the approved **Cinzel**, **Cormorant Garamond** and **EB Garamond** families and reference design tokens.
- Working local navigation between Home and clearly marked **not yet transferred** module entrance screens.
- A neutral civil-week row; **not** a claim that the canonical 1962 Roman calendar has been imported.
- Three small, locally served, previously approved public-domain Met visual-study reproductions: Carlo Saraceni's *Paradise* for the Home hero, Philippe de Champaigne's *The Annunciation* for the painting-led prayer entrance, and Ingres's *The Virgin Adoring the Host* in a small Home preview. These are **Home presentation assets only**; none is assigned to a liturgical date or a Rosary mystery. Provenance is in `site/artwork/provenance.json` and `site/artwork/home-prayer-provenance.json`.
- GitHub Actions deployment of curated `site/` output only.

**Visual QA:** 320 px, 390 px and desktop viewport screenshots captured by the one production workflow; the inherited flex-wrapper defect in the V9 prayer entrance was discovered and fixed, and source plus deployment checks passed on 13 November 2026. This is a **static visual pass**, not full interaction or pixel-perfect certification. Fonts are requested as public web families with fallback; exact embedded font-file metric parity and final liturgical content integration are not claimed.

## Publishing

`.github/workflows/pages.yml` uploads only the `site/` directory. In **Settings → Pages**, select **Build and deployment → GitHub Actions** (one-time repository setting, if not already selected). The workflow is then triggered on pushes to `main` affecting `site/` or the workflow itself.

## Future transfer checklist

For every feature, specify:
1. Approved donor (file, commit SHA, prototype version);
2. True asset/image/font rights and provenance;
3. Exact required files and dependencies;
4. Functionality and visual acceptance criteria for 320 px, 390 px and desktop;
5. Revert/rollback point and deployment verification.

Do not import a feature merely because it exists in the research repository.
