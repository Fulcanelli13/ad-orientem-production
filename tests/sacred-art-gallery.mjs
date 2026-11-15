import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(base,p),'utf8');
const json = p => JSON.parse(read(p));
const index = json('app-data/sacred-art/artwork-assignment-index.v2.json');
const gallery = json('site/gallery/catalogue.v1.json');
const images = json('site/gallery/image-provenance.v1.json');
const importEvidence = json('app-data/sacred-art/gallery-image-import-batch03.v1.json');
const batch04 = json('app-data/sacred-art/gallery-image-import-batch04.v1.json');
const batch05 = json('app-data/sacred-art/gallery-image-import-batch05.v1.json');
const batch06 = json('app-data/sacred-art/gallery-image-import-batch06.v1.json');
const batch07 = json('app-data/sacred-art/gallery-image-import-batch07.v1.json');
const staged = json('app-data/sacred-art/staged-image-provenance.v1.json');
const angelus = json('site/prayers/angelus-part-paintings.v1.json');
const html = read('site/index.html');
const app = read('site/app.js');
const js = read('site/gallery/gallery.js');
const css = read('site/gallery/gallery.css');

assert.equal(gallery.schema, 'ao.sacred-art.gallery.v1');
assert.equal(gallery.records.length, 862);
assert.equal(gallery.counts.total_records, 862);
assert.equal(gallery.counts.angelus_review_records, 36);
assert.equal(gallery.counts.unassigned, 611);
assert.equal(gallery.counts.distinct_locally_hosted_paintings, 49);
assert.equal(gallery.counts.image_available_records, 51);
assert.equal(gallery.records.filter(x => x.image !== null).length, 51);
assert.equal(gallery.records.filter(x => x.prayer_parts.length).length, 36);
assert.equal(new Set(gallery.records.map(x => x.id)).size, 862);
assert.deepEqual(new Set(gallery.records.map(x => x.id)),
  new Set(index.artworks.map(x => x.artwork_id)), 'Gallery must include every registry record');

for (const original of index.artworks) {
  const work = gallery.records.find(x => x.id === original.artwork_id);
  assert(work);
  assert.equal(work.title,original.title||'Untitled');
  assert.equal(work.artist,original.artist||'Artist not documented');
  assert.deepEqual(work.exact_prayer_cards,original.owner_approved_exact_card_ids);
  assert.equal(work.eligible_card_count,original.candidate_prayer_card_ids.length);
  assert.equal(work.attribution_status,original.attribution_status);
  assert.equal(work.owner_selected_artwork,
    /OWNER_SELECTED|OWNER_APPROVED|APPROVED_BY_USER|OWNER APPROVED|APPROVED_LOCKED|FINAL_MODULE_HERO_APPROVAL|PLACEMENT_KEEP|^APPROVED_5/.test(original.artwork_record_state));
}
for (const original of angelus.artworks) {
  const record=gallery.records.find(x=>x.id===original.artwork_id);
  assert(record?.prayer_parts?.length,'Missing Angelus part:'+original.artwork_id);
  assert.equal(record.prayer_parts.length,
    angelus.part_artwork_links.filter(x=>x.artwork_id===original.artwork_id).length);
}
assert.equal(images.sources.length,49);
assert.equal(gallery.counts.verified_image_files,49);
const verifiedArchiveOriginalIds = new Set(['CANONICAL::ART-hilippe-de-hampaigne-he-nnunciation','CANONICAL::met-438434','CANONICAL::met-436672']);
const srcFiles = new Set();
for (const art of gallery.records) {
  assert(!art.image || art.image.src.startsWith('./'));
  if (!art.image) continue;
  const file = resolve(base,'site',art.image.src.slice(2));
  assert(existsSync(file), 'Locally hosted painting does not exist: ' + art.id);
  const bytes = readFileSync(file);
  assert(bytes.length >= (art.image.quality?.startsWith('LOW_RES_PREVIEW') ? 6000 : 15000), 'Unexpected image size: '+file);
  assert(bytes[0]===0xff && bytes[1]===0xd8 ||
    bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP',
    'Incorrect image format');
  srcFiles.add('site/'+art.image.src.slice(2));
}
assert.equal(srcFiles.size,49);
for (const entry of images.sources) {
  assert(srcFiles.has(entry.path));
  assert.equal(statSync(resolve(base,entry.path)).size,entry.image_bytes);
  const blob = readFileSync(resolve(base,entry.path));
  assert.equal(createHash('sha1').update('blob '+blob.length+'\0').update(blob).digest('hex'),entry.git_blob_sha,'Source Git blob hash mismatch: '+entry.path);
  if (entry.sha256) assert.equal(createHash('sha256').update(blob).digest('hex'),entry.sha256,'Original SHA256 mismatch: '+entry.path);
  if (entry.path.startsWith('site/gallery/images/') && staged.staged_images.some(x=>x.work_id===entry.artwork_id)) {
    const match = staged.staged_images.find(x=>x.work_id===entry.artwork_id);
    assert(match,'Missing staged provenance');
    assert.equal(entry.git_blob_sha,match.git_blob_sha);
    const stagedBytes = readFileSync(resolve(base,match.path));
    const galleryBytes = readFileSync(resolve(base,entry.path));
    assert.deepEqual(galleryBytes,stagedBytes,'Copied image must be byte-for-byte identical');
  }
}
assert.equal(images.sources.filter(x=>x.quality_gate==='INTERIM_GALLERY_PREVIEW_ONLY__ORIGINAL_IMAGE_NOT_TRANSFERRED').length,0);
assert.equal(importEvidence.schema,'ao.sacred-art.gallery-image-import.v1');
assert.equal(importEvidence.sources.length,5);
assert.equal(new Set(importEvidence.sources.flatMap(x=>x.artwork_ids)).size,6);
for (const entry of importEvidence.sources) {
  const file=resolve(base,entry.local_path);
  assert(existsSync(file),'Missing imported archive-backed gallery image');
  const bytes=readFileSync(file);
  assert.equal(bytes.length,entry.local_bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.local_sha256);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\\0'.replace('\\0','\0')).update(bytes).digest('hex'),entry.local_git_blob_sha);
  assert.equal(entry.no_crop,true);
  assert(entry.local_dimensions_px.every(x=>x>=1000));
  assert(entry.evidence.startsWith('https://'));
  for (const id of entry.artwork_ids) {
    const work=gallery.records.find(x=>x.id===id);
    assert(work?.owner_selected_artwork,'Gallery image limited to existing owner-selected work');
    assert.equal(work.image?.src,'./'+entry.local_path.slice('site/'.length));
    assert.equal(work.image?.usage,'GALLERY_IMAGE_ONLY__PRAYER_ASSIGNMENTS_UNCHANGED');
  }
  const photo=images.sources.find(x=>x.path===entry.local_path);
  assert(photo?.release_scope==='GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  assert.equal(photo?.sha256,entry.local_sha256);
}
assert.equal(importEvidence.sources.filter(x=>x.key==='carracci').length,1);
assert.equal(importEvidence.sources.find(x=>x.key==='carracci').original_preserved_in_research,false);
assert.equal(gallery.records.find(x=>x.id==='CANONICAL::met-438338').image.pixel_height,1592);
// Batch 04: six new exact museum objects; do not create new artwork records or prayer approvals.
assert.equal(batch04.schema,'ao.sacred-art.gallery-image-import.v1');
assert.equal(batch04.batch,'2026-11-15-batch04');
assert.equal(batch04.sources.length,6);
assert.equal(new Set(batch04.sources.map(x=>x.artwork_id)).size,6);
assert.equal(batch04.sources.filter(x=>x.museum==='CMA').length,5);
assert.equal(batch04.sources.filter(x=>x.museum==='MET').length,1);
for(const src of batch04.sources){
  const work=gallery.records.find(x=>x.id===src.artwork_id);
  assert(work?.owner_selected_artwork,'New image cannot imply unselected art');
  assert.equal(work.title,src.title,'Museum artwork identity must match existing catalogue');
  assert.equal(work.image?.src,'./'+src.local_path.slice('site/'.length));
  assert.equal(work.image?.usage,'GALLERY_IMAGE_ONLY__PRAYER_ASSIGNMENTS_UNCHANGED');
  assert.equal(work.image?.quality,'UNCROPPED_2000PX_LOCAL_WEBP__INSTITUTIONAL_SOURCE_VERIFIED');
  assert.deepEqual([work.image.pixel_width,work.image.pixel_height],src.local_dimensions_px);
  assert.equal(src.uncropped,true);
  assert.equal(src.source_original_persisted_in_production,false);
  assert(src.source_dimensions_px.every(x=>x>=1800),'Source print/master dimensions must be substantive');
  assert.equal(Math.max(...src.local_dimensions_px),2000);
  assert(src.source_bytes>100000 && src.local_bytes>100000);
  assert(src.museum_api_url.startsWith('https://'),'Source must have real museum API verification');
  if(src.museum==='CMA') {
    assert.equal(src.image_license_status,'CC0');
    assert(src.museum_api_url.startsWith('https://openaccess-api.clevelandart.org/api/artworks/'));
    assert(src.source_url.startsWith('https://openaccess-cdn.clevelandart.org/'));
  }else{
    assert.equal(src.image_license_status,'PUBLIC_DOMAIN');
    assert.equal(src.object_id,436502);
    assert(src.source_url.startsWith('https://images.metmuseum.org/'));
  }
  const bytes=readFileSync(resolve(base,src.local_path));
  assert.equal(bytes.length,src.local_bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),src.local_sha256);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),src.local_git_blob_sha);
  const image=images.sources.find(x=>x.artwork_id===src.artwork_id);
  assert(image,'Published provenance entry missing');
  assert.equal(image.path,src.local_path);
  assert.equal(image.source_sha256,src.source_sha256);
  assert.equal(image.sha256,src.local_sha256);
  assert.equal(image.release_scope,'GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  const original=index.artworks.find(x=>x.artwork_id===src.artwork_id);
  assert.deepEqual(work.exact_prayer_cards,original.owner_approved_exact_card_ids);
}
// Batch 05: 11 exact museum-owned selected works; do not create new artwork records.
assert.equal(batch05.schema,'ao.sacred-art.gallery-image-import.v1');
assert.equal(batch05.batch,'2026-11-15-batch05');
assert.equal(batch05.sources.length,11);
assert.deepEqual(batch05.skipped,[]);
assert.equal(new Set(batch05.sources.map(x=>x.artwork_id)).size,11);
assert.equal(batch05.sources.filter(x=>x.museum==='CMA').length,3);
assert.equal(batch05.sources.filter(x=>x.museum==='MET').length,8);
for (const src of batch05.sources) {
  const art=gallery.records.find(x=>x.id===src.artwork_id);
  assert(art?.owner_selected_artwork,'Images require prior owner selection');
  assert.equal(art.image?.src,'./'+src.local_path.slice('site/'.length));
  assert.equal(art.image?.usage,'GALLERY_IMAGE_ONLY__PRAYER_ASSIGNMENTS_UNCHANGED');
  assert.equal(art.image?.quality,'UNCROPPED_2000PX_LOCAL_WEBP__INSTITUTIONAL_SOURCE_VERIFIED');
  assert.deepEqual([art.image.pixel_width,art.image.pixel_height],src.local_dimensions_px);
  assert.equal(src.full_composition,true);
  assert.equal(src.source_original_locally_persisted,false);
  assert(src.source_dimensions_px.every(x=>x>1000));
  assert.equal(Math.max(...src.local_dimensions_px),2000);
  assert(src.source_bytes>100000 && src.local_bytes>100000);
  assert(/^[a-f0-9]{64}$/.test(src.source_sha256),'Archive source hash required');
  assert(src.museum_api_url.startsWith('https://'));
  assert(src.museum_page.startsWith('https://'));
  if (src.museum==='CMA') {
    assert.equal(src.official_license,'CC0');
    assert(src.museum_api_url.startsWith('https://openaccess-api.clevelandart.org/'));
    assert(src.source_image_url.startsWith('https://openaccess-cdn.clevelandart.org/'));
  } else {
    assert.equal(src.official_license,'PUBLIC_DOMAIN');
    assert(src.museum_api_url.startsWith('https://collectionapi.metmuseum.org/'));
    assert(src.source_image_url.startsWith('https://images.metmuseum.org/'));
  }
  const blob=readFileSync(resolve(base,src.local_path));
  assert.equal(blob.length,src.local_bytes);
  assert.equal(createHash('sha256').update(blob).digest('hex'),src.local_sha256);
  assert.equal(createHash('sha1').update('blob '+blob.length+'\0').update(blob).digest('hex'),src.local_git_blob_sha);
  const record=images.sources.find(x=>x.path===src.local_path);
  assert.equal(record?.artwork_id,src.artwork_id);
  assert.equal(record?.source_sha256,src.source_sha256);
  assert.equal(record?.sha256,src.local_sha256);
  assert.equal(record?.release_scope,'GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  const prior=index.artworks.find(x=>x.artwork_id===src.artwork_id);
  assert.deepEqual(art.exact_prayer_cards,prior.owner_approved_exact_card_ids);
}
// Batch 06 adds only existing owner-selected works with museum-verified images.
// A source attributed by the institution to a follower of Sodoma is held out of
// public use until the inherited catalogue's direct attribution is reconciled.
assert.equal(batch06.schema,'ao.sacred-art.gallery-image-import.v1');
assert.equal(batch06.batch,'2026-11-15-batch06');
assert.equal(batch06.sources.length,9);
assert.deepEqual(batch06.skipped,[]);
assert.equal(batch06.held_for_attribution_review.length,1);
assert.equal(batch06.held_for_attribution_review[0].artwork_id,'CANONICAL::cma-97147');
assert.equal(batch06.held_for_attribution_review[0].image_not_published,true);
assert.equal(gallery.records.find(x=>x.id==='CANONICAL::cma-97147').image,null);
assert.equal(new Set(batch06.sources.map(x=>x.artwork_id)).size,9);
assert.equal(batch06.sources.filter(x=>x.museum==='CMA').length,4);
assert.equal(batch06.sources.filter(x=>x.museum==='MET').length,5);
for (const src of batch06.sources) {
  const art=gallery.records.find(x=>x.id===src.artwork_id);
  assert(art?.owner_selected_artwork);
  assert.equal(art.image?.src,'./'+src.local_path.slice('site/'.length));
  assert.equal(art.image?.usage,'GALLERY_IMAGE_ONLY__PRAYER_ASSIGNMENTS_UNCHANGED');
  assert.equal(art.image?.quality,'UNCROPPED_2000PX_LOCAL_WEBP__INSTITUTIONAL_SOURCE_VERIFIED');
  assert.deepEqual([art.image.pixel_width,art.image.pixel_height],src.local_dimensions_px);
  assert.equal(src.full_composition,true);
  assert.equal(src.source_original_locally_persisted,false);
  assert(src.source_dimensions_px.every(x=>x>=700));
  assert.equal(Math.max(...src.local_dimensions_px),2000);
  assert(src.source_bytes>100000 && src.local_bytes>100000);
  assert(/^[a-f0-9]{64}$/.test(src.source_sha256));
  assert(src.museum_page.startsWith('https://'));
  if (src.museum==='CMA'){
    assert.equal(src.official_license,'CC0');
    assert(src.museum_api_url.startsWith('https://openaccess-api.clevelandart.org/'));
    assert(src.source_image_url.startsWith('https://openaccess-cdn.clevelandart.org/'));
  }else{
    assert.equal(src.official_license,'PUBLIC_DOMAIN');
    assert(src.museum_api_url.startsWith('https://collectionapi.metmuseum.org/'));
    assert(src.source_image_url.startsWith('https://images.metmuseum.org/'));
  }
  const bytes=readFileSync(resolve(base,src.local_path));
  assert.equal(bytes.length,src.local_bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),src.local_sha256);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),src.local_git_blob_sha);
  const proof=images.sources.find(x=>x.path===src.local_path);
  assert.equal(proof?.artwork_id,src.artwork_id);
  assert.equal(proof?.source_sha256,src.source_sha256);
  assert.equal(proof?.sha256,src.local_sha256);
  assert.equal(proof?.release_scope,'GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  const prior=index.artworks.find(x=>x.artwork_id===src.artwork_id);
  assert.deepEqual(art.exact_prayer_cards,prior.owner_approved_exact_card_ids);
}
assert(gallery.records.find(x=>x.id==='CANONICAL::met-437542').image.provenance.includes('Workshop'));
// Cross-museum Batch 07: seven NGA Open Access image records and five
// SMK public-domain images, verified against existing owner-selected IDs.
assert.equal(batch07.schema,'ao.sacred-art.gallery-image-import.v1');
assert.equal(batch07.batch,'2026-11-15-batch07');
assert.equal(batch07.sources.length,12);
assert.deepEqual(batch07.skipped,[]);
assert.deepEqual(batch07.source_failures,[]);
assert.equal(new Set(batch07.sources.map(x=>x.artwork_id)).size,12);
assert.equal(batch07.sources.filter(x=>x.museum==='NGA').length,7);
assert.equal(batch07.sources.filter(x=>x.museum==='SMK').length,5);
assert(batch07.curatorial_qualifications['REVIEW::smk:KMSSP186'].includes('workshop'));
assert(batch07.curatorial_qualifications['REVIEW::smk:KMSSP48'].includes('1600'));
assert.equal(gallery.records.find(x=>x.id==='CANONICAL::cma-97147').image,null);
for(const src of batch07.sources){
  const art=gallery.records.find(x=>x.id===src.artwork_id);
  assert(art?.owner_selected_artwork,'Batch 07 may display only previously owner-selected artworks');
  assert.equal(art.image?.src,'./'+src.local_path.slice('site/'.length));
  assert.equal(art.image?.usage,'GALLERY_IMAGE_ONLY__PRAYER_ASSIGNMENTS_UNCHANGED');
  assert.equal(art.image?.pixel_width,src.local_dimensions_px[0]);
  assert.equal(art.image?.pixel_height,src.local_dimensions_px[1]);
  assert(src.full_composition);
  assert.equal(src.source_original_locally_persisted,false);
  assert(src.source_bytes>=20000 && src.local_bytes>=20000);
  assert(src.source_dimensions_px.every(n=>n>500));
  assert(Math.max(...src.local_dimensions_px)<=2000);
  if(src.museum==='NGA'){
    assert.equal(src.official_license,'CC0');
    assert(src.museum_api_url.includes('NationalGalleryOfArt/opendata/'));
    assert(src.source_image_url.startsWith('https://api.nga.gov/iiif/'));
    assert.equal(src.source_native_dimensions_px.length,2);
    assert(src.recorded_reproduction_rights.includes('openaccess=1'));
  } else {
    assert.equal(src.official_license,'PUBLIC_DOMAIN');
    assert(src.museum_api_url.startsWith('https://api.smk.dk/api/v1/art/search/'));
    assert(src.source_image_url.startsWith('https://api.smk.dk/api/v1/'));
    assert(src.recorded_reproduction_rights.includes('public_domain=true'));
  }
  const bytes=readFileSync(resolve(base,src.local_path));
  assert.equal(bytes.length,src.local_bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),src.local_sha256);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),src.local_git_blob_sha);
  const proof=images.sources.find(x=>x.path===src.local_path);
  assert.equal(proof?.artwork_id,src.artwork_id);
  assert.equal(proof?.sha256,src.local_sha256);
  assert.equal(proof?.source_sha256,src.source_sha256);
  assert.equal(proof?.release_scope,'GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  const orig=index.artworks.find(x=>x.artwork_id===src.artwork_id);
  assert.deepEqual(art.exact_prayer_cards,orig.owner_approved_exact_card_ids);
}
assert.equal(batch07.sources.find(x=>x.artwork_id==='REVIEW::smk:KMSSP48').local_dimensions_px[1],1600);
assert(gallery.records.find(x=>x.id==='REVIEW::smk:KMSSP186').image.provenance.includes('workshop'));
assert.equal(images.duplicate_same_original.length,2);
assert.equal(gallery.records.filter(x=>x.image?.src==='./gallery/images/girardin-trinity-cma-1960-79-2000.webp').length,2);
assert.equal(images.duplicate_same_original[0].image,'site/gallery/images/champaigne-annunciation-met-438724-original.jpg');
assert.equal(gallery.records.filter(x=>x.image?.src==='./gallery/images/champaigne-annunciation-met-438724-original.jpg').length,2);
for (const id of verifiedArchiveOriginalIds) {
  const work=gallery.records.find(x=>x.id===id);
  const photo=images.sources.find(x=>x.artwork_id===id);
  assert(work?.owner_selected_artwork,'Only previously selected paintings receive original files');
  assert(work?.image?.src === './'+photo?.path.slice('site/'.length),'Original missing gallery binding');
  assert(photo?.image_bytes>2000000,'Image file must be an original-sized JPEG');
  assert(photo?.release_scope==='GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT');
  assert(!work.image.quality.startsWith('LOW_RES_PREVIEW'));
}

// UI is scoped and nav contains no extra bottom tab. No remote image is loaded by runtime.
assert(html.includes('id="gallery-view"'));
assert(html.includes('id="home-sacred-art"'));
assert(html.includes('id="gallery-grid"'));
assert(html.includes('id="gallery-detail-dialog"'));
assert(html.includes('src="./gallery/gallery.js"'));
assert(html.includes('href="./gallery/gallery.css"'));
assert(app.includes('const VALID_ROUTES = new Set(["home", "gallery", ...Object.keys(MODULES)])'));
assert(app.includes('byId("gallery-view").hidden = !gallery'));
assert(app.includes('window.AO_OPEN_SACRED_ART_GALLERY?.()'));
assert.equal((html.match(/class="tab(?: active)?"/g)||[]).length,4,'Do not add a new permanent nav tab');
assert(js.includes('fetch(dataUrl'));
assert(!js.includes('img.src = item.image_url_source_only'));
assert(!js.includes('img.src = item.source_url'));
assert(js.includes('catalogue.records'));
assert(css.includes('.ao-gallery'));
assert(css.includes('.home-pad.integrated-home-order>.sacred-art-entry'));
assert(!html.includes('https://fonts.googleapis.com'),'No remote font dependencies');
console.log('Sacred Art gallery validated: 862 records, 36 Angelus review paintings, 49 hosted paintings across 51 historical rows, 12 institutional-source Batch 07 files (7 NGA, 5 SMK), rights, hash and prayer-invariant checks passed.');
