import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(base,p),'utf8');
const json = p => JSON.parse(read(p));
const index = json('app-data/sacred-art/artwork-assignment-index.v2.json');
const gallery = json('site/gallery/catalogue.v1.json');
const images = json('site/gallery/image-provenance.v1.json');
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
assert.equal(gallery.counts.distinct_locally_hosted_paintings, 8);
assert.equal(gallery.counts.image_available_records, 9);
assert.equal(gallery.records.filter(x => x.image !== null).length, 9);
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
assert.equal(images.sources.length,8);
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
assert.equal(srcFiles.size,8);
for (const entry of images.sources) {
  assert(srcFiles.has(entry.path));
  assert.equal(statSync(resolve(base,entry.path)).size,entry.image_bytes);
  if (entry.path.startsWith('site/gallery/images/') && entry.quality_gate !== 'INTERIM_GALLERY_PREVIEW_ONLY__ORIGINAL_IMAGE_NOT_TRANSFERRED') {
    const match = staged.staged_images.find(x=>x.work_id===entry.artwork_id);
    assert(match,'Missing staged provenance');
    assert.equal(entry.git_blob_sha,match.git_blob_sha);
    const stagedBytes = readFileSync(resolve(base,match.path));
    const galleryBytes = readFileSync(resolve(base,entry.path));
    assert.deepEqual(galleryBytes,stagedBytes,'Copied image must be byte-for-byte identical');
  }
}
assert.equal(images.sources.filter(x=>x.quality_gate==='INTERIM_GALLERY_PREVIEW_ONLY__ORIGINAL_IMAGE_NOT_TRANSFERRED').length,2);
const previewIds=['CANONICAL::met-436672','CANONICAL::met-438338'];
for(const id of previewIds){
  const work=gallery.records.find(x=>x.id===id);
  const photo=images.sources.find(x=>x.artwork_id===id);
  assert(work?.owner_selected_artwork,'No owner approval for published gallery preview');
  assert(work?.image?.quality==='LOW_RES_PREVIEW__FULL_IMAGE_ACQUISITION_PENDING');
  assert(photo?.rights_evidence_url?.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert(photo?.museum_object_url?.startsWith('https://www.metmuseum.org/'));
  assert(photo?.pixel_dimensions.every(n=>n>=300));
  assert.equal(photo?.release_scope,'GALLERY_PREVIEW_ONLY__NO_PRAYER_STAGE_OR_DAY_IMAGE_APPROVAL');
}
assert.equal(images.duplicate_same_original.length,1);
assert.equal(gallery.records.filter(x=>x.image?.src==='./artwork/champaigne-annunciation-home-v9.jpg').length,2);

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
console.log('Sacred Art gallery validated: 862 records, 36 Angelus works, 8 hosted images (2 lower-res interim previews) / 9 record references; 0 external image loads and 0 prayer defaults.');
