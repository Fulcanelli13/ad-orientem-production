# Explore PR #11 — real-phone acceptance procedure

**Status: preparation only.** This procedure does not constitute physical-device testing, owner visual approval or release authorization. The live GitHub Pages site stays on `main`; Explore PR #11 remains draft.

## Non-deployed review copy

The read-only `Review selected Explore core` GitHub Actions workflow packages the exact candidate `site/` files as an artifact named `explore-local-phone-preview`. It does **not** publish a branch, change Pages configuration, invoke a paid host or merge anything.

1. Open the latest **successful run for PR #11's current commit**, then download `explore-local-phone-preview` from the run's **Artifacts**. Unzip locally. The directory containing `index.html` is the preview root.
2. On the computer, in that directory, run `py -m http.server 8000 --bind 0.0.0.0` (Windows with Python installed) or `python3 -m http.server 8000 --bind 0.0.0.0` (macOS/Linux).
3. Connect the computer and phone to the same **private/trusted Wi-Fi network**. Use the computer's LAN IPv4 address, not `localhost`, in the phone's browser: `http://LAN_IP:8000/`. Windows Firewall may prompt for private-network access. Shut down the server when done. No internet-facing port forwarding.
4. The local site loads fonts, basemap and WebGL code from existing third-party HTTPS endpoints; the phone needs internet connectivity for the live map. If those resources fail, the verified 28-place list should remain usable.

**Important limitation:** browsers require a secure origin for geolocation, so the `Near me` feature cannot be approved through an ordinary LAN HTTP preview. Do not interpret a local-preview geolocation failure as a product defect, and do not request users' coordinates. A later HTTPS environment is required to test geolocation lawfully and with consent.

## Real-device observations required

Record device model, OS version, browser/version, portrait/landscape orientation, and whether the map loaded. Perform the following on **a real iPhone using Safari** and **a real Android phone using Chrome**, if available:

| Test | Required observation |
| --- | --- |
| Initial entry | Home → Explore; no blank/blocked screen and exactly one Atlas/map surface |
| Top and bottom safe areas | Search, Atlas switch, World View and language button are visible and tappable, including around camera notch, status bar and navigation edge |
| Lenses | TLM and Sacred toggles change records correctly; 10 TLM and 18 Sacred place entries in unfiltered views |
| Search | Typing a place name filters cards and pins; tapping a result works; closing the keyboard restores map/sheet geometry |
| Card rail | Horizontal finger swipe changes cards without dragging the map or the entire page |
| Sheet | Vertical drag transitions among min, peek and expanded, then returns without a stuck drag or rubber-band |
| Folio | Tapping a card or pin opens a readable source-backed place folio; Back returns to the same lens and card |
| Map | One-finger pan, two-finger zoom and World View operate without obscuring the sheet; attribution info/credits accessible |
| Language | EN ↔ FR changes labels/cards without losing the selected lens |
| Rotation | Switch landscape and return to portrait; all controls remain usable, no duplicate canvas or clipped sheet |
| Resource outage | Disable phone internet after opening the place list; local place records continue to work even if map tiles fail |
| Cross-module | Home → Gallery → Home → Explore works, with no lost Gallery content |

The donor `AO_Explore_AppDesign(1).html` is the design reference. The France demo content is **not** production data; do not fail a test solely because demo counts, Mass schedules, images or regional options are absent.

## Reporting and decision

For each device, record **PASS / FAIL / NOT TESTED** per row and attach screenshots or a short video for failures (especially card/swipe, keyboard, notch and rotation). Any confirmed blocker should be fixed on draft PR #11 and rerun through CI.

Browser automation (`Chromium`/Playwright `WebKit`) is useful supporting evidence but **cannot** be substituted for real iOS Safari/Android Chrome observations. PR #11 stays **draft / unmerged / undeployed** until owner design acceptance and physical tests are complete, followed by explicit authorization to publish.
