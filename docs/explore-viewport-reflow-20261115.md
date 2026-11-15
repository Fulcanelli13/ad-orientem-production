# Explore: keyboard and landscape reflow QA (15 November 2026)

## Scope

Owner's `AO_Explore_AppDesign.html` remains the design authority
(SHA-256 `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`).
This PR extends the narrow mobile safe-area remediation without
reskinning or replacing that source. The 18 Sacred Places, 10 TLM venues,
all coordinates/identities, licensed photos, source quotations, and
Home V9 design remain unchanged. GitHub Pages main-only deployment is
unchanged.

## Problem found in draft

Explore's sheet snap height was calculated only during route entry or
a manual sheet gesture. A phone browser's layout viewport can contract
after the Explore route is mounted when the soft keyboard opens or the
device rotates. Without reflow, a previously computed 376px peek remains
in `--h` and `--atlas-sheet-height`, while the actual CSS sheet is
clamped by the new viewport. MapLibre may also retain the old canvas
dimensions. During visual-viewport-only keyboard contraction, 100dvh
may continue to describe the full layout viewport, leaving the
directory and navigation under the software keyboard.

## Strictly conditional adaptation

- Recalculate the *existing* sheet state on `window.resize` and
  `visualViewport.resize/scroll`, throttled to one animation frame.
  Resize the **existing** MapLibre instance and update marker placements:
  no remounting, selected-site coordinate shift, camera reset, lens
  switch, new folio, or text changes.
  On route re-entry, clear any stale keyboard class/height after the
  visual keyboard has closed while Explore was hidden; preserve it
  only if the search field remains focused *and* the visual viewport
  is still materially contracted.
- With a visibly shrunken `visualViewport` **while the Explore search
  input has focus only**, use the measured keyboard-visible height for
  `#atlas-view`. The Home tabbar is temporarily hidden; the existing
  sheet docks at the bottom of the usable Explore region, rather than
  behind the soft keyboard. Both revert on blur/viewport restoration.
- At keyboard-size short heights, hide the regular map zoom overlay
  only while typing; map gestures and the source-backed directory
  remain available. In a **coarse-pointer landscape at <=500px height**,
  the wide CSS breakpoint must not apply desktop body gutters to the
  mobile Explore view. The map overlay zoom controls are omitted only
  in that compact landscape where the sheet would cover them.
- The full-height Claude preview snap remains **376px**, minimum
  **150px**, and expanded 62%; the earlier short-height cap stays in
  force. The established visible 7/22/52px marker diameters, 44px
  touch targets, image cards, fonts and navigation are otherwise
  untouched.

## Chromium acceptance

`tests/explore-viewport.mjs` verifies one mounted map while simulating
a layout-viewport keyboard shrinking 390x780 to 390x460 and 390x390,
restoring it, a *test-only* overridden `visualViewport.height=455`
while search is focused, restoring it, then rotating the viewport
to landscape 844x390 and 740x360 before returning to portrait.
It checks search/sheet nonoverlap, geometry, actual sheet CSS height,
tabbar behavior under simulated visual-keyboard contraction, no
horizontal overflow, and source directory search continuity.
It saves screen captures into the standard CI artifact alongside the
normal 320/390/430/1440, gesture, safe-area, photo and outage captures.

**Limitations:** Chromium virtual-viewport resizing and controlled
`visualViewport` property substitution are *synthetic approximations*.
They do not certify WKWebView/iOS Safari keyboard behavior, OEM Android
system bars, app-mode orientation APIs, hardware viewport cutouts,
IME composition, real pinch gestures or physical-device performance.
No actual phone was tested. Owner visual approval and physical-phone
signoff remain open. Draft PR only; no merge or deployment.
