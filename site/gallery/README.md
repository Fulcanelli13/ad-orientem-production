# Sacred Art Gallery — first permanent app module

**15 November 2026 — incremental production transfer.**

This is a **new, deliberately scoped** Sacred Art destination inside the existing Ad Orientem mobile app. It is accessible from the permanent Home gallery entrance and by `#gallery`. It does not replace the Claude Home/Mass/Pray/Calendar/Atlas UI, add a bottom tab, or implement a prayer screen.

## What is real today

- `catalogue.v1.json`: **all 862 currently tracked artwork records** (860 historical master records plus two preserved Angelus contextual records), searchable by artwork, artist, collection, scene category and reviewed prayer part.
- **Eight locally held painting image files** (nine historical registry rows link to those eight paintings, including one interim museum-backed thumbnail for which a larger original is still required).
- `gallery.js`: searchable/scrollable gallery, curated-vs-research filter, On display, Angelus review, prayer-matched and image-pending views, and a full-composition painting/detail dialog.
- `gallery.css`: source-derived Cinzel/Cormorant/EB typography and existing Home colours; scoped selectors only.
- `image-provenance.v1.json`: identity, source-rights record, exact Git blob and image-byte trace for all eight on-display photographs, including three improved archived originals and one remaining interim preview.
- No external remote URLs are used for gallery image rendering. Museum URLs are links to source records, not image substitutions.

**Important:** **862 artwork records does not mean 862 locally acquired paintings.** Eight paintings are currently displayed with local image files: six previously held reproductions (two Home JPEGs now replaced with original-size Met JPEGs and three previously staged WebPs), the archived full-size Hondius JPEG now replacing its preview, and one remaining Carracci low-resolution preview. The remaining records appear in the accessible **All records** catalogue as searchable text entries until the exact photo is recovered and verified. Missing photos are not filled with AI art, invented images, arbitrary Commons downloads or expired external previews.

Artwork inclusion in this registry does not itself mean the owner approved it for prayer placement. The separate `owner_selected_artwork`, `prayer_parts`, `exact_prayer_cards`, `eligible_card_count` and image rights fields remain independent.

## Current image use

| Painting | Source | App image |
|---|---|---|
| Carlo Saraceni — *Paradise* | Existing Met CC0 Home image | `site/artwork/saraceni-paradise-v9.jpg` |
| Philippe de Champaigne — *The Annunciation* | Existing Met CC0 Home image, also indexed under `released-photo:angelus` | `site/gallery/images/champaigne-annunciation-met-438724-original.jpg` |
| Jean-Auguste-Dominique Ingres — *The Virgin Adoring the Host* | Existing Met CC0 Home image | `site/gallery/images/ingres-adoration-met-438434-original.jpg` |
| Anthony van Dyck — *The Lance Thrust* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/van-dyck-lance-thrust-2400.webp` |
| Peter Paul Rubens — *The Holy Trinity* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/rubens-holy-trinity-2000.webp` |
| Henry Ossawa Tanner — *The Annunciation* | Public Domain Mark 1.0 reproduction, SHA-verified research original | `site/gallery/images/tanner-annunciation-1920.webp` |
| Abraham Hondius — *Christ among the Doctors* | SHA-verified research-archive full JPEG; independent Met master-photo matching pending | `site/gallery/images/hondius-christ-doctors-met-436672-original.jpg` |
| Annibale Carracci — *The Burial of Christ* | Met-associated archived preview (full-size original pending) | `site/gallery/images/carracci-burial-of-christ-met-438338-preview.webp` |

The three new public WebPs are **gallery reproductions only**. Their prior `app-data/sacred-art/staged-images/` references remain intact, with **prayer-level cinematic/image-quality QA held**. This gallery release is *not* permission to use those files as primary images in Angelus, Rosary, Mass or Calendar.

## Incremental addition process

For each painting submitted or approved later:
1. Find or create its canonical registry record; preserve duplicate historical record IDs when identity reconciliation is unfinished.
2. Verify exact artwork identity, source/reproduction rights and original download. Keep source URL, institution and accession.
3. Acquire a clean, preferably unframed original. Create a high-quality local mobile derivative, preserving the full composition. Note the exact SHA-256, dimensions and image QA.
4. Place it under `site/gallery/images/`, and add the app-local file path and provenance to `catalogue.v1.json` and `image-provenance.v1.json`.
5. Update the gallery counts and run `node tests/sacred-art-gallery.mjs`. Keep any prayer-card primary approval **separate**.
6. Follow the one existing GitHub Pages publish workflow. Do not transfer research PR queues or use a second deployment platform.

Future Claude prayer prototypes will reference this canonical artwork catalogue and its existing owner-approved matching relationships. No prayer re-curation is required to add a gallery image.

## Checks and rollback

The existing `tests/production-shell.mjs`, `tests/prayer-artwork-activation.mjs` and Angelus source tests continue unchanged. The new `tests/sacred-art-gallery.mjs` verifies all 862 records, exact metadata relations, source image files, eight image identities (including one limited preview and three archived originals), no remote gallery image loading, and preservation of the four-tab navigation.

The production branch's premerge commit is the rollback reference. Only the `site/` directory publishes.

### Incremental gallery image batch · 15 November 2026

Two more **previously owner-approved** Met paintings have permanent, locally hosted images. They are *interim previews*, not high-resolution museum originals:

- **Abraham Hondius — *Christ among the Doctors*** (1668), The Met object 436672, accession 1974.368, 410×316 source WebP, 8,434 bytes. Archived owner-approved preview. Museum-backed reproduction: [Met object](https://www.metmuseum.org/art/collection/search/436672), [Met-donated CC0 photo record](https://commons.wikimedia.org/wiki/File:Christ_among_the_Doctors_MET_DP147792.jpg).
- **Annibale Carracci — *The Burial of Christ*** (1595), The Met object 438338, accession 1998.188, 379×470 source WebP, 6,762 bytes. Archived owner-approved preview. Museum-backed reproduction: [Met object](https://www.metmuseum.org/art/collection/search/438338), [Met-donated CC0 photo record](https://commons.wikimedia.org/wiki/File:The_Burial_of_Christ_MET_1998.188.jpg).

The exact WebP bytes are now in `site/gallery/images/`; the museum photo source and pixel dimensions are recorded in `image-provenance.v1.json`. Met catalogue identity and corresponding CC0 photographic rights are documented, but those **8 KB/7 KB archived preview derivatives are NOT a replacement for the verified full-resolution institutional image**. They remain visible only as gallery previews, explicitly marked in the UI. A future original-image recovery should *replace their photos in the same artwork IDs*, never add duplicate artwork records or alter prayer assignments.

**Coverage is now eight physical painting images across nine indexed records**, with 853 catalogue records still awaiting a local image. All 862 artwork entries, all Angelus review relationships and all existing prayer approvals remain unchanged.

### Larger archived originals recovered · 15 November 2026

Three existing owner-selected gallery records now use **real, locally hosted, larger JPEGs**, transferred from the active research archive at pinned commit `14cd9d3ac11a6f27856f4740ae7c81e1b073bf1a`. The transfer was executed by a one-time GitHub Actions job on a feature branch and verified Git object hashes before committing binary files. The Met originals for the first two paintings also match SHA-256 hashes in the approved source manifest.

- **Champaigne, The Annunciation:** Met object 438724; 3,055,151 bytes; 3,741×3,658; museum original SHA-256 `ae59a42e39896646d3d18d4761e04b8ce6fa1d84bfaa9f79bd23f8d72aa95be6`. Both historical catalogue IDs still point to one physical image. The small Home preview is untouched, so the donor design is preserved.
- **Ingres, The Virgin Adoring the Host:** Met object 438434; 2,467,303 bytes; 3,122×3,813; museum original SHA-256 `973f73b66952bf34619cc75c6f6bfb38109a8877e95b48655605576c552ad934`. The small Home preview remains unchanged.
- **Hondius, Christ among the Doctors:** Met object 436672; 2,015,792-byte JPEG copied byte-for-byte from `assets/prayer/released/hondius-doctors-original.jpg`, Git object SHA `29283ed54ca7c9913a6e377d47b74c2b4af0eab1`. The archived file is substantially larger than the interim preview; independent byte-matching to The Met's original photographic master remains outstanding, so provenance does not claim that stronger proof.

The **gallery remains at 862 registry entries, 8 distinct on-display paintings across 9 image-bearing registry records**. No artworks, approvals, prayer cards, bottom tabs, navigation, Claude layouts or deployment platform were changed. The **Carracci burial painting is the only remaining interim low-resolution gallery preview** from this batch. Higher-resolution prayer-screen cinematic approval remains separate from gallery use.
