# Approved prototype selections — controlled transfer sequence

**Date:** 14 November 2026
**Purpose:** Freeze the provenance and editorial decisions for implementation, **not** freeze research or declare all prototypes production-ready.
**Production:** `Fulcanelli13/ad-orientem-production`; research continues independently in `Fulcanelli13/ad-orientem`.

| Module | Adopt for appearance | Adopt for behavior | Explicit hold |
|---|---|---|---|
| Home | V8 painting-led Pray Now + V9 Home and calendar design; latest approved integrated branding | V9 calendar/hero behaviours | Actual 1962 calendar and hero art, disputed ribbon/hero hierarchy |
| Church | Harmonised `Ad_Orientem_Integratedddd_Prototype.zip` | R2 church-only navigation, R3/R4 back-state corrections, R8 novena bridge | R11 staging not automatically a new design; full on-device review |
| Angelus | Caption Match + immersive camera framing | Adaptive rhythm + Figure to Figure/Floating Camera choices | Final Trinity/Holy Souls imagery and motion sequence |
| Explore | **`AO_Explore_AppDesign.html`** | **`AO_Explore_Definitive_QA1(1).html`** | French prototype records; canonical location registry and Mass schedule sources |
| Rosary | V6 Veil-and-Verse structure, approved sacred art | V3 moving beads; V6 two-part Creed/Our Father and faster pace | Full recitation and final art pairing |

## Approval interpretation

An owner request to proceed (`ok go`, `ok next`) authorizes continued work. It does not, on its own, certify an earlier visual experiment or authorize bulk transfer. Explicit acceptance, rejected features, and later corrections take precedence over file timestamps.

## First bounded implementation: Explore

- **Design donor:** `AO_Explore_AppDesign.html` (library file dated 13 Nov 2026 14:18 UTC), SHA-256 `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`, 4,600,067 bytes.
- **Functional donor:** `AO_Explore_Definitive_QA1(1).html` (13 Nov 2026 13:47 UTC), SHA-256 `a12c1b75c437a747d4f2d432060c45296be52479a39b6d0254f362f6b06029e9`, 3,616,340 bytes.
- **Base donor:** `AO_Explore_Definitive.html` (13 Nov 2026 12:59 UTC), SHA-256 `ba6696932a032429d31b95ae95a46d5d48182ad88ef12b25788328812793e676`, 3,615,445 bytes.

The AppDesign implementation contains the same bundled MapLibre GL 4.7.1 JavaScript as QA1, and its post-dataset functional code is substantially the same. Its important integration differences are a bottom navigation footprint (`TABH=84`), revised viewport/fit padding and snap-height (peek 418→376 px), plus copy edits. **Take its styling and navigation offsets, not every copy/functional change.**

## Production import boundaries

1. No `AO` prototype data object (258 French church rows, 64 illustrative sacred places, 74 world summary records and a region GeoJSON) may enter the canonical registry automatically.
2. No `IM` image-object bank (63 embedded images) may enter the approved Sacred Art or site photo gallery without individual provenance and licence review.
3. Do not import prototype `CITIES`, `LIT`, Mass schedules, dates, liturgical rankings, community affiliations, geographic pins or GPS precision as canonical facts.
4. Preserve the map's distinct TLM Atlas/Sacred Atlas modes, map sheets, context search, place details, mass timetable, planner, feast navigation and explicit source/quality labels.
5. Source-verified locations must first pass the master Excel site registry/ID approval gate, then enter production through a read-only generated data adapter; no independent unreviewed GitHub pin set.
6. Publish Explore only after phone screenshots at 320/390 px, zoom/search/clear tests, filters, card/profile transitions, map deep links, controls, empty-state behavior and offline/no-WebGL fallback.
7. No extra deployment workflows; existing Pages workflow remains the only production publisher.

## Important behavioral differences that must **not** be blindly copied

- AppDesign renames `Traditional Mass nearby` to `Old Mass near by`. Prefer the user's existing terminology, **Traditional Mass nearby**, from QA1.
- AppDesign removes the TLM-mode guard before an automated hub-fit times callback; do **not** inherit this behavior without verifying Sacred Atlas mode transitions.
- QA1 adds essential 320 px card fixes: wrapping action buttons, two-line titles and narrower pads. Retain these over any later conflicting style.

**Review status:** first implementation *scoped*, donor choice grounded. UI/registry integration **not yet complete**; no merge or live deployment is authorized by this document.
