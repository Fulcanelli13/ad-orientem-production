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

Three images already live in `site/artwork/` for *Home* studies/previews and are not thereby selected for any prayer stage. Three other owner-selected, rights-documented WebP files are retained under `staged-images/`; they are **not live** until final pixel, crop and mobile-cinematic QA and card-level authorization. The additional staged image is Tanner’s *Annunciation* (1898), preserved from the original research WebP with Public Domain Mark provenance; it is a **Joyful I candidate only**, not an approved primary. The Dolci source file remains in the independent research archive and is not yet physically copied into this branch.

The full 3,516-entry historical archive stays in the original research repository and the cited curation workbook. This curated app-source registry includes its relevant prayer-card data without moving rejected or research-only paintings into the live app.

## Acceptance checks

Run `node tools/validate-prayer-artwork-assets.mjs` after checkout. It validates all stable IDs, link referential integrity, staged WebP bytes, and absence of implicit publication permission. When prayer modules are implemented, bind explicitly approved runtime IDs to locally QA-cleared images, preserving the approved Claude integrated experience and painting-led camera animations.

**Only `site/` is published** by the existing GitHub Actions/Pages workflow. No site, UI, typography or deployment workflow changes are included in this import.


## Unified assignment coverage (15 November, add-on)

- `artwork-assignment-index.v2.json`: cross-reference of **all 860** catalogue records plus **two historical Angelus Souls records** absent from the previous master, totaling 862 tracked records.
- The source records **660 original card–art links** plus **47 distinct part associations** from the uploaded Angelus review (36 works, nine part groups).
- The master tracks unassigned records instead of inventing prayer placements: **611 older records require further editorial classification**.
- The complete review is in `site/prayers/angelus-part-paintings.v1.json`; seven associations are contextual/scene-only and are NOT owner-approved Angelus part selections.
- Nothing is auto-published or selected as a prayer-card primary. The original 860-item catalogue and original 660 card links remain intact.


### Editorial approval scope (v2 index correction)

`candidate_prayer_card_ids` includes all historically eligible/crosswalk/prototype card links, not necessarily explicit owner-approved matches. `owner_approved_exact_card_ids` and `owner_approved_parent_prayer_ids` are **separate, narrower subsets** derived from the original link-level approval flags. No historical candidate is silently relabelled approved. The precise current coverage is 249 works with at least one candidate link, 114 with an exact approved card link, and 15 with a parent prayer approval. Counts are per unique artwork record, not per association.

## Permanent original/source photograph bank · 16 November 2026

The permanent `source-masters/` directory now contains **54 deduplicated exact-source JPEGs**: 11 previously released originals from PR #20, 40 exact museum/research recoveries from PR #22, and three already released Class I Calendar photographs documented in `class-i-source-recovery-20261116.v1.json`. Three further exact originals already reside in their existing `site/gallery/images/` paths. Preserve original byte hashes, institutional identity, original photograph and source-specific rights qualifications. The source bank is archival: it is outside GitHub Pages and does not itself approve gallery publication or prayer-card primaries. The current public gallery remains at 54 displayed paintings and 862 catalogue records.

## Additional recovered Prayer artwork and devotional portrait — 16 November 2026

The exact previously selected Mystic Lamb WebP (1,536,710 bytes) and historical St Thérèse portrait WebP (48,294 bytes) are preserved with old source SHA-256 and Git-blob hashes. The Mystic Lamb is now displayed in the gallery, while the St Thérèse photograph is stored separately under `devotional-portraits/` and is **not counted as a painting or published on Pages**. The previously released Murillo Confession JPEG (NGA 34956 CC0) is already preserved in source-masters and is now linked into the gallery without another download. The previously selected MNAC Seven Sorrows image remains release-held and uncopied. All four decisions are recorded in `devotional-asset-recovery-20261116.v1.json`. The 54-JPEG original source bank and all prayer assignments remain unchanged. Gallery totals: **870 catalogue records, 70 displayed paintings, 73 image-bearing rows**.

Three previously released 2026 Class I original JPEGs already preserved in source-masters were linked to the gallery without new image acquisition, painting selection or prayer defaults; see class-i-gallery-link-20261116.v1.json. Exact original source bank remains 54 JPEGs; gallery now displays 73 distinct paintings across 873 records. Photo-rights caveats preserved.

### Bulk exact Commons source decisions (Nov 16)

A single batch reconciled 491 previously owner-selected 3 November Commons artwork candidates with 103 global historical rejects, image-specific Commons rights metadata and source-quality checks. Exactly 161 local full-image derivatives were admitted to the gallery, 330 were held or deferred with reasons. Production has 234 displayed paintings, 237 image-bearing records; the original 54 source JPEGs remain intact. This batch did not acquire or retain full source JPEG originals; the resulting WebP derivatives are permanent with source and fingerprint trails. No unrelated prayer placements or calendar selections were modified.

### Owner-approved Commons bulk image batch 02 (16 Nov 2026)

Second batch recovered 109 further locally cached, full-composition gallery WebPs for owner-approved original File pages, for 343 total displayed paintings and 346 image-bearing catalogue records. Every previous image, 873 historical artwork records, 103 globally rejected original identifiers, prayer-card links and permanent 54-source-JPEG bank remain intact. The original Commons JPEG bytes are not archived in these batches; the durable original-source metadata and reproduction-specific licence position are in bulk-commons-photo-import-batch02-20261116.v1.json. 221 records remain held for documented reasons; these are not automatically approved by the second pass.

### Post-bulk preservation and museum source inventory, wave 03

Revalidated 49 prior rate-limited source-file candidates with conservative sequential Commons access, preserving exactly 49 additional full-frame WebPs. Current live gallery should contain 392 painting photos across 395 catalogue entries. A complete separate evidence-only inventory of 90 owner-selected non-November Commons records is stored in bulk-museum-image-queue-20261116.v1.json; do not equate curation approval with photography reuse clearance or count it as a gallery image import. Original JPEG bank remains at 54 and all prayer relationships remain unchanged.

### Additional owner-selected museum original source gallery batch wave04

Exact owner-selected source-file and institutional collection verification produced 37 more local WebP display paintings out of a 90-object candidate registry. Now 429 painting images over 432 catalogue rows; 873 historic records remain unchanged. 53 existing owner-selected records carry explicit hold reasons. Original source-master JPEG count remains 54; this is a display-derivative migration, not source-JPEG preservation. See selected-museum-image-wave04-20261116.v1.json.

### Historical OWNER_APPROVED_CURATED acquisition, wave 05

The 84 previously missed original owner-approved RECENT575 artworks had a different but valid historical curated status from the earlier 491 source batch. All 84 were processed in one exact-file Commons image qualification sweep, 38 permanent local WebPs were added, and 46 unsupported image-source cases were held with per-file reasons. Current gallery: 467 paintings, 470 image-bearing catalogue records, original 873 catalogue identities and 54 historical source-master JPEGs unchanged. New display WebPs are not original full-resolution photo masters. Details: curated-cohort-image-wave05-20261116.v1.json.

### Full source-quality inventory and verified high-resolution recovery wave06

**182** previously held, approved artworks were each re-evaluated from original source rights and quality evidence, not from title matching. Exactly 5 new locally hosted WebP images were admitted; 177 remain documented quality, museum image identity, license, or source access holds. Gallery total: 472 physical image files, 475 image-bearing record links, 873 unchanged artwork identities. Neither original source-master bank (54 JPEGs) nor prayer/Calendar assignments changed.
