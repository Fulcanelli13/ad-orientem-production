# Explore production transfer — stage 2: functional selected Atlas

**Repository:** `Fulcanelli13/ad-orientem-production`  
**Branch / PR:** `transfer/explore-selected-core-20261113` / draft [PR #1](https://github.com/Fulcanelli13/ad-orientem-production/pull/1)  
**Donor acceptance:** research [PR #2904](https://github.com/Fulcanelli13/ad-orientem/pull/2904), commit `9b7fafd120b90632b2c376aed4f609235cd15709`.  
**Deployment:** NONE. The Pages workflow is `main`-only and publishes a curated `site/` directory. Owner visual approval is required before merge.

## Actual staged capability

- The existing Home V9 `#atlas` destination now opens a real, lazy-loaded Explore view **inside** the four-tab Home V9 shell. It uses **one** MapLibre 6.13.0 ESM canvas shared by **Sacred Atlas / TLM Atlas**, filtered GeoJSON pins, World View, search, linked source cards and EN/FR controls.
- Exact current selection: **18 physical Sacred Places across 10 countries** and **10 ICKSP traditional-Mass venues** in the United States. All have a source-identifiable coordinate and physical-site/venue ID. This is a small explicitly limited pilot, **not** a 530-Place or 2,582-CL2 map transfer.
- Sacred Places follow the existing `place:` identities and are sourced from the research geography seed. Source links and indicative-complex labels are retained. The location is **not** guaranteed to be a visitor entrance.
- TLM venues use the exact official-source `ao-icksp-` identity and supported 1962 traditional-Mass ministry relationship. **No dates, next Mass, live availability, residence ownership, or building access are inferred.** Schedules are `NOT_IMPORTED`.
- No site photograph is copied: every card shows the explicitly labelled original **category-symbol fallback**, with original source/coordinate evidence. Approved artwork must be selectively imported with licence and identity review later.
- MapLibre JS and CSS are pinned to `6.13.0` from unpkg; the MapLibre research runtime used the same ESM distribution. The tiled basemap is OpenFreeMap Dark. Source attribution remains visible. When external tiles/scripts fail, the curated source-backed list remains readable.

## Selected data provenance

Published-from-research snapshot:
- `data/geography/seed-registry.v1.json` — research Git blob `5c59fb8ebd4e0f57387485d9b0c008ef9c36a703`
- `data/directory/generated/icksp/venues.v1.json` — research Git blob `ade7d7fdc63733b588f81622fc2dbb8aeedf5ed1`
- `data/directory/generated/icksp/ministries.v1.json` — research Git blob `838e40d761efa745ae1faecf4648b7cb0e0b4871`
- `data/directory/generated/icksp/sources.v1.json` — research Git blob `5aaf8804965d37bd9da6534db6272584e6e8a670`

Local file: `site/explore/selected-sites.v1.json`. No original source rows or generated provider directories are imported wholesale; only 28 selected records are serialized.

### Excel-first TLM site identity guard

The TLM Atlas location control is **`Ad_Orientem_TLM_Atlas_2582_Source_Link_Review_2026-11-11.xlsx`**, worksheet **`All 2582 CL2 Sites`**. Every selected venue below was already **`Mapped in production = Yes`** in that **earlier research-app snapshot**. This establishes an existing mapped source-pin lineage, **not** a new site coordinate approval or a verified entrance. The `cl2_status=MAPPED_IN_PRIOR_APP` value is intentionally explicit about which app was mapped.

| CL2 canonical anchor | Official ICKSP venue ID | Excel row | Name |
|---|---|---:|---|
| `RG-BA2F9352176D` | `ao-icksp-st-patrick-parish-and-oratory-50-charles-street-waterbury-ct-06708-2` | 1914 | St. Patrick Parish and Oratory |
| `RG-6DBC750C2D78` | `ao-icksp-st-anthony-of-padua-oratory-1360-pleasant-valley-way-west-orange-nj-07052-13` | 1074 | St. Anthony of Padua Oratory |
| `RG-74DADFAB20FB` | `ao-icksp-st-francis-de-sales-oratory-802-s-huntington-sulphur-la-70663-8` | 1151 | St. Francis de Sales Oratory |
| `RG-AA3084B4438A` | `ao-icksp-old-st-patrick-oratory-old-st-patrick-oratory-806-cherry-street-kansas-city-10` | 1660 | Old St. Patrick Oratory |
| `RG-C249D8633DD4` | `ao-icksp-st-francis-de-sales-oratory-2653-ohio-avenue-st-louis-missouri-63118-11` | 1982 | St. Francis de Sales Oratory |
| `RG-D88E7C5895A1` | `ao-icksp-st-mary-of-the-assumption-parish-and-shrine-103-west-7th-street-oswego-ny-13126-14` | 2217 | St. Mary of the Assumption Parish and Shrine |
| `RG-3F7AED9AE120` | `ao-icksp-st-josaphat-oratory-34-32-210th-street-bayside-new-york-11361-15` | 623 | St. Josaphat Oratory |
| `RG-33FE09F8ECB4` | `ao-icksp-st-leo-oratory-221-hanford-st-columbus-oh-43206-16` | 507 | St. Leo Oratory |
| `RG-ED91CF8BBA84` | `ao-icksp-st-stanislaus-oratory-524-w-historic-mitchell-street-milwaukee-wisconsin-53204-20` | 2403 | St. Stanislaus Oratory |
| `RG-893DF94815D8` | `ao-icksp-st-mary-s-oratory-325-grand-avenue-wausau-wisconsin-54403-mailing-address-22` | 1348 | St. Mary's Oratory |

A first candidate, St. Mary Oratory in Rockford, was **excluded** because the October ICKSP geocode and November Excel CL2 published point differed. The replacement, **St. Anthony of Padua Oratory**, matched its previously mapped CL2 coordinate exactly. The implementation rejects records lacking an Excel anchor, earlier-mapped status, original official source or supported geometry.

The user-owned Excel workbook is **not** uploaded into GitHub; rows and named source snapshot are recorded for independent review. No new coordinate or CL2 identity has been admitted.

## Curated production files and deployment boundary

- `src/find/{heritage-map,geo-provenance,place-source-synopsis,sacred-place-visual-fallback}.js`: four byte-identical transferred pure modules, from research commit `9b7fafd`.
- `site/explore/model.js`: validates selected schema, Excel anchor, official ministry, geo evidence, place identity and filters; uses those four modules.
- `site/explore.js` and `site/explore.css`: live selected map + cards styled with the Claude Home V9 typography (Cinzel / Cormorant Garamond / EB Garamond). This is a **fresh, compact production renderer**, not the old 39-import research shell.
- `site/index.html` + `site/app.js`: the existing `#atlas` route now mounts Explore on demand; all four previous bottom-tab drawings remain unchanged.
- `.github/workflows/pages.yml`: main-only curated publish copies **only four allowlisted pure modules** into `site/explore/core/` during CI, then tests the manifest before upload. No old research data or workflows.
- `tests/explore-selected-core.mjs` + `tests/production-explore.mjs`: synthetic audit and manifest invariants, source and Excel matching, no inferred schedule or unapproved photograph.
- `tests/explore-browser.mjs` + `.github/workflows/explore-transfer-ci.yml`: read-only CI with real Chromium at 320/390/430/1440, EN+FR, two atlas lenses, one MapLibre canvas, sources, profile, Home-return and screenshot artifacts. **No Pages permissions or deploy step.**

## Release checklist still outstanding

1. Review staged 320/390/430/1440 screenshots against approved Claude Explore prototype — final visual parity is **not** claimed.
2. Confirm Excel CL2 row/source reconciliation, especially the exact existing published pin for every selected venue, with no unreviewed coordinate replacement.
3. Check external MapLibre/OpenFreeMap network/cost/attribution policy and offline list fallback. Public static site must not depend on a paid mapping account.
4. Admit approved original site photos **only after** artwork identity, licence, credit and quality review; do not substitute unrelated Baroque paintings as real venue photography.
5. Owner sign-off on the selected production migration, then merge PR #1 if approved. Only `main` may publish through GitHub Actions + GitHub Pages. Old `Fulcanelli13/ad-orientem` remains active for independent research.

**Rollback:** revert the single production PR (or the listed staged files) before/after approved merge. No research PR backlog or old build system has been copied.
