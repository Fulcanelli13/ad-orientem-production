# Explore — Claude marker restoration on the 28-record production pilot
**15 November 2026 | Draft PR #1 only — release remains HOLD**

## Owner-controlled source
Exact original `AO_Explore_AppDesign.html`, verified SHA-256
`97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`.
Relevant original program: `GL`, `gly()`, `.med`, `.med.dot`,
`.med.sm`, `.med.ph`, `levelVis()`, `buildMarkers()`. These define:
- Sacred marker level thresholds **world below 3.3**, **country below 6.6**, then local.
- Original **7px diamond**, **22px gold medallion**, and selected-photo **52px medallion**.
- The exact 24×24 SVG paths for `marian`, `christ`, `saint`, and `church`.
- Collision reduction and selected-marker precedence; the original French counts,
  regional borders and synthetic feast/schedule data are strictly excluded.
- The source TLM `mass-pt` distinguishes **unlit neutral 3.2px dots**
  from glowing **lit** points based on a known, positive Mass-time state.

## Bounded production implementation
- `site/explore/marker-policy.js`: literal original four SVG glyph paths,
  three marker diameters and zoom levels, with no external resources.
  **Only `church`/`cathedral`/`basilica` source types receive the church
  pictogram.** Shrine and pilgrimage types have neutral gold medallions:
  their naming, devotion or likely patronage is not treated as approved
  authoritative `marian`/`christ`/`saint` classification.
- `site/explore.js`: keeps **one MapLibre instance** and the existing 28
  validated records. Creates **18 HTML-based source-pin markers** only for the
  Sacred lens, repositions them from existing lat/lng, and updates their
  size, selection, zoom, collision and data-filter visibility without adding
  or moving a site. HTML marker click opens the same verified Liber Locorum
  folio. Approved original photos appear **only for a selected marker at
  local zoom**; each source remains locally hosted and licensed as before.
- **TLM Atlas:** ten original Excel CL2 pins stay on their existing
  coordinates. Visual color is neutral/unlit (no live schedule or invented
  “next Mass”). An invisible **40px tap hit layer** allows a small dot to
  remain usable. No institute insignia without separately approved assets.
- `site/explore.css`: the original medallion gradients, shadows, sizes and
  noninterfering labels are scoped specifically under `#atlas-view`.
  Claude's search, fixed bottom sheet, 226px photo cards, folios, fonts,
  camera padding, tabbar and overall composition are unchanged.
- **World-wide sparse pilot:** original France country aggregates/region
  banners are not copied. The verified 18 places appear as individual small
  dots at world/country zoom rather than invented national counts.

## Evidence / acceptance
- `tests/explore-markers.mjs` locks 28 identities, 18/10 lens split,
  source-defined 7/22/52 sizes, six photo permissions, and no inferred
  devotional pictograms. The code draws no fake Mass schedule glow.
- `tests/explore-browser.mjs` checks 18 mounted Sacred markers, their
  visibility in the Sacred lens, no Sacred markers in TLM, 40px TLM hit area,
  selected photo at 52px, and an actual marker click opening the matching
  canonical Santiago folio at 390px.
- Existing live map/tile, attribution, 320/390/430/1440 browser, 320/390/430
  CDP touch, source-provenance and deliberately blocked CDN/tiles outage
  checks must all pass on this draft before visual owner review.
- Physical Android/iPhone test and owner acceptance of marker styling,
  selected photo crops, overlays and classification remain **OPEN**.
  This is an implementation candidate, not an automatic aesthetic approval.
- No additional source data imported; no change to original research repo;
  no merge, no production deployment, no Vercel. Main-only GitHub Pages policy
  remains intact.
