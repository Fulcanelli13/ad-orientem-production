# Sacred Art Gallery — first permanent app module

**15 November 2026 — incremental production transfer.**

This is a **new, deliberately scoped** Sacred Art destination inside the existing Ad Orientem mobile app. It is accessible from the permanent Home gallery entrance and by `#gallery`. It does not replace the Claude Home/Mass/Pray/Calendar/Atlas UI, add a bottom tab, or implement a prayer screen.

## What is real today

- `catalogue.v1.json`: **all 862 currently tracked artwork records** (860 historical master records plus two preserved Angelus contextual records), searchable by artwork, artist, collection, scene category and reviewed prayer part.
- **Six locally held, actual painting image files** (seven historical registry rows link to those six paintings because the same Metropolitan Museum Champaigne object exists under two record IDs).
- `gallery.js`: searchable/scrollable gallery, curated-vs-research filter, On display, Angelus review, prayer-matched and image-pending views, and a full-composition painting/detail dialog.
- `gallery.css`: source-derived Cinzel/Cormorant/EB typography and existing Home colours; scoped selectors only.
- `image-provenance.v1.json`: identity, source-rights record, exact Git blob and image-byte trace for the six on-display photographs.
- No external remote URLs are used for gallery image rendering. Museum URLs are links to source records, not image substitutions.

**Important:** **862 artwork records does not mean 862 locally acquired paintings.** Exactly six original local reproductions are currently displayed (three pre-existing Home JPEGs, three copied byte-for-byte from approved nonpublished WebP staging). The remaining records appear in the accessible **All records** catalogue as searchable text entries until the exact photo is recovered and verified. Missing photos are not filled with AI art, invented images, arbitrary Commons downloads or expired external previews.

Artwork inclusion in this registry does not itself mean the owner approved it for prayer placement. The separate `owner_selected_artwork`, `prayer_parts`, `exact_prayer_cards`, `eligible_card_count` and image rights fields remain independent.

## Current image use

| Painting | Source | App image |
|---|---|---|
| Carlo Saraceni — *Paradise* | Existing Met CC0 Home image | `site/artwork/saraceni-paradise-v9.jpg` |
| Philippe de Champaigne — *The Annunciation* | Existing Met CC0 Home image, also indexed under `released-photo:angelus` | `site/artwork/champaigne-annunciation-home-v9.jpg` |
| Jean-Auguste-Dominique Ingres — *The Virgin Adoring the Host* | Existing Met CC0 Home image | `site/artwork/ingres-adoration-home-v9.jpg` |
| Anthony van Dyck — *The Lance Thrust* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/van-dyck-lance-thrust-2400.webp` |
| Peter Paul Rubens — *The Holy Trinity* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/rubens-holy-trinity-2000.webp` |
| Henry Ossawa Tanner — *The Annunciation* | Public Domain Mark 1.0 reproduction, SHA-verified research original | `site/gallery/images/tanner-annunciation-1920.webp` |

The three new public WebPs are **gallery reproductions only**. Their prior `app-data/sacred-art/staged-images/` references remain intact, with **prayer-level cinematic/image-quality QA held**. This gallery release is *not* permission to use those files as primary images in Angelus, Rosary, Mass or Calendar.

## Incremental addition process

For each painting submitted or approved later:
1. Find or create its canonical registry record; preserve duplicate historical record IDs when identity reconciliation is unfinished.
2. Verify exact artwork identity, source/reproduction rights and original download. Keep source URL, institution and accession.
3. Acquire a clean, preferably unframed original. Create a high-quality local mobile derivative, preserving the full composition. Note the exact SHA-256, dimensions and image QA.
4. Place it under `site/gallery/images/`, and add the app-local file path and provenance to `catalogue.v1.json` and `image-provenance.v1.json`.
5. Update the gallery counts and run `node tests/sacred-art-gallery.mjs`. Keep any prayer-card primary approval **separate**.
6. Follow the one existing GitHub Pages publish workflow. Do not transfer research PR queues or deploy via Vercel.

Future Claude prayer prototypes will reference this canonical artwork catalogue and its existing owner-approved matching relationships. No prayer re-curation is required to add a gallery image.

## Checks and rollback

The existing `tests/production-shell.mjs`, `tests/prayer-artwork-activation.mjs` and Angelus source tests continue unchanged. The new `tests/sacred-art-gallery.mjs` verifies all 862 records, exact metadata relations, source image files, six image identities, no remote gallery image loading, and preservation of the four-tab navigation.

The production branch's premerge commit is the rollback reference. Only the `site/` directory publishes.
