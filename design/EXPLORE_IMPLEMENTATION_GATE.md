# Explore implementation gate — AppDesign + Definitive QA1

## 1. Version-diff evidence

| Item | Definitive | Definitive QA1 | AppDesign | Selected |
|---|---|---|---|---|
| Search, map gestures, sheets, profile, Mass times, planned radius | Core functions | Same core | Same broad feature architecture | QA1 behavior |
| Phone card titles/actions | Original 320px overflow | **Adds wrap, title clamp, flexible height** | Retains a comparable fix; styling otherwise harmonised | QA1 small-phone guard |
| App navigation | Standalone prototype | Standalone prototype | 84px bottom app tab bar, status/header | AppDesign |
| Map visible bounds / center | Standalone top & bottom offset | Same | Recalculates for 84px tab bar | AppDesign |
| Map popup placement | Sits above sheet | Same | Sheet + tab bar | AppDesign |
| Sheet compact preview | 418px | 418px | 376px | AppDesign |
| Next Mass label | "Next listed Mass" | "Next listed Mass" | "Next Mass" | Review text/source caveat; keep qualifiers where necessary |
| Mass terminology | "Traditional Mass nearby" | Same | "Old Mass near by" | **QA1; reject later copy change** |
| Hub-fit automatic times callback | Guarded for TLM mode | Guarded | Mode guard removed | **QA1; recheck with integrated navigation** |
| Region defaults | France/sample geography | Same | Same | **Reject as production geography** |

The MapLibre GL bundle is byte-identical across the three inspected sources. AppDesign includes large embedded assets and a French sample database, so the entire HTML file is **not** a release artifact.

## 2. Functional scope to port

- Two explicit map modes: TLM Atlas and Sacred Atlas
- No forced global map zoom, visible-bounds search, and search across canonical sites and towns
- Marker clustering/zoom level changes, site identity, directories and affiliations as approved
- Bottom sheets and swipe cards on mobile; profile opening and safe Back restoration
- Mass calendar/day selector and source-qualified time labels
- Place profiles, shrine/pilgrimage navigation, itinerary/radius planning
- Saved places and plans (only if local persistence is supported and explained)
- Source attribution and "not verified" distinctions, without suggesting sample information is canonical

## 3. Data release boundary

**Only canonical, owner-approved registry rows** may be presented as actual sites or schedules. Historical 2,582-row Location Master Registry is the review/staging surface: document the existing canonical CL2 ID, source URL and owner approval before import. Coordinates may be approximate only when marked illustrative; external GPS directions should use verified map destinations.

No French prototype AO.C / AO.P / AO.W / AO.REG, inline image bank, test dates, fake timetables, or local church data in production.

## 4. Asset strategy

- Reuse the existing self-hosted Cinzel, Cormorant Garamond and EB Garamond font binaries already in `site/assets/fonts/`.
- Reuse the accepted Sacred Atlas navigation mark; do not produce another icon family.
- Modularise MapLibre and its CSS; avoid embedding an 800KB script on every Home view.
- Store only minimal source-approved static geo layers and tiles; no Vercel or paid tile assumption.
- Do not add a second Pages/preview workflow to the production repository.

## 5. Merge criteria

- [ ] Exact source visual comparison at 320px, 390px and desktop for Atlas, details and search
- [ ] Map renders with a tested fallback if WebGL is unavailable
- [ ] Both Atlas modes and mode transitions work with zero locations, one location and real approved data
- [ ] No sample French site displayed as factual
- [ ] No GPS coordinate, Church affiliation, feast or Mass time introduced without registry/source gate
- [ ] Keyboard/touch search, sheet swipe, back, close, tabs and map controls tested
- [ ] QA1 compact card fixes retained
- [ ] No icon/font hierarchy regressions
- [ ] Single GitHub Pages pipeline passes after eventual integration
- [ ] Explicit owner review of final mobile view

## Status

**Draft / not for merge.** This branch is an acceptance and source-isolation stage, not the functional Explore feature. User's "ok let's go" authorises performing the work, not publication of sample data. The next code change should be against this scoped feature, not a bulk copy of AppDesign.
