# Explore — selected core transfer, stage 1

**Status:** production draft, source-only; **not published or connected to Home navigation**.

## Owner-selected references

- **Visual target:** the owner-selected Claude `AO_Explore_AppDesign.html` (Home V9-compatible Explore). The HTML donor contains standalone demo records and embedded vendor code. **Neither is eligible for direct publication.**
- **Reviewed integrated UI / mobile acceptance:** [research PR #2904](https://github.com/Fulcanelli13/ad-orientem/pull/2904) at commit `9b7fafd120b90632b2c376aed4f609235cd15709`. Its last phone run finished with 38 successes, two skips and no failures on the research branch. This is evidence for that branch, **not** a claim that production is integrated or verified.
- **Production shell:** Claude Home V9 contract in this repository. Fonts Cinzel / Cormorant Garamond / EB Garamond and the four-tab navigation remain untouched.

## Precisely selected source files

These four files have been transferred **unchanged** from `Fulcanelli13/ad-orientem` at research commit `9b7fafd120b90632b2c376aed4f609235cd15709`:

| Production path | Research blob SHA | Capability |
| --- | --- | --- |
| `src/find/heritage-map.js` | `ecf349f4879531a2f99672b6a8bd2eef909230a1` | Single pin per exact canonical Place; approved public category boundaries; geodesic *approximate* distances |
| `src/find/place-source-synopsis.js` | `506b34c30e7b969d7d4fe0193b1dbe8251118559` | Source-specific EN/FR text, including category preference |
| `src/find/geo-provenance.js` | `f6697e8e2adbea093cea1f37005f22567aa68d63` | Coordinate validity, geo source attribution and indicative precision |
| `src/find/sacred-place-visual-fallback.js` | `c56863b7d73a7e9dfb8f8ced8b70e80d12e24bd0` | Clearly labelled category symbol where **no source-approved exact-site photo** is available |

Each module has **zero imports**, so it can be independently tested without introducing the old app's runtime, data pipelines, calendar or research backlog. Their tests use **synthetic, test-only fixtures**, not pretend published Places.

## Explicitly excluded in stage 1

- No `src/find/browser-entry.js` or entire runtime: the research entry currently imports 39 first-order modules and transitively relies on many more sources. Copying it without its contracts would be an invalid production transfer.
- No `data/geography/seed-registry.v1.json`, CL2 venue master, saints, Bible or location registry, timetable source, scraped directory, source bridge, or image licence registry.
- No copied vendor bundle, inline demo `AO` dataset, substitute photos, unapproved Commons images, external hotlinked museum image, or unlicensed font binary.
- No UI entry or map canvas yet. Home's **NOT YET TRANSFERRED** statement remains truthful. No production Page is changed in this PR.
- No research workflows, automatic merge, Vercel or external deployment services.

## Next implementation boundary — functional Explore route

1. Inventory the exact runtime/import/data/asset dependencies needed to render a *single* MapLibre instance for two **TLM Atlas / Sacred Atlas** lenses inside the existing production Home V9 shell. Keep the current source and rights rules. Do not adopt the research UI shell wholesale.
2. Admit canonical physical-site/CL2 records only with source provenance and appropriate exact-site licensed photographs. Published weekly schedules remain **patterns**, not inferred confirmed next Masses; indicative map pins are labelled as such. Keep community and venue identity separate.
3. Connect `#atlas` to the real module only when its data and map work. Preserve Home, Prayer and Mass entrances and the four existing icons. The user must be able to return Home.
4. Verify EN/FR at 320px, 390px, 430px and desktop: maps, label/filters, category selection, one canonical Place pin, source-linked folios, full uncropped art and credits, discover action, World View hit targets, one map canvas, no horizontal overflow and no console errors. Collect screenshots.
5. Keep the transfer on a production **draft PR** until the owner approves the visual result. Merge only the selected, verified slices; GitHub Actions + GitHub Pages remain the exclusive deployment path.

## Acceptance / rollback

`node --experimental-default-type=module tests/explore-selected-core.mjs` must pass, together with the existing `node tests/production-shell.mjs`. The test gate must not write site files or deploy. Rollback is limited to deleting these four added `src/find/` files, this documentation, its test and its non-deploying review workflow; `main` and the existing published Home are unchanged.
