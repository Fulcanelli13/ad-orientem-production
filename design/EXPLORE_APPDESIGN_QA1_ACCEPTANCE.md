# Explore — owner-approved version selection and visual gate

**14 November 2026 — PR #1 draft.** This is a release review record, not approval to merge.

## Original Claude donors, pinned by raw-file SHA-256

| Role | Original file | SHA-256 |
| --- | --- | --- |
| **Appearance and interaction hierarchy** | `AO_Explore_AppDesign.html` (13 Nov 14:18 UTC) | `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771` |
| **QA / function** | `AO_Explore_Definitive_QA1(1).html` (13 Nov 13:47 UTC) | `a12c1b75c437a747d4f2d432060c45296be52479a39b6d0254f362f6b06029e9` |
| Context | `AO_Explore_Definitive.html` (13 Nov 12:59 UTC) | `ba6696932a032429d31b95ae95a46d5d48182ad88ef12b25788328812793e676` |

Source files are retained in the user's conversation file library, **not** copied wholesale into the production repository.

## Comparison and precedence

| Element | Original AppDesign / QA1 | Current PR #1 | Decision |
| --- | --- | --- | --- |
| Full-viewport map | AppDesign, one map for two Atlas lenses | One MapLibre canvas | **Keep PR #1** |
| Floating search, two-mode selector | AppDesign | Implemented | **Keep**, visual parity still subject to owner review |
| Bottom sheet + swipeable cards | AppDesign; QA1 fixes 320px overflow | Source-gated card rail and pointer/touch drag | **Keep**, inspect phone captures |
| Search independent of zoom | Definitive | Filter over entire selected manifest | **Keep** |
| Atlas switching / hub-fit | QA1 keeps a mode guard | One map/source and lens switch | **Keep QA1 principle**, do not force previous lens hub camera on every switch |
| User language | QA1: "Traditional Mass nearby" | Explicit TLM Atlas and source-qualified ministry | **Preserve traditional terminology** |
| Next Mass times | Prototype illustrates schedule UI | Not imported | **Correct hold**; never infer from pin or Sunday |
| Geography | Prototype France only | 28 source-backed pilot entries (10 TLM, 18 sacred) | **Do not expand without owner approval** |
| Initial camera | France sample centered Europe | Screenshot initially centered Europe despite TLM US pilot | **Fix** using active source-backed lens bounds, with global-scatter fallback |
| Photographs and emblems | Demonstration artwork and monograms | Clearly labelled fallback symbols | **Correct temporary restriction** |
| Liturgical calendar / feasts | Prototype demonstration entries | Not imported | **Hold** until source-verified calendar layer is selected |
| Route planning | Prototype supports radius and plan | Not yet in pilot | **Pending**; do not invent routes or GPS entrances |

## Corrected camera behavior

The donor's default sample geography was in France, but the selected TLM pilot is entirely US-based. Opening the TLM mode over Europe creates a blank visible map. `site/explore/lens-camera.js` frames the **actual selected records once after map source load** when they form a geographical cluster. For globally scattered Sacred Places it keeps the world view. No coordinate values are altered or added. Mode changes retain the map user's camera rather than jumping automatically.

## Release contract

1. The 10 church coordinates are matched to the earlier 11 Nov Excel CL2 staging sheet, but `Mapped in production = Yes` refers to an **older research-app snapshot**, not fresh approval of exact visitor entrances.
2. The 18 Sacred Places have source-backed site or complex anchors, not guaranteed entrances.
3. The map is **not** a fully approved 2,582-site registry; main must stay untouched.
4. Screenshots and browser tests cover 320/390/430/1440 EN/FR and real emulated touch, but cannot alone substitute for owner visual acceptance on actual devices.
5. Preserve the research repository unchanged and publish only from GitHub Pages on production main.
6. No parallel Explore PRs: this PR replaces duplicate review PR #3, which was closed without merging.

## Pending design review

- Exact AppDesign spacing/typography/section priorities
- Category medallions and approved institute emblems
- Authentic, source-licensed location photographs
- Fully written Liber Locorum folios
- Canonical Mass schedule feeds, feasts, planning and wider map filters

**Draft — do not merge or deploy.**
