# Sacred Art Gallery — first permanent app module

**15 November 2026 — incremental production transfer.**

This is a **new, deliberately scoped** Sacred Art destination inside the existing Ad Orientem mobile app. It is accessible from the permanent Home gallery entrance and by `#gallery`. It does not replace the Claude Home/Mass/Pray/Calendar/Atlas UI, add a bottom tab, or implement a prayer screen.

## What is real today

- `catalogue.v1.json`: **all 862 currently tracked artwork records** (860 historical master records plus two preserved Angelus contextual records), searchable by artwork, artist, collection, scene category and reviewed prayer part.
- **Twenty-eight distinct locally hosted painting images** (thirty catalogue records have images; Champaigne and Girardin each have two historical records for one physical artwork).
- `gallery.js`: searchable/scrollable gallery, curated-vs-research filter, On display, Angelus review, prayer-matched and image-pending views, and a full-composition painting/detail dialog.
- `gallery.css`: source-derived Cinzel/Cormorant/EB typography and existing Home colours; scoped selectors only.
- `image-provenance.v1.json`: identity, source-rights record, exact Git blob and image-byte trace for all twenty-eight on-display reproductions, including eleven exact-museum-object-matched, open-access, uncropped gallery WebPs in Batch 05.
- No external remote URLs are used for gallery image rendering. Museum URLs are links to source records, not image substitutions.

**Important:** **862 artwork records does not mean 862 locally acquired paintings.** Twenty-eight distinct paintings are now displayed with local files. The earlier Carracci preview and Saraceni image were upgraded; Batch 04 added six paintings, and Batch 05 added eleven more selected works after exact museum object, artist, title and Open Access licence checks. The gallery WebPs retain full artwork composition, downsampled at most to 2,000 pixels on their longest edge. The remaining records appear in the accessible **All records** catalogue as searchable text entries until the exact photo is recovered and verified. Missing photos are not filled with AI art, invented images, arbitrary Commons downloads or expired external previews.

Artwork inclusion in this registry does not itself mean the owner approved it for prayer placement. The separate `owner_selected_artwork`, `prayer_parts`, `exact_prayer_cards`, `eligible_card_count` and image rights fields remain independent.

## Current image use

| Painting | Source | App image |
|---|---|---|
| Carlo Saraceni — *Paradise* | Verified Met CC0 archive original → full-composition WebP | `site/gallery/images/saraceni-paradise-met-437607-2000.webp` |
| Philippe de Champaigne — *The Annunciation* | Existing Met CC0 Home image, also indexed under `released-photo:angelus` | `site/gallery/images/champaigne-annunciation-met-438724-original.jpg` |
| Jean-Auguste-Dominique Ingres — *The Virgin Adoring the Host* | Existing Met CC0 Home image | `site/gallery/images/ingres-adoration-met-438434-original.jpg` |
| Anthony van Dyck — *The Lance Thrust* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/van-dyck-lance-thrust-2400.webp` |
| Peter Paul Rubens — *The Holy Trinity* | Provenance-recorded KMSKA/Flemish Art Collection CC0 | `site/gallery/images/rubens-holy-trinity-2000.webp` |
| Henry Ossawa Tanner — *The Annunciation* | Public Domain Mark 1.0 reproduction, SHA-verified research original | `site/gallery/images/tanner-annunciation-1920.webp` |
| Abraham Hondius — *Christ among the Doctors* | SHA-verified research-archive full JPEG; independent Met master-photo matching pending | `site/gallery/images/hondius-christ-doctors-met-436672-original.jpg` |
| Annibale Carracci — *The Burial of Christ* | Met-donated CC0 original, 1,270×1,592 → uncropped WebP | `site/gallery/images/carracci-burial-met-438338-1592.webp` |
| Bernardo Cavallino — *Adoration of the Shepherds* | Cleveland Museum of Art CC0, archive-verified original | `site/gallery/images/cavallino-shepherds-cma-1968-100-2000.webp` |
| Laurent Girardin — *The Trinity* | Cleveland Museum of Art CC0, archive-verified original; two catalogue IDs | `site/gallery/images/girardin-trinity-cma-1960-79-2000.webp` |
| Georges de La Tour — *The Penitent Magdalen* | Met Open Access/CC0, archive-verified original | `site/gallery/images/latour-penitent-magdalen-met-436839-2000.webp` |
| Carlo Dolci — *Adoration of the Shepherds* | Cleveland Museum of Art accession 1968.22, CC0 print original | `site/gallery/images/dolci-adoration-shepherds-cma-1968-22-2000.webp` |
| Hendrik van Balen — *The Trinity* | Cleveland Museum of Art accession 1996.26, CC0 print original | `site/gallery/images/van-balen-trinity-cma-1996-26-2000.webp` |
| Bartolomé Esteban Murillo — *The Immaculate Conception* | Cleveland Museum of Art accession 1959.189, CC0 print original | `site/gallery/images/murillo-immaculate-cma-1959-189-2000.webp` |
| German Danube School — *The Visitation* | Cleveland Museum of Art accession 1950.91, CC0 print original | `site/gallery/images/danube-visitation-cma-1950-91-2000.webp` |
| Paolo Veronese and workshop — *The Annunciation* | Cleveland Museum of Art accession 1950.251, CC0 print original | `site/gallery/images/veronese-annunciation-cma-1950-251-2000.webp` |
| Luca Giordano — *The Annunciation* | Met object 436502, public-domain museum primary image | `site/gallery/images/giordano-annunciation-met-436502-2000.webp` |
| Orsola Maddalena Caccia — *Madonna and Child with the Infant Saint John the Baptist* | Met 816514, public domain | `site/gallery/images/caccia-madonna-infant-john-met-816514-2000.webp` |
| Attributed to Bernardino Luini — *Virgin and Child* | Cleveland Museum of Art 1916.812, CC0 | `site/gallery/images/luini-virgin-child-cma-1916-812-2000.webp` |
| Jan Joest of Kalkar — *The Adoration of the Christ Child* | Met 436781, public domain | `site/gallery/images/joest-adoration-christ-child-met-436781-2000.webp` |
| Andrea Mantegna — *The Adoration of the Shepherds* | Met 436966, public domain | `site/gallery/images/mantegna-adoration-shepherds-met-436966-2000.webp` |
| Annibale Carracci — *The Coronation of the Virgin* | Met 435853, public domain | `site/gallery/images/carracci-coronation-virgin-met-435853-2000.webp` |
| Johann König — *The Resurrection of Christ* | Cleveland Museum of Art 2017.192, CC0 | `site/gallery/images/konig-resurrection-cma-2017-192-2000.webp` |
| Joos van Cleve — *The Annunciation* | Met 436791, public domain | `site/gallery/images/joos-van-cleve-annunciation-met-436791-2000.webp` |
| Hans Süss von Kulmbach — *The Ascension of Christ* | Met 436835, public domain | `site/gallery/images/kulmbach-ascension-met-436835-2000.webp` |
| Peter Paul Rubens — *The Coronation of the Virgin* (oil sketch) | Met 437524, public domain | `site/gallery/images/rubens-coronation-sketch-met-437524-2000.webp` |
| Joos van Cleve — *The Last Judgment* | Met 436794, public domain | `site/gallery/images/joos-van-cleve-last-judgment-met-436794-2000.webp` |
| Caravaggio — *The Crucifixion of Saint Andrew* | Cleveland Museum of Art 1976.2, CC0 | `site/gallery/images/caravaggio-crucifixion-andrew-cma-1976-2-2000.webp` |

All gallery WebPs are **gallery reproductions only**. Their prior `app-data/sacred-art/staged-images/` references remain intact, with **prayer-level cinematic/image-quality QA held**. This gallery release is *not* permission to use those files as primary images in Angelus, Rosary, Mass or Calendar.

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

The existing `tests/production-shell.mjs`, `tests/prayer-artwork-activation.mjs` and Angelus source tests continue unchanged. The new `tests/sacred-art-gallery.mjs` verifies all 862 records, exact metadata relations, source image files, twenty-eight distinct image identities (including eleven further institutionally rights-verified Batch 05 derivatives), no remote gallery image loading, and preservation of the four-tab navigation.

The production branch's premerge commit is the rollback reference. Only the `site/` directory publishes.

### Incremental gallery image batch · 15 November 2026

Two more **previously owner-approved** Met paintings have permanent, locally hosted images. They are *interim previews*, not high-resolution museum originals:

- **Abraham Hondius — *Christ among the Doctors*** (1668), The Met object 436672, accession 1974.368, 410×316 source WebP, 8,434 bytes. Archived owner-approved preview. Museum-backed reproduction: [Met object](https://www.metmuseum.org/art/collection/search/436672), [Met-donated CC0 photo record](https://commons.wikimedia.org/wiki/File:Christ_among_the_Doctors_MET_DP147792.jpg).
- **Annibale Carracci — *The Burial of Christ*** (1595), The Met object 438338, accession 1998.188, 379×470 source WebP, 6,762 bytes. Archived owner-approved preview. Museum-backed reproduction: [Met object](https://www.metmuseum.org/art/collection/search/438338), [Met-donated CC0 photo record](https://commons.wikimedia.org/wiki/File:The_Burial_of_Christ_MET_1998.188.jpg).

The exact WebP bytes are now in `site/gallery/images/`; the museum photo source and pixel dimensions are recorded in `image-provenance.v1.json`. Met catalogue identity and corresponding CC0 photographic rights are documented, but those **8 KB/7 KB archived preview derivatives are NOT a replacement for the verified full-resolution institutional image**. They remain visible only as gallery previews, explicitly marked in the UI. A future original-image recovery should *replace their photos in the same artwork IDs*, never add duplicate artwork records or alter prayer assignments.

**At the conclusion of PR #13, coverage was eight physical painting images across nine indexed records**, with 853 catalogue records awaiting a local image. All 862 artwork entries, all Angelus review relationships and all existing prayer approvals remain unchanged.

### Larger archived originals recovered · 15 November 2026

Three existing owner-selected gallery records now use **real, locally hosted, larger JPEGs**, transferred from the active research archive at pinned commit `14cd9d3ac11a6f27856f4740ae7c81e1b073bf1a`. The transfer was executed by a one-time GitHub Actions job on a feature branch and verified Git object hashes before committing binary files. The Met originals for the first two paintings also match SHA-256 hashes in the approved source manifest.

- **Champaigne, The Annunciation:** Met object 438724; 3,055,151 bytes; 3,741×3,658; museum original SHA-256 `ae59a42e39896646d3d18d4761e04b8ce6fa1d84bfaa9f79bd23f8d72aa95be6`. Both historical catalogue IDs still point to one physical image. The small Home preview is untouched, so the donor design is preserved.
- **Ingres, The Virgin Adoring the Host:** Met object 438434; 2,467,303 bytes; 3,122×3,813; museum original SHA-256 `973f73b66952bf34619cc75c6f6bfb38109a8877e95b48655605576c552ad934`. The small Home preview remains unchanged.
- **Hondius, Christ among the Doctors:** Met object 436672; 2,015,792-byte JPEG copied byte-for-byte from `assets/prayer/released/hondius-doctors-original.jpg`, Git object SHA `29283ed54ca7c9913a6e377d47b74c2b4af0eab1`. The archived file is substantially larger than the interim preview; independent byte-matching to The Met's original photographic master remains outstanding, so provenance does not claim that stronger proof.

At the conclusion of PR #14, the **gallery remained at 862 registry entries, 8 distinct on-display paintings across 9 image-bearing registry records**. No artworks, approvals, prayer cards, bottom tabs, navigation, Claude layouts or deployment platform were changed. At that point, **Carracci's burial painting was the only remaining interim low-resolution gallery preview**. Higher-resolution prayer-screen cinematic approval remains separate from gallery use.

### Gallery source recovery batch 03 · 15 November 2026

**Current counts: 862 artwork records; 11 physically displayed paintings; 13 image-bearing catalogue records; 849 entries pending images.**

Five new permanent local image derivatives have been acquired and SHA-256 verified, all from source-matched, already owner-selected works (no prayer placement change):

- **Carracci, The Burial of Christ:** replaces the 379×470 temporary preview with an uncropped 1,270×1,592 WebP of the Met-donated 2017 Wikimedia Commons CC0 source. Original 774,816-byte JPEG is identified by published SHA-1; source download and decoded dimensions were cryptographically validated before gallery conversion. Original source hosted at Wikimedia Commons, not copied to research.
- **Cavallino, Adoration of the Shepherds:** Cleveland Museum of Art accession 1968.100; original 3,400×2,905; uncropped WebP 2,000×1,709.
- **Girardin, The Trinity:** Cleveland Museum of Art accession 1960.79; original 2,830×3,400; uncropped WebP 1,665×2,000. Both historical catalogue records refer to the same single image.
- **Georges de La Tour, The Penitent Magdalen:** Met object 436839; original 2,947×4,000; uncropped WebP 1,473×2,000.
- **Saraceni, Paradise:** Met object 437607; original 3,273×3,695; gallery image upgraded to an uncropped 1,772×2,000 WebP; existing Home painting file remains untouched.

The exact source hashes, binary byte counts, derivative sizes, native image dimensions, rights evidence and pinned research commit are preserved in `app-data/sacred-art/gallery-image-import-batch03.v1.json`, and published image provenance in `site/gallery/image-provenance.v1.json`. Images are hosted locally from `site/gallery/images/`; external museum URLs remain source/rights references, not runtime image dependencies.

This release **does not change** any original IDs, 36 Angelus painting records, their part-level links, prayer-stage defaults, selection status, bottom navigation, design, Home image references or deployment mechanism. The same one GitHub Pages workflow publishes the curated `site/` directory. No additional prayer screens are being integrated.

### Gallery image batch 04 · 15 November 2026

Six previously owner-selected, still-unillustrated catalogue works have acquired **institutional-source, permanently local images**. All images were created as uncropped WebP derivatives whose longest side is 2,000px, retaining full image aspect and subject composition.

The sources were independently verified using the **Cleveland Museum of Art Open Access API** (five objects with `share_license_status=CC0`) and **Metropolitan Museum of Art Collection API** (one object with `isPublicDomain=true`). Before download, the import matched museum accession/object ID, title and artist against the existing catalogue. Each source JPEG's SHA-256, byte size and pixel dimensions are recorded, alongside the derivative's SHA-256, Git blob SHA and dimensions, in `app-data/sacred-art/gallery-image-import-batch04.v1.json`. The gallery holds the WebP derivative; these newly retrieved source JPEGs are **not** claimed as separately archived in the repository.

| Painting | Museum record | Local gallery pixels |
|---|---|---|
| Carlo Dolci — Adoration of the Shepherds | CMA 1968.22 | 1,597×2,000 |
| Hendrik van Balen — The Trinity | CMA 1996.26 | 1,600×2,000 |
| Bartolomé Esteban Murillo — The Immaculate Conception | CMA 1959.189 | 1,148×2,000 |
| German Danube School — The Visitation | CMA 1950.91 | 1,481×2,000 |
| Paolo Veronese and workshop — The Annunciation | CMA 1950.251 | 1,801×2,000 |
| Luca Giordano — The Annunciation | Met object 436502 | 1,463×2,000 |

**Batch 04 closeout: 862 original catalogue entries; 17 distinct paintings with local images, represented by 19 catalogue entries; 843 image-pending records at that point.** No painting IDs, prior owner selections, Angelus relationships, prayer defaults, Claude-designed Home screens, or gallery presentation rules were changed. Existing non-certified historical rights notes remain unchanged; the separate verified photographic rights evidence is held in image provenance and the acquisition manifest. No outside image URLs are used at runtime.

The only deployment remains GitHub Actions → GitHub Pages, publishing the curated `site/` directory. This batch imports no new prayer prototype.


### Gallery image batch 05 · 15 November 2026

Eleven further **previously selected** artworks, including the owner-approved infant-Jesus paintings by Caccia and attributed to Luini, now have permanent locally hosted images. These are not new catalogue entries or new prayer-screen defaults.

The acquisition workflow validated each museum's **exact accession/object ID**, official **title and artist attribution**, **CC0 / public-domain status**, and linked primary/print museum source JPEG. All source image sizes, SHA-256 checksums, official metadata records and the resulting uncropped WebP derivatives' hashes and dimensions are preserved in `app-data/sacred-art/gallery-image-import-batch05.v1.json`. Every image in this batch has its longer side at **2,000px**, and no painting was cropped.

Eight source photographs are from The Met Open Access / public-domain collection and three from Cleveland Museum of Art CC0 Open Access. These images were sourced from the museums' APIs; the original JPEGs are **not claimed to be separately preserved in production**. The permanent gallery WebP files are in `site/gallery/images/`.

**Current coverage: 862 catalogue records, 28 physically distinct paintings hosted locally across 30 historical catalogue records; 832 catalogue records still awaiting images.** The previous 36 Angelus artwork records and all established prayer-part/candidate links remain intact. Home, Calendar, Mass, Rosary, and Claude's presentation are unchanged. No external runtime image dependencies or new deployment mechanism were introduced.
