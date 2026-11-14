# Source precedence — Claude integrated experience

**Recorded 13 November 2026. Visual acceptance is not yet signed off by the owner.**

This document corrects the mistaken assumption that the standalone `Ad_Orientem_Home_V9_Artwork_Calendar_Functions(1).html` was the latest integrated Ad Orientem application.

## Verified donor evidence

1. `Ad_Orientem_Integratedddd_Prototype.zip` (12 November 2026) contains:
   - `Ad_Orientem/index.html` — shared prototype shell;
   - `Ad_Orientem/home.html`, `src/home/home.css`, `src/home/home2.js` — integrated Home, Mass entrance and Calendar;
   - `Ad_Orientem/INTEGRATION_NOTES.md` — supersession rules;
   - `Ad_Orientem/assets/ao.css` — common design system with embedded font families and Cormorant numeral substitution;
   - `Ad_Orientem/assets/fonts/` — five exact WOFF files;
   - `Ad_Orientem/assets/icons/` and `ao-brand-emblem.png` — icon semantics.
2. Integrated Home screenshot evidence dated **13 November 2026**:
   - `post-splash-integrated-home-390(2).png`;
   - `post-splash-integrated-home-320(2).png`.
   These show a day-first hero, liturgical rank and colour, Mass entrance immediately below, compact week rail and owner icon set. Screenshots show an empty brown artwork field; this is **not approval to replace the correctly chosen painting with a blank background**.
3. Fonts in the research typography PR #2925, head commit `2b4b0fee3128fae83c942aff6d5991780bfaf0e5`, match the five WOFF source sizes and bear SIL Open Font License 1.1 notices. The production import allowlist pins Git blob IDs, paths and sizes in `design/approved-visual-asset-import.v1.json`.
4. Current production code contains a **selective source-guided reconstruction**, not an unrestricted import of the integrated prototype.

## Binding supersession

- Latest integrated user decisions supersede older standalone Home V9 experiments where they conflict.
- **Pray opens directly into the interactive church.** The lectern opens the Prayer Book. Do not restore separate Prayer Book / Church top tabs.
- Individual church doors lead to their own painted prayer-family galleries; the west door exits Home; Places offers fast direct entry.
- Explore uses the owner's Sacred Atlas globe-and-pin icon, not a generic search magnifier.
- The shared type families are local Cinzel, Cormorant Garamond and EB Garamond with source-defined metric/numeral behaviour.
- Never copy old research workflows, large data snapshots or the entire 146-entry integrated archive into production automatically.

## What is selectively transferred so far

- Five verified offline WOFFs plus source OFL notices.
- Original owner brand emblem and five navigation/header icons plus the small source SVG Sacred Atlas icon.
- Shared typeface-role CSS and an integrated day-first Home **presentation structure**: date-led hero, Mass entrance, compact week ribbon.
- Existing Home hero now has Celebration / Observance / Gospel positions but the canonical day resolver, full painting selection, Mass text, icon-specific module routing and interactive church engine **remain untransferred**.

## Explicit content holds

Do not fabricate saints/feasts, rank, liturgical colour, local Ordo warnings, selected church context or daily Gospel. A live day-specific Home requires a separately selected, source-audited 1962 calendar/Proper engine and verified artwork identity. This remains a blocker to *full* visual/function acceptance.

The latest screenshot itself cannot prove that an image was correctly loaded, nor can a standalone V9 screenshot prove complete current design parity. Retain issue #2 open until the owner reviews the new Home at 320/390 widths and authorizes the first complete functional module.
