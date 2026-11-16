import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const earlier=load('app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json');
const current=load('app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');
const gallery=load('site/gallery/catalogue.v1.json');
const prov=load('site/gallery/image-provenance.v1.json');
const rejected=load('app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json');
const master=load('app-data/sacred-art/artwork-assignment-index.v2.json');
assert.equal(current.schema,'ao.sacred-art.bulk-approved-commons-source-import-batch02.v1');
assert.equal(current.prior_batch_manifest,'app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json');
assert.equal(earlier.summary.new_gallery_images,161);
assert.equal(earlier.summary.held_or_deferred_rows,330);
assert.equal(earlier.assets.length,161);
assert.equal(master.artworks.length,862);
assert.equal(rejected.rejected_originals.length,103);
assert.equal(current.summary.original_rejections_protected,103);
assert.equal(current.summary.owner_selected_candidate_records,330);
assert.equal(current.summary.prior_qualified_deferred,109);
assert.equal(current.summary.prior_unexamined_deferred,71);
assert.equal(current.summary.prior_failed_downloads_retried,19);
const n=current.summary.new_gallery_images;
const wave03=load('app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json');
const n03=wave03.summary.recovered_images;
const wave04=load('app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json');
const n04=wave04.summary.new_gallery_paintings;
const wave05=load('app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json');
const n05=wave05.summary.new_gallery_images;
const quality06=load('app-data/sacred-art/quality-recovery-wave06-20261116.v1.json');
const n06=quality06.summary.new_gallery_paintings;
const quality06IDs=new Set(quality06.artworks.map(a=>a.artwork_id));
assert(n>=40 && n<=180,'Second batch must transfer more than a handful of images');
assert.equal(current.assets.length,n);
assert.equal(current.held.length+n,330);
assert.equal(current.summary.held_or_deferred_rows,330-n);
assert.equal(current.summary.new_prayer_card_assignments,0);
assert.equal(current.summary.new_calendar_selections,0);
assert.equal(current.summary.image_hash_mismatches,0);
assert.equal(current.summary.original_curatorial_records_unchanged,873);
assert.equal(current.summary.catalogue_total_records,873);
assert.equal(gallery.records.length,873);
assert.equal(gallery.counts.total_records,873);
assert.equal(gallery.counts.distinct_locally_hosted_paintings,234+n+n03+n04+n05+n06);
assert.equal(gallery.counts.image_available_records,237+n+n03+n04+n05+n06);
assert.equal(gallery.counts.verified_image_files,234+n+n03+n04+n05+n06);
assert.equal(prov.sources.length,234+n+n03+n04+n05+n06);
assert.equal(prov.local_image_count,234+n+n03+n04+n05+n06);
assert.equal(prov.catalogue_record_images_count,237+n+n03+n04+n05+n06);
assert.equal(gallery.source_references.bulk_approved_commons,
  'app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json');
assert.equal(gallery.source_references.bulk_approved_commons_batch02,
  'app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');
const earlierIDs=new Set(earlier.assets.map(a=>a.artwork_id));
const priorHeld=new Map(earlier.held.map(x=>[x.artwork_id,x]));
const newIDs=new Set();
const photoPageIDs=new Set(earlier.assets.map(x=>x.commons_pageid));
let total=0;
for(const a of current.assets) {
 assert(a.artwork_id.startsWith('RECENT575::'));
 assert(!earlierIDs.has(a.artwork_id));
 assert(!newIDs.has(a.artwork_id));
 newIDs.add(a.artwork_id);
 assert(priorHeld.has(a.artwork_id));
 assert(![
  'BELOW_FULL_COMPOSITION_QUALITY_FLOOR',
  'COPYRIGHTED_FLAG_NOT_EXPLICITLY_FALSE',
  'EXTREME_ASPECT_RATIO_OR_DIMENSIONS'
 ].includes(priorHeld.get(a.artwork_id).reason),
 'Cannot bypass a known source quality or photo-rights hold');
 assert(a.derivative_path.startsWith('site/gallery/images/owner-approved-20261103-'));
 assert(a.derivative_path.endsWith('.webp'));
 const b=fs.readFileSync(a.derivative_path);
 assert.equal(b.subarray(0,4).toString(),'RIFF');
 assert.equal(b.subarray(8,12).toString(),'WEBP');
 assert.equal(b.length,a.derivative_bytes);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.derivative_sha256);
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex'),
  a.derivative_git_blob_sha);
 assert(a.derivative_dimensions.every(v=>v>=700));
 assert(a.original_dimensions.every(v=>v>=1050));
 assert(['false','0','no'].includes(a.license_evidence.copyrighted_flag));
 assert(
  a.license_evidence.license_short.includes('public domain')||
  a.license_evidence.license_short.includes('cc0'));
 assert(!/by-nc|by-sa|cc by|all rights reserved/i.test(a.license_evidence.license_short));
 assert(!photoPageIDs.has(a.commons_pageid),'Source page is already used for another painting');
 photoPageIDs.add(a.commons_pageid);
 const r=gallery.records.find(x=>x.id===a.artwork_id);
 assert(r && r.owner_selected_artwork===true);
 assert.equal(r.record_status,'APPROVED_BY_USER_2026_11_03');
 assert.equal(r.rights_note,a.previous_photo_rights_note);
 assert.equal(r.image.src,'./'+a.derivative_path.slice('site/'.length));
 assert.equal(r.image.usage,'GALLERY_ONLY__USER_SELECTED_WORK__NO_NEW_PRAYER_DEFAULT');
 assert(r.image.source_note.includes('not a new museum-level'));
 const p=prov.sources.find(x=>x.artwork_id===a.artwork_id);
 assert(p);
 assert.equal(p.source_record,'app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');
 assert.equal(p.sha256,a.derivative_sha256);
 assert.equal(p.git_blob_sha,a.derivative_git_blob_sha);
 assert.equal(p.source_image_original_bytes_retained,false);
 total+=b.length;
}
assert.equal(total,current.summary.new_bytes);
for(const a of earlier.assets){
 const r=gallery.records.find(x=>x.id===a.artwork_id);
 assert(r && r.image && r.image.src==='./'+a.derivative_path.slice('site/'.length));
 const p=prov.sources.find(x=>x.artwork_id===a.artwork_id);
 assert(p && p.sha256===a.derivative_sha256);
 const b=fs.readFileSync(a.derivative_path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.derivative_sha256);
}
for(const old of master.artworks){
 const r=gallery.records.find(x=>x.id===old.artwork_id);
 assert(r,'original artwork ID missing: '+old.artwork_id);
 assert.deepEqual(r.exact_prayer_cards,old.owner_approved_exact_card_ids);
 assert.equal(r.eligible_card_count,old.candidate_prayer_card_ids.length);
 assert.equal(r.attribution_status,old.attribution_status);
}
const verifiedWave03=new Set(wave03.assets.map(a=>a.artwork_id));
for(const held of current.held){
 assert(priorHeld.has(held.artwork_id));
 assert(!newIDs.has(held.artwork_id));
 const r=gallery.records.find(x=>x.id===held.artwork_id);
 if(verifiedWave03.has(held.artwork_id)){
  assert.equal(held.reason,'IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED',
   'Only prior rate-limited, source-cleared photo failures may be released in wave03');
  assert(held.detail.includes('HTTP Error 429'));
  assert(r && r.image && r.image.src.includes('owner-approved-20261103-'),
   'Previously held source may show only after independent wave03 exact-photo verification');
  }else if(quality06IDs.has(held.artwork_id)){
   assert(['BELOW_FULL_COMPOSITION_QUALITY_FLOOR','EXTREME_ASPECT_RATIO_OR_DIMENSIONS','IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED'].includes(held.reason));
   assert(r && r.image && r.image.src.includes('owner-selected-quality-upgrade-'));
  }else{
   assert(r && r.image===null,'Unresolved historical hold remains unpublished');
 }
}
const restricted=rejected.rejected_originals.map(x=>
 decodeURIComponent(x.source_url||'').replace(/_/g,' ').toLowerCase());
const restrictedSet=new Set(restricted);
for(const a of current.assets)
 assert(!restrictedSet.has(decodeURIComponent(a.source_page).replace(/_/g,' ').toLowerCase()));
assert(fs.readFileSync('site/gallery/gallery.js','utf8').includes('data.records?.length !== 873'));
console.log('PASS Sacred Art batch02: '+n+' newly acquired selected Commons full-frame derivatives ('+total+' bytes), 330 old holds reconciled, first 161 images intact, 103 owner rejections protected, 873 stable artwork identities.');
