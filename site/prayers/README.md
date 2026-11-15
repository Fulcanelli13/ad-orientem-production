# Prayer-card painting implementation boundary (15 November 2026)

This directory provides **actual app-readable artwork attribution data and a fail-closed browser/Node resolver** for the first prayer families, without replacing the owner's Claude-designed prayer screens.

- `card-artwork-bindings.v1.json`: 29 editorial slots (Angelus 5, Regina Cæli 4, traditional Rosary 15, luminous five held pending reconciliation), **105 exact-card-approved artwork candidate links**.
- `card-artwork-resolver.mjs`: `loadPrayerArtworkManifest`, `getApprovedCardArtworkOptions`, `resolvePrayerCardArtwork`. It does not render images or choose a default painting.
- `../../tests/prayer-artwork-activation.mjs`: checks IDs, approval totals, source file paths and fail-closed runtime activation.
- The complete original 860-work catalogue and 660 source attribution links remain in `../../app-data/sacred-art/`, not mirrored into the web app.

## Important distinctions

An **approved candidate for a mystery or prayer card** is *not* a chosen primary image. No default has been selected for any of these cards. A route-level painting selection, such as Angelus in general, is *not* approval for each individual versicle/response card.

Only two exact-card candidates have identified locally stored image binaries:

1. **Joyful I / Annunciation** — Philippe de Champaigne, *The Annunciation*, Met object 438724, the existing small Home-preview JPEG in `site/artwork/`. Rights are documented as Met Open Access/CC0, but full-image prayer-camera QA is outstanding. This is an **option**, not the chosen primary.
2. **Sorrowful V / Crucifixion** — Anthony van Dyck, *The Lance Thrust*, the WebP stored under `app-data/sacred-art/staged-images/`. Its rights provenance is recorded, but it is not in the published site, and phone/cinematic image QA is outstanding. This is an **option**, not the chosen primary.

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
