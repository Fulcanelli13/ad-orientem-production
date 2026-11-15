# Prayer-card painting implementation boundary (15 November 2026)

This directory provides **actual app-readable artwork attribution data and a fail-closed browser/Node resolver** for the first prayer families, without replacing the owner's Claude-designed prayer screens.

- `card-artwork-bindings.v1.json`: 29 editorial slots (Angelus 5, Regina Cæli 4, traditional Rosary 15, luminous five held pending reconciliation), **105 exact-card-approved artwork candidate links**.
- `card-artwork-resolver.mjs`: `loadPrayerArtworkManifest`, `getApprovedCardArtworkOptions`, `resolvePrayerCardArtwork`. It does not render images or choose a default painting.
- `../../tests/prayer-artwork-activation.mjs`: checks IDs, approval totals, source file paths and fail-closed runtime activation.
- The complete original 860-work catalogue and 660 source attribution links remain in `../../app-data/sacred-art/`, not mirrored into the web app.

## Important distinctions

An **approved candidate for a mystery or prayer card** is *not* a chosen primary image. No default has been selected for any of these cards. A route-level painting selection, such as Angelus in general, is *not* approval for each individual versicle/response card.

Three exact-card candidates have identified locally stored image binaries:

1. **Joyful I / Annunciation** — Philippe de Champaigne, *The Annunciation*, Met object 438724, the existing small Home-preview JPEG in `site/artwork/`. Rights are documented as Met Open Access/CC0, but full-image prayer-camera QA is outstanding. This is an **option**, not the chosen primary.
2. **Sorrowful V / Crucifixion** — Anthony van Dyck, *The Lance Thrust*, the WebP stored under `app-data/sacred-art/staged-images/`. Its rights provenance is recorded, but it is not in the published site, and phone/cinematic image QA is outstanding. This is an **option**, not the chosen primary.

3. **Joyful I / Annunciation** — Henry Ossawa Tanner, *The Annunciation* (1898), the uncropped 1,920-pixel WebP imported from the original research binary with a public-domain reproduction record. This is staged outside the published site; final phone/cinematic QA and an explicit primary choice are outstanding.

Other exact-card-approved works require original-image recovery, source/rights checks, and compression/crop QA. The Luminous slots are included by user request but do not yet have verified exact-card approvals in this imported selection matrix.

## Runtime contract

Call `getApprovedCardArtworkOptions(manifest, key)` to obtain **reviewable owner-approved candidates**, never to select a runtime painting.

Call `resolvePrayerCardArtwork(manifest, key, runtimeCardId)` only after these explicit gates:

1. The current Claude prayer engine has been selectively imported and its actual runtime card ID is verified.
2. The user explicitly selects a **primary** painting for that exact card.
3. The correct photograph is stored locally with verified reproduction rights.
4. Final 100% image inspection and mobile cinematic crop/animation QA pass.
5. The exact local asset's card-use authorization and release state are updated.

The resolver returns `null` if any gate is absent. This is intentional. It does not automatically promote scene-basket candidates or placeholder images. No liturgical text, prayer animation, typography, church navigation or existing Home layout is changed here.

## Claude UI handoff

The clean production repo currently contains only the neutral *Pray* entrance placeholder. The latest integrated Claude prayer engine has **not** been transferred, and earlier `STG-...` IDs are editorial aliases, not production runtime IDs. The approved layout rules (Caption Match titles on versicle/response screens only, adaptive ℣/℟ timing, kneel at Incarnation, cinematics that reframe to the whole painting for Conclusion, and original church navigation) remain binding for the actual integration. Do not substitute a newly invented UI.

**QA command:** `node tests/prayer-artwork-activation.mjs`. The existing production artwork validation script must also pass.

The previous `main` commit is the rollback point. GitHub Actions / GitHub Pages remain the sole publishing pipeline.


## A1 Angelus and Regina Cæli — source-faithful stage crosswalk

The original Claude-derived A1 adapter and its unmodified styling file are pinned in `design/prayer-donors/2026-11-11-a1/` as a **nonpublished reference**, sourced from research draft PR #2879 (Git blobs pinned in `angelus-regina-a1-crosswalk.v1.json`). This **11 November donor does not supersede later approved Caption Match and adaptive timing decisions**.

`angelus-regina-a1-crosswalk.v1.json` maps the legacy editorial painting-stage IDs into the actual A1 devotional card structure. Unlike the previous 5+4 editorial rows, the runtime A1 groups Intercessio and Collect into one `prayer` movement for each form:

- Angelus: `announcement [0,1]`, `fiat [2,3]`, `incarnation [4,5]`, `prayer [6,7]`, optional `conclusion []` (three full Gloria Patri repetitions and historical additions).
- Regina Cæli: `rejoice [0]`, `resurrection [1]`, `prayer [2,3]`, optional `conclusion []`.

**Seven exact Collect painting selections (Angelus 1, Regina Cæli 6)** therefore attach to the *Collect prayer unit*, not to the entire painting background for the multi-unit stage. Their primary painting remains unset. The separate 11 Angelus and 4 Regina Cæli parent-prayer candidates remain contextual references, not stage-specific selections.

`angelus-a1-stage-bridge.mjs` returns source-owned movements with stable editorial aliases and unit-scoped eligible art; it cannot activate artwork. `tests/angelus-a1-donor-crosswalk.mjs` validates the grouping and rejects implicit stage primaries.

No actual Claude prayer screen is transferred yet. The correct follow-on is to select and preserve the later, explicit **13 November Caption Match prototype** (not merely this 11 November A1 donor), reconcile its real screen IDs, canonical EN/FR/Latin recitation and visual/camera transitions, then perform 320/390/desktop QA. Preserve the interactive church entrance and all established prayer navigation.


## Unified Angelus painting review — all works preserved (15 November)

The user-supplied `AO_Angelus_Unified_Painting_Prototypes_Review(1).html` (SHA-256 `c9534432641836971440115b74c5523e17c35dba9812b6c8d7d5e54bf43c6131`) contains 36 DISTINCT artwork IDs and 47 original part-to-artwork links. All are now permanently indexed in `angelus-part-paintings.v1.json` and queryable through `angelus-part-paintings.mjs`.

| Original painting part | Candidates | Status |
|---|---:|---|
| Angelus versicles | 11 | Prayer-family candidate; not a chosen A1-stage painting |
| Hail Mary | 12 | Reusable complete-prayer-unit candidates |
| Angelus Collect | 1 | Exact prayer-unit candidate, never automatically the entire stage background |
| Gloria Patri | 5 | Part-level choices, no confirmed primary |
| Trinity scene-only alternatives | 5 | Approved in other contexts, **not approved for Gloria** |
| Faithful departed | 1 | Prayer-part candidate, rights restrictions retained |
| Souls contextual alternatives | 2 | Historical All Souls selection / proposal; **not an Angelus approval** |
| Regina Cæli | 4 | Prayer-family candidates |
| Regina Cæli Collect | 6 | Exact prayer-unit candidates |

The **40 part-level owner selections** and **seven contextual links** remain explicitly distinct. The source's display/default selections were for a local review prototype; they are NOT imported as final app defaults. Every original painting is attributed to one or more groups, with no loss of source IDs, provenance or rights warnings. Two historical Souls IDs absent from the previous 860-entry catalogue remain separately represented; no guessed deduplication.

`angelusPaintingOptionsForStage()` and `angelusPaintingsForPart()` return *editorial options*, not ready-to-display image sources. Existing local images are referenced where known, but independent photographic rights, mobile QA and owner-selected primaries remain separate gates. Never embed source review's remote preview URLs in runtime prayer screens.

`app-data/sacred-art/artwork-assignment-index.v2.json` now accounts for all 860 earlier catalogue records plus the two historical context records: 862 total tracked. This is a **coverage inventory**, not a claim that all historical paintings have been assigned to cards: 611 of the earlier catalogue records still have no verified prayer-card, part, destination or scene relation. That queue must be curated rather than auto-fitted by title or assumed to be owner-approved.

Run `node tests/angelus-part-artwork-coverage.mjs` to certify all source rows and preserved scope. Claude's presentational original remains unaltered; these mappings do not replace the UI.
