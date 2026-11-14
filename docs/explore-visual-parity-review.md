# Explore visual parity and Excel release review — 14 November 2026

**Disposition: FUNCTIONAL PILOT ACCEPTED FOR CONTINUED DEVELOPMENT; VISUAL DESIGN NOT ACCEPTED FOR PUBLICATION.**
This review concerns draft [production PR #1](https://github.com/Fulcanelli13/ad-orientem-production/pull/1), *not* the old research PR or a public deployment.

## Sources reviewed

- **Owner's visual reference:** `AO_Explore_AppDesign.html` (Claude's 4.4 MB standalone Explore prototype, supplied by the owner). Its explanatory panel explicitly says its French 201-church / 64-Place / 50-pilgrimage entries are sample data **not publication scope**. The screenshot and HTML must not be copied with embedded map libraries, inline fonts, demo schedules or photographs.
- **Production evidence:** Chromium screenshot artifact `production-explore-screenshots` from [successful workflow 43491623018](https://github.com/Fulcanelli13/ad-orientem-production/actions/runs/43491623018), including `320-en-sacred.png`, `390-en-sacred.png`, `430-en-sacred.png`, `1440-en-sacred.png` and French TLM counterparts.
- **Site coordinates and CL2 identities:** owner-controlled `Ad_Orientem_TLM_Atlas_2582_Source_Link_Review_2026-11-11.xlsx`, sheet `All 2582 CL2 Sites`, exact source rows detailed below.
- **Current production branch:** `transfer/explore-selected-core-20261113`; live site and `main` unchanged.

## Source reconciliation: ten selected TLM pilot venues

The current selected manifest was compared **independently** to the original Excel sheet at the ten named row numbers, not merely to the prior PR documentation:

- **10/10** canonical venue IDs match Excel column B; **10/10** CL2 anchors match column A.
- **10/10** latitudes and longitudes match the original mapped values in columns J/K to within `1e-7` degrees; **no coordinate substitution or newly approved pin**.
- **10/10** entries are marked `Mapped in production = Yes` in the *earlier research-app snapshot* (Excel column I), **not** evidence that today's clean GitHub Pages production site is live.
- **10/10** Excel rows mark `Entrance verified = Unverified` and `Mass / timetable verification = Not established by geometry`. That remains a visible restriction.
- A strict `tests/production-explore.mjs` registry now locks all ten CL2 ID, Excel-row and coordinate tuples; new coordinates require explicit Excel-first evidence and review.

The selected venue IDs, Excel rows and CL2 anchors are also listed in `docs/explore-transfer-stage2.md`. **No** claims of exact entrance, next Mass, current opening, recognition or community-specific weekly service hours follow from geocoding.

## Claude-versus-production visual comparison

| Surface | Owner's Claude reference | Current 320px/desktop production captures | Verdict |
| --- | --- | --- | --- |
| Primary composition | Map fills the app viewport, with controls floating above; a draggable rounded bottom sheet occupies the lower portion | Traditional long web page: heading/toolbar then a rectangular map, results below, and profile still further below; desktop uses an adjacent list | **FAIL — critical design gap** |
| Atlas switch | Compact translucent floating **TLM Atlas / Sacred Atlas** segmented control directly over map | Two correct named tabs, but in a separate form row above the map; initial order is Sacred/TLM | **PARTIAL** |
| Discovery and cards | Search overlay; map interactions pull up a sheet containing horizontally swipeable, image-led cards, with relevant actions visible | Tall vertical place directory, no swipe-card rail, no draggable sheet and no map-linked slide-up discovery | **FAIL — critical design gap** |
| Place profile | Immersive **Liber Locorum** separate full-screen profile, destination imagery, named folio actions, story/visit context | Text-and-category-symbol card below the map/list, with technical geo-source button and geodesic nearby links | **FAIL — needs curated photos and approved folio layer** |
| Cartography and pins | Glowing category medallions, region labels, geographic selector, atmosphere/zoom hierarchy | OpenFreeMap Dark and plain circle points. Source/attribution is present, but the prototype marker language is missing | **PARTIAL** |
| Typography | Cormorant for large editorial names, EB Garamond for liturgical prose, Cinzel for selective captions; system UI for tools | Same named families carried over, but controls/sheet spacing differ from Claude's visual rhythm | **PARTIAL** |
| Functional integrity | Search, thematic lens, maps, source-backed route cards | One MapLibre map, source-only records, switch, World View, EN/FR, external evidence, Home return all passed automated browser checks | **PASS — limited pilot function** |
| Source and rights | Sample includes decorative site photographs and timetable interactions, not automatically reusable | No site photos or Mass timetable imported; clearly labelled icon fallback and no inferred service time | **PASS — correct temporary restrictions** |

## Release choice

**Do not merge PR #1 yet.** The issue is **not** the source integrity or basic map function; it is the fundamentally different mobile interaction and visual hierarchy. A 38-check functional acceptance in the old research PR or a green pilot Chromium run is **not** proof of Claude visual parity.

Before any gallery or 2,582-site expansion, evolve the staged production renderer **without copying the old research app shell**:

1. Keep the **same one MapLibre instance and approved 28-record sample**.
2. Move to a **full-viewport map under floating search + two-lens segmented header**; keep visible MapLibre/OpenFreeMap attribution.
3. Implement a **bottom sheet** with safe-area-aware drag states, **horizontal image-led card rail**, bounded text, 44px touch targets, visible Home/Atlas controls and no horizontal document overflow at 320/390/430.
4. Source-owned *no-photo symbol* must remain explicit until separately approved, exact-site photography exists. Never draw an invented painting as an approved photograph.
5. Open an immersive **Place folio** from **Discover** without altering exact canonical IDs, distinguishing indicative site pins from verified entrances, or pretending that missing timetables are live.
6. Re-run functional browser checks **and screenshot-level owner comparison** at 320, 390, 430, desktop, EN/FR before owner approval. Status remains draft and main remains unchanged.

**Do not add fake demo next-Mass times** just to make the redesigned cards look finished. The UI must honestly display source-covered metadata or a concise unavailable status. Only GitHub Actions + GitHub Pages may publish after sign-off.
