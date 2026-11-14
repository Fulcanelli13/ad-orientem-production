# Claude Explore — exact visual source and integration boundary

**Status:** mandatory source of truth; the current draft renderer is NOT owner-approved.

## Exact original supplied by owner

File: `AO_Explore_AppDesign.html` (ChatGPT upload, 13 Nov 2026). Full-file SHA-256: `97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771`. Size: 4,600,067 bytes. This specification was obtained by **opening the original HTML and parsing its actual CSS and DOM**, not inferred from previously generated screenshots.

The self-contained demo contains a 65,534-character MapLibre CSS bundle, a 985,153-character integrated style block (SHA-256 `fad6ac85cef8c2450e0152d3b767d6bb3868024712dc4898b4ead0a11c7baf50`), an embedded MapLibre v4.7.1 runtime and a 2.7 MB sample dataset/interaction script. **Do not import these bundled vendor files, France-only sample data, embedded demo photography, generated schedules or demonstration phone-frame/status bar into production.** Source geometry and behaviour are the visual contract; the production data boundary remains independent.

## Exact final Claude CSS geometry (not an interpretation)

| Element | Original final rule, resolved from owner HTML | Required production interpretation |
| --- | --- | --- |
| Main search | `.nav`: 46px row; `.sfield`: 44px tall, 16px italic EB Garamond, 16px rounded, smoky translucent dark | Search is the first/top row. Do not place a huge “Sacred geography” heading above it. |
| Two atlases | `.ao-seg`: 3px padding, 12px radius, gap 2px; `.ao-seg button`: EB Garamond 15px, 7px vertical padding, selected gold inset border | Order **TLM Atlas / Sacred Atlas**; these are the two main tabs, not detachable gold buttons. |
| Place selector | `.where`: centre-aligned small Cinzel all-caps chip, 9px/1.5px letter-spacing | Show only source-backed location or broad context; do not invent geographic coverage. |
| Map | `.app` fills the host phone viewport; `#map` is underneath every control | Maintain the single MapLibre canvas and provider attribution. |
| Bottom navigation | `.tabbar`: fixed bottom, 84px in prototype | Keep the updated integrated Claude Home navigation/icons; compensate for its actual 79px+safe-area height, do not copy embedded fake iPhone status bar or PNGs. |
| Sheet | `.sheet`: **edge-to-edge**, `bottom:84px`, `height:var(--h,340px)`, `border-radius:24px 24px 0 0`, charcoal gradient, no side gaps or lower rounded corners | Dock directly to the top of the app's real bottom navigation. The prior floating island with 5–7px edge gaps is incorrect. |
| Drag handle | `.grab`: 20px tall, 38×4px grabber | Retain touch drag, keyboard/tap access without changing size. |
| Sheet subtitle | `.sh-h`: 0 18px 12px; title 26px Cormorant 500; subtitle 14.5px italic EB | The sheet heading comes before the swipe rail, not as a separate page section. |
| Card rail | `.car`: 10px gap, `padding:0 18px 4px`, snap; `.card`: 226px high, `flex-basis:calc(100% - 44px)`, 20px radius | Exactly preserve the horizontal swiping layout/proportions; not 218px guessed cards or a long vertical directory. |
| Image-absent card | `.card .band`: 94px band; matching `.band+.bd` content region | Use source-honest neutral medallion/fallback and clear “no verified photo” as necessary; no fake venue photo or invented next Mass. |
| Approved-image card | `.card .im` full bleed, editorial shadow gradient; `.im+.bd` overlaid at bottom | Populate only with individually approved exact-site images and correct credit. |
| Place profile | `.ov` immersive overlay; `.hero` 548px hero, or `.hero.band` if no approved image; `.ttl`, `.toc`, `.facts`, `.ch`, `.src` | Reproduce existing chapter/navigation structure when sourced data exists; no blank pseudo-sections or invented narratives. |
| Fonts/palette | `--ao-cap` Cinzel; `--ao-corm` Cormorant Garamond; `--ao-serif` EB Garamond; `--ao-bg:#070b11`, `--ao-gold:#c9ad78` | Use the exact approved offline font binaries already in current production main; no font substitutions. |

## Source interaction contract

Actual original DOM hierarchy: `#map`, `.top > .nav > .sfield`, `#coll.ao-seg`, `#where`, `#sheet > #grab + #ways + #shh + #shb`, then persistent `#tabbar`. The source carousel uses `.car` + `.card` with snap; the `#sheet` expands by changing its CSS `--h` height and by drag; `#prof` is a separate immersive profile overlay. **No fake iOS time/notch/frame in production.**

The sample has **201 France churches, 64 sacred places and 50 pilgrimages**; the source file itself says they are a sample, not public catalogue coverage. Its synthetic projected “next Mass” depends on French recurring timetable rules. Such derived times **must not be copied** into the 18 Sacred/10 ICKSP pilot.

## Acceptance and safeguards

1. Before changing a component, identify its exact owner-source selector, typography, geometry and input behaviour. Preserve them without “improvements”.
2. Compare screenshots of the **same interaction state and viewport**. A green function test, shared colour palette or generic “map-first” description does not establish visual parity.
3. Maintain provenance of 28 selected records and ten pinned CL2 Excel coordinates; no new mass times, names, entrance claims, artworks or medallion licences.
4. Use the exact latest integrated Home from `main` as shell; the original Explore's fake phone/status/nav graphics are **demo chrome** and must not replace it.
5. Draft PR #1 is blocked from merge/deploy until these source-based visual criteria pass and the owner accepts the result.

**Prior reconstruction is explicitly not a design donor.** The CSS sizing and layout choices introduced in the staged pilot before this reference comparison are provisional and may be reverted to match Claude, rather than being defended because tests pass.

## Source-aligned implementation pass — 14 November 2026

The exact donor's sheet implementation uses `let SH=330` at boot and
`SNAP={min:150,peek:376,list:0}`, with `snapH("list")` computed as
`Math.round(appH()*.62)`. The CSS fallback `var(--h,340px)` is not the
interactive peek target. The production branch now implements these three
states, with the sheet docked to the actual Home navigation.

The production branch also restores from Claude's original markup and CSS:
search-first header; **TLM Atlas / Sacred Atlas** order; original segmented
control; Cinzel way tabs above the Cormorant sheet heading; horizontal
226px cards with a 94px no-image band; a working Cards/List selector;
source-derived gold-border vector cartography and the same dark/gold palette.
The full original style is documented, rather than bundling its 4.6MB demo.

**Latest proof:** GitHub Actions run
[43587591191](https://github.com/Fulcanelli13/ad-orientem-production/actions/runs/43587591191)
passed both the provenance/source contract job and Chromium at 320, 390, 430,
and 1440 pixels. Screenshot artifact `production-explore-screenshots`.
The browser tests verify the TLM-first state, tabs and search geometry,
navigation-bar docking, 24px top/0px bottom sheet corners, 226px cards,
horizontal scrolling, the real list state, short pointer drags, keyboard
reachability of all three snap states, zoom controls, one map instance,
source-backed folios, and navigation to Home.

**Open interaction issue:** Chromium cancels an automated *long* downward
pointer drag before it reaches the 150px minimum; the short up/down
gestures and keyboard 150px snap pass. Do not claim full touch-gesture
acceptance until that precise long gesture is verified on a physical phone
or fixed and reproduced in a mobile touch test.

**Open visual/content differences:** the donor photograph-led cards have
not been used, because approved exact-site photographs and their credits
were not transferred. The map has sourced global pilot pins rather than
the demo's France-specific region and markers. The source's complete
`Liber Locorum` sections and some symbol treatments require the corresponding
approved content/assets; these must not be fabricated. The newly verified
structural match is **not** final owner pixel approval.
