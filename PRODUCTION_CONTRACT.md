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
- A single approved CC0 artwork, Carlo Saraceni's *Paradise*, self-hosted solely as the Home V9 visual-study painting. It has no canonical date assignment; its provenance is at `site/artwork/provenance.json`.
- GitHub Actions deployment of curated `site/` output only.

**Visual acceptance is still pending.** The font families are requested from a public stylesheet and use fallback fonts when offline; exact embedded font byte parity is not claimed. User-approved original images, icon masters and final mobile/desktop polish will be promoted selectively rather than guessed from the prototype.

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

## Stage 2 selected Explore pilot — draft branch only (13 November 2026)

The user-selected **Explore / Sacred Atlas / TLM Atlas** transfer is staged on production [draft PR #1](https://github.com/Fulcanelli13/ad-orientem-production/pull/1). This PR connects one real MapLibre map to Home V9 without importing the old Explore shell or PR backlog. It holds an independently sourced subset of **18 Sacred Places** and **10 ICKSP TLM venues**. The latter correspond to already-mapped Excel CL2 site anchors from the 11 November workbook, not new site coordinates. Full 530-Place/2,582-CL2 coverage, new Mass dates, custom maps, unapproved images and research automations remain excluded.

Review manifest and source record: [Stage 2 Explore transfer](docs/explore-transfer-stage2.md). This stage is **not on `main` or deployed** until reviewed, approved and merged. Source/rights, route reuse and mobile screenshots must remain green. The old research repository stays active.
