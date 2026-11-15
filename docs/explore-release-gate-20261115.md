# Explore release gate — provider, attribution and owner acceptance
**15 November 2026 | draft production PR #1 only. NOT merged or deployed.**

## Current source-controlled pilot
- Repository/branch: `Fulcanelli13/ad-orientem-production` / `transfer/explore-selected-core-20261113`.
- Exact donor: owner-authored `AO_Explore_AppDesign.html` (SHA-256 `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`). This takes visual precedence over any assistant redesign.
- 18 source-matched Sacred Places and 10 Excel CL2-anchored ICKSP venues; no inferred entrances or live Mass times. Six Sacred Places have exact owner-selected, SHA-256-verified photographs with source/rights credits. The other twelve Sacred sites and ten TLM venues retain a no-photo symbol.
- The corrected Claude camera insets keep Place pins visible above the bottom sheet. [CI run #43673500677](https://github.com/Fulcanelli13/ad-orientem-production/actions/runs/43673500677) passed viewport geometry and Chromium mobile touch emulation. These are not actual physical device tests.
- Publication pipeline: **GitHub Actions + GitHub Pages from `main` only**, curated `site/` output. No Vercel use or deployment from this draft PR.

## External runtime and rights verification (checked 15 November 2026)

| Provider / function | Current exact integration | Terms and cost finding | Residual risk |
| --- | --- | --- | --- |
| OpenFreeMap vector tiles | `https://tiles.openfreemap.org/planet` | Public instance: free ordinary map views/requests, no API key/account, commercial usage allowed; attribution mandatory. [Provider](https://openfreemap.org/), [Terms — updated 14 Oct 2026](https://openfreemap.org/tos/) | As-is service; no uptime SLA; may discontinue or change terms without notice |
| OpenFreeMap glyphs | `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf` | Same public service/provider; third-party network requests and their [privacy policy](https://openfreemap.org/privacy/) apply | Offline map labels unavailable on network failure |
| MapLibre GL JS | Version `6.13.0` pinned via `https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs` and matching stylesheet | [BSD-3-Clause open-source licence](https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt); permitted in this static website | Runtime JavaScript and CSS still loaded from external CDN |
| UNPKG CDN | External MapLibre assets | [Free, as-is, no contractual SLA](https://unpkg.com/about) | Outage prevents map initialization; source-backed list remains readable |
| Image derivatives | Six exact owner-selected, local WebP files; no runtime Commons downloads | One CC0 1.0 and five CC BY-SA 4.0; source, photographer, original link, licence and WebP-change notice tracked in `review/explore-photo-candidates/manifest.v1.json` | Owner visual signoff/crop and attribution readability remain OPEN |

**Attribution:** OpenFreeMap states that use of MapLibre supplies automatic attribution. The browser gate now asserts that the rendered MapLibre attribution control actually contains **OpenStreetMap** and **OpenMapTiles** at 320, 390, 430 and 1440 pixels; an attribution **container alone** is not considered adequate. [Attribution guidance](https://openfreemap.org/). Any failure must be resolved before an accepted release. This is a source-credit requirement, not a design change.

**Privacy:** Third-party map/CDN requests necessarily reach those providers; avoid claiming the entire Explore experience is offline or data-free. OpenFreeMap's [privacy policy, 8 Oct 2026](https://openfreemap.org/privacy/) says ordinary access logs are anonymized, error logs may temporarily include IP addresses (typically seven days), and additional temporary logs may be enabled during security incidents (up to 30 days). Cloudflare may process requests. The app only requests device location after the explicit *Near me* action; it does not silently geolocate users on page load.

**Offline and automated access:** Do not introduce bulk tiles, background downloaders, service-worker offline packs, or automatic map scraping. Current provider terms permit offline-area downloads only within limits (**≤3,000 tiles or 50 MB per download; ≤4 concurrent requests; unique identifying User-Agent**); that capability is **not implemented** and would require a separate review. See the [14 Oct 2026 Terms](https://openfreemap.org/tos/).

## Remaining decision gates

1. **Owner final UI acceptance:** inspect the original Claude source and production screenshots in the same state/width, including photo readability, gradient, captions, folio focus and map interactions. No inferred acceptance from green tests.
2. **Physical smartphone check:** real Android/iPhone touch gestures and external network performance are not established by Chromium emulation; keep this as an outstanding acceptance task.
3. **Map provider availability and attribution:** CI must verify source-credit text as well as map/tiles/camera readiness. No SLA exists; retain the readable place-list fallback and avoid unsupported offline promises.
4. **Editorial staging:** 12 Sacred and 10 TLM site photos remain withheld; deeper Liber Locorum chapters, canonical Mass times, emblems and any more locations are separate owner-approved transfers. No invented content.
5. **Publication:** explicitly approve this PR before merging; the only public path is production `main` → GitHub Actions → GitHub Pages. The old research repository remains active.

**Release decision: HOLD.** Browser checks prove functional behaviour of the limited pilot, **not** final visual/physical-device acceptance or reliability of external third parties. Terms may change; recheck near a public release.
