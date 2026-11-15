# Explore — viewport safe-area and compact-height acceptance
**15 November 2026 — draft PR #1 only; not a device approval or release**

## Source contract
The current integration is derived from the owner-approved Claude
`AO_Explore_AppDesign.html` (SHA-256
`97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`),
not a redesign. The source’s card geometry (226px), scrollable folios,
sheet states (minimum 150px, full-height peek 376px and expanded list),
control spacing and cinematography remain authoritative.

## Actual problems and bounded changes
1. The final Explore override `#atlas-view .atlas-top` had
   `padding:14px 14px 18px!important`, which overwrote earlier
   `env(safe-area-inset-top)` declarations. The search field could appear
   below the top edge but within an iPhone cutout/status bar. The effective
   rule now adds the actual top inset **only to top padding**.
2. Source `#atlas-world` and `#atlas-language` controls used a
   forced `top:107px!important`, unadjusted for a top inset. Their
   effective offset is now `calc(107px + env(safe-area-inset-top))`.
3. Source Liber Locorum back/close controls used a fixed `top:50px`.
   They now sit at `calc(50px + env(safe-area-inset-top))`, without
   changing their 40px artwork or desktop appearance.
4. On compact notched mobile viewports, `peek=376px` could overlay the
   source map’s zoom controls after the top UI and safe area consumed the
   available map. The **mobile compact-height** peek is capped by the
   available view height minus the actual measured Home tabbar, a 300px
   source-control reserve, and the measured safe-area top padding. The
   baseline full-height phone remains exactly 376px. Expanded stays 62%
   of available view after the tabbar; minimum stays 150px. Both the
   actual CSS height and `--atlas-sheet-height` animation/status value
   receive the same capped snap value.
5. The Home bottom tabbar already pads for
   `env(safe-area-inset-bottom)`. The fixed sheet already docks above
   `--ao-tabbar`; **no change to those bottom safe-area rules**.

## Test method and limitations
`tests/explore-safe-area.mjs` runs actual MapLibre/Chromium and measures
DOM rectangles, pointer access and visible zoom-button clearance in
five scenarios:
- Baseline 390x780, 0px top/bottom.
- Notched 390x844, 47px top/34px bottom.
- Notched 430x780, 59px top/34px bottom.
- Compact 320x700, 35px top/24px bottom.
- Compact 390x667, 44px top/34px bottom.

Chromium's ordinary headless viewport does **not** create hardware
cutouts. In the test server's CSS responses **only**, occurrences of
`env(safe-area-inset-top/bottom)` are substituted by the scenario's
specified pixel values. Neither production CSS nor platform APIs are
mocked or changed in the app. The test checks header/search, World/FR,
map zoom buttons, sheet handle, tabbar position, bottom gestures area,
exact compact peek, and the Liber Locorum back button, recording
evidence screenshots. All visual sizes and source icons stay unchanged
when safe insets are zero.

This is a synthetic layout and pointer-access gate, **not** a native
notched device, Safari/iOS WKWebView, Android WebView, real home-indicator
gesture, pinch-zoom, keyboard appearance, or landscape certification.
Final owner visual signoff and at least one physical iPhone/Android
test are still open. No site data, coordinates, Mass schedule, paintings,
asset sources, deployment workflow to production, or old research repo
are altered.
