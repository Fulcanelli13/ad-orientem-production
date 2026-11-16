# Sacred Art Gallery — first permanent app module

**16 November 2026 — source-first, permanent archive migration.**

This is a **new, deliberately scoped** Sacred Art destination inside the existing Ad Orientem mobile app. It is accessible from the permanent Home gallery entrance and by `#gallery`. It does not replace the Claude Home/Mass/Pray/Calendar/Atlas UI, add a bottom tab, or implement a prayer screen.

## What is real today

- `catalogue.v1.json`: **all 862 currently tracked artwork records** (860 historical master records plus two preserved Angelus contextual records), searchable by artwork, artist, collection, scene category and reviewed prayer part.
- **Fifty-four distinct locally hosted artwork images** (fifty-seven historical catalogue records have images; Champaigne, Girardin, and Honthorst each have two records representing a single image).
- `gallery.js`: searchable/scrollable gallery, curated-vs-research filter, On display, Angelus review, prayer-matched and image-pending views, and a full-composition painting/detail dialog.
- `gallery.css`: source-derived Cinzel/Cormorant/EB typography and existing Home colours; scoped selectors only.
- `image-provenance.v1.json`: identity, source-rights record, exact Git blob and image-byte trace for all fifty-four on-display reproductions; the 16 November migration additionally preserves eleven previously released full-resolution original JPEGs byte-for-byte in the permanent production source archive, and introduces five carefully matched gallery derivatives.
- No external remote URLs are used for gallery image rendering. Museum URLs are links to source records, not image substitutions.

**Important:** **862 artwork records does not mean 862 locally acquired paintings.** Fifty-four distinct artworks are now displayed with local files. The 16 November transfer restores already-acquired original files from the research repository, without another round of museum searches, and attaches derivatives only to existing owner-selected gallery records; one historical Sodoma attribution conflict remains held for review. The gallery WebPs retain full artwork composition, downsampled at most to 2,000 pixels on their longest edge. The remaining records appear in the accessible **All records** catalogue as searchable text entries until the exact photo is recovered and verified. Missing photos are not filled with AI art, invented images, arbitrary Commons downloads or expired external previews.

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
| Francesco Solimena — *The Risen Christ Appearing to the Virgin* | Cleveland Museum of Art 1971.63, CC0 | `site/gallery/images/solimena-risen-christ-virgin-cma-1971-63-2000.webp` |
| Jacob Jordaens — *The Betrayal of Christ* | Cleveland Museum of Art 1970.32, CC0 | `site/gallery/images/jordaens-betrayal-christ-cma-1970-32-2000.webp` |
| Juan de Valdés Leal — *Study for the Assumption of the Virgin* | Cleveland Museum of Art 1987.7, CC0 | `site/gallery/images/valdes-leal-assumption-study-cma-1987-7-2000.webp` |
| Unattributed — *Preparation for the Crucifixion* | Cleveland Museum of Art 1916.816, CC0 | `site/gallery/images/preparation-crucifixion-cma-1916-816-2000.webp` |
| Sodoma — *Christ Presented to the People (Ecce Homo)* | Met 437978, public domain | `site/gallery/images/sodoma-ecce-homo-met-437978-2000.webp` |
| Nicolas Poussin — *The Agony in the Garden* | Met 442488, public domain | `site/gallery/images/poussin-agony-garden-met-442488-2000.webp` |
| Bartolomé Esteban Murillo — *The Crucifixion* | Met 437172, public domain | `site/gallery/images/murillo-crucifixion-met-437172-2000.webp` |
| Workshop of Peter Paul Rubens — *Saint Teresa of Avila Interceding for Souls in Purgatory* | Met 437542, public domain; institution credits Rubens directly, catalogue retains workshop attribution | `site/gallery/images/rubens-workshop-teresa-purgatory-met-437542-2000.webp` |
| José Campeche — *The Holy Trinity* | Met 917618, public domain | `site/gallery/images/campeche-trinity-met-917618-2000.webp` |
| Jan van Eyck — *The Annunciation* | National Gallery of Art 46, CC0 | `site/gallery/images/van-eyck-annunciation-nga-46-2000.webp` |
| Master of the Catholic Kings — *Christ among the Doctors* | National Gallery of Art 41656, CC0 | `site/gallery/images/master-catholic-kings-christ-doctors-nga-41656-2000.webp` |
| Bachiacca — *The Flagellation of Christ* | National Gallery of Art 41696, CC0 | `site/gallery/images/bachiacca-flagellation-nga-41696-2000.webp` |
| Lorenzo Lotto — *The Nativity* | National Gallery of Art 431, CC0 | `site/gallery/images/lotto-nativity-nga-431-2000.webp` |
| Netherlandish master — *The Presentation in the Temple* | National Gallery of Art 46127, CC0; NGA gives specific Master of the Prado Adoration title | `site/gallery/images/netherlandish-presentation-nga-46127-2000.webp` |
| Giovanni Girolamo Savoldo — *The Adoration of the Shepherds* | National Gallery of Art 46185, CC0 | `site/gallery/images/savoldo-shepherds-nga-46185-2000.webp` |
| Follower of Rogier van der Weyden — *Christ Appearing to the Virgin* | National Gallery of Art 52, CC0 | `site/gallery/images/weyden-follower-christ-virgin-nga-52-2000.webp` |
| Federico Barocci — *The Annunciation* | Statens Museum for Kunst KMSsp13, public domain | `site/gallery/images/barocci-annunciation-smk-kmssp13-2000.webp` |
| Peter Paul Rubens — *Christ on the Cross* | Statens Museum for Kunst KMSsp186, public domain; workshop qualification in museum production notes | `site/gallery/images/rubens-christ-cross-smk-kmssp186-2000.webp` |
| Carlo Dolci — *Christ's Agony in the Garden* | Statens Museum for Kunst KMSsp48, public domain; 1600px institutional source | `site/gallery/images/dolci-agony-garden-smk-kmssp48-2000.webp` |
| Hendrick ter Brugghen — *Christ Crowned with Thorns* | Statens Museum for Kunst KMSsp365, public domain | `site/gallery/images/ter-brugghen-crowned-thorns-smk-kmssp365-2000.webp` |
| Frantz Clein — *Presentation in the Temple and Baptism of Christ* | Statens Museum for Kunst KMS1168, public domain | `site/gallery/images/frantz-clein-presentation-baptism-smk-kms1168-2000.webp` |

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

The existing `tests/production-shell.mjs`, `tests/prayer-artwork-activation.mjs` and Angelus source tests continue unchanged. The new `tests/sacred-art-gallery.mjs` verifies all 862 records, exact metadata relations, source image files, fifty-four distinct display image identities and eleven additional full-resolution, immutable master originals transferred from previously released research assets, no remote gallery image loading, and preservation of the four-tab navigation.

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

**Batch 05 closeout: 862 catalogue records, 28 physically distinct paintings hosted locally across 30 historical catalogue records; 832 catalogue records awaited images at that point.** The previous 36 Angelus artwork records and all established prayer-part/candidate links remain intact. Home, Calendar, Mass, Rosary, and Claude's presentation are unchanged. No external runtime image dependencies or new deployment mechanism were introduced.

### Gallery image batch 06 · 15 November 2026

Nine further previously owner-selected paintings have been acquired from exact institutional metadata records and incorporated into the same permanent gallery. Their subjects include the Agony in the Garden, Betrayal, Crucifixion, Assumption, post-Resurrection appearance of Christ to the Virgin, Holy Trinity, and Saint Teresa’s intercession for the souls in Purgatory. **No new artwork IDs, prayer-card associations, or prayer interfaces were introduced.**

Four images come from the Cleveland Museum of Art’s CC0 Open Access records and five from the Metropolitan Museum of Art’s public-domain collection. The source-acquisition manifest `app-data/sacred-art/gallery-image-import-batch06.v1.json` records the exact museum object, artist and title, source-image URL, photographic reuse status, source SHA-256 and dimensions, and the SHA-256 and Git blob hash of each uncropped 2,000px local WebP. The original source JPEGs remain on institutional servers; their local preservation is not falsely claimed.

**Attribution hold:** the Cleveland Museum of Art attributes *The Crucifixion* (1916.786) to a **follower of Sodoma**, whereas the inherited artwork registry lists Sodoma without qualification. The object image and reuse rights were verified, but this discrepancy requires a separate curatorial correction. The image was deliberately excluded from the public gallery, not assigned to the old catalogue ID, and documented in the same import manifest under `held_for_attribution_review`. A workshop-versus-master difference also remains recorded in the image provenance for the Rubens *Saint Teresa* painting, whose historical catalogue attribution was preserved.

**Batch 06 closeout: 862 catalogue entries, 37 distinct displayed paintings across 39 image-bearing historical rows; 823 catalogue entries awaited local images at that point.** The 36 Angelus review paintings, historical card links, approvals, Claude interface and the sole GitHub Actions → GitHub Pages publication workflow are unchanged. None of the new images is automatically promoted to a prayer cinematic/default.

### Gallery image batch 07 · 15 November 2026

Twelve additional **previously owner-selected, image-pending** artworks now have source-verified local WebP files: seven from the National Gallery of Art (Washington, USA), and five from the Statens Museum for Kunst (Copenhagen, Denmark).

- **NGA:** Official `NationalGalleryOfArt/opendata` object records and `published_images.csv` were joined using the exact NGA object ID. Each chosen *primary* image had the explicit `openaccess=1` indicator (the NGA CC0 free-use policy); the gallery version was made from the institution's IIIF image service. Original source native dimensions are recorded from NGA metadata, but only a 2,000-pixel institution-served rendition was actually downloaded; we do not claim to store a larger original.
- **SMK:** Each selected object number was matched to its current official museum API record, confirmed `public_domain=true`, checked its creator metadata, and downloaded from the institution's image service. Original Danish museum titles and creator data are preserved in the import manifest rather than silently translated or overwritten.

For every imported image, `app-data/sacred-art/gallery-image-import-batch07.v1.json` records its museum object ID, official metadata source, rights determination, source photo URL, bytes, SHA-256, dimensions, local WebP dimensions, SHA-256 and Git blob SHA. All 12 files live permanently in `site/gallery/images/`. The gallery does not load museum image URLs at runtime.

**Curation distinctions:** SMK's Rubens *Christ on the Cross* record includes a workshop attribution qualification in its production notes; this is recorded in provenance without claiming autograph certainty. Its Carlo Dolci *Agony in the Garden* was served at 1,294×1,600, so its gallery image is clearly marked as a source-limited reproduction, not a 2,000px original or an upscaled picture. NGA's *Presentation in the Temple* has a more specific Master of the Prado “Adoration of the Magi” attribution; the existing broader historical catalogue label remains intact.

**Batch 07 closeout: 862 catalogue records, 49 distinct locally hosted artworks across 51 historical image-bearing records, 811 catalogue records awaiting local images at that point.** The 36 Angelus review records, all prayer and Rosary associations, owner's existing selections, Claude layout, Home, and the GitHub-only publication workflow are unchanged. This is gallery acquisition, not prayer-screen activation.

### Original-master migration · 16 November 2026

**This is a file transfer, not new artwork research.** Earlier Sacred Art work selected and matched paintings, acquired source photos and registered previous releases in `Fulcanelli13/ad-orientem`. The migration now maintains a permanently versioned source inventory in `app-data/sacred-art/source-master-migration-20261116.v1.json`.

The **legacy released-module-paintings registry** and the **22-work research source archive** were reconciled by exact Git blob SHA. They represent **23 different source originals** after deduplication. Three identical original JPEGs (Champaigne's Annunciation, Ingres's Virgin Adoring the Host and Hondius's Christ among the Doctors) already exist in production and were not copied again. Eleven further publicly released source originals have now been transferred **byte-for-byte**, verified against pinned Git source blobs, original SHA-256s (when available), original dimensions and byte counts. They are stored in `app-data/sacred-art/source-masters/`, **outside the `site/` GitHub Pages bundle**.

| Legacy approved module | Exact recovered painting | Original size | Release in this transfer |
|---|---|---:|---|
| joseph | The Dream of Saint Joseph | 18.83 MiB | Gallery (existing selected IDs) |
| heart-jesus | The Heart of Jesus | 1.92 MiB | Gallery (existing selected IDs) |
| heart-mary | The Heart of Mary | 1.86 MiB | Gallery (existing selected IDs) |
| regina | Resurrection of Christ (central panel) | 4.38 MiB | Gallery (existing selected IDs) |
| king | Salvator Mundi | 7.41 MiB | Master archive only |
| visit | The Adoration of the Shepherds | 9.14 MiB | Gallery (existing selected IDs) |
| confession | The Return of the Prodigal Son | 2.88 MiB | Master archive only |
| cavallino | Adoration of the Shepherds | 6.15 MiB | Master archive only |
| girardin | The Trinity | 8.11 MiB | Master archive only |
| latour | The Penitent Magdalen | 3.10 MiB | Master archive only |
| giordano-flight | The Flight into Egypt | 4.63 MiB | Master archive only |

The five display-ready, uncropped gallery WebPs prepared from these masters belong to:
- Philippe de Champaigne — *The Dream of Saint Joseph*
- Peter Paul Rubens — *Resurrection of Christ* (Regina Cæli module)
- Juan Patricio Morlete Ruiz — *The Heart of Jesus* and *The Heart of Mary*
- Gerrit van Honthorst — *The Adoration of the Shepherds* (one image serving two existing catalogue records)

The other six newly transferred masters remain **master-bank assets** without forcing new artwork IDs or owner selections. The original files stay immutable and can be reused for previously approved screens after independent photographic and crop checks.

**Precisely preserved exclusions:** eight distinct sources belong only to the archived research ledger and were not publicly released (some carry rights/quality holds); the *Souls in Purgatory* release has a conflicting non-commercial photographic-use caveat and is retained as a rights-held reference only. Two explicitly rejected reproductions, Restout's *Pentecost* source and Gérôme's *Age of Augustus* source, were not imported. Two approved works have no recoverable source file in that archive. None of these 13 records was misrepresented as a locally published image.

**Current production coverage: 862 original artwork catalogue records; 54 distinct locally displayed images; 57 image-bearing historical records; 805 metadata-only records.** All prior original IDs, 729 selected metadata records, Angelus associations, 267-position research crosswalk, prayer-card approvals and Claude-designed UI remain independent and unchanged. The only deployment mechanism is still GitHub Actions → GitHub Pages. The permanent original-master library can be expanded through **the same deduplicated bulk-transfer ledger**, not repeated museum-by-museum curation batches.
