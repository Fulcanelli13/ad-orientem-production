import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const m=read('app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json');
const g=read('site/gallery/catalogue.v1.json');
const p=read('site/gallery/image-provenance.v1.json');
const excluded=read('app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json');
const canonical=read('app-data/sacred-art/artwork-assignment-index.v2.json');
const old1=read('app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json');
const old2=read('app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');
const old3=read('app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json');
const old4=read('app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json');
assert.equal(m.schema,'ao.sacred-art.exact-owner-curated-commons-wave05.v1');
assert.equal(m.prior_gallery_images,429);
assert.equal(m.prior_gallery_image_bearing_records,432);
assert.equal(m.owner_curated_status,'OWNER_APPROVED_CURATED');
assert.equal(m.summary.owner_selected_candidate_records,84);
assert.equal(m.summary.original_rejections_protected,103);
assert.equal(m.summary.catalogue_total_records,873);
assert.equal(m.summary.original_curatorial_records_unchanged,873);
assert.equal(m.summary.new_prayer_card_assignments,0);
assert.equal(m.summary.new_calendar_selections,0);
assert.equal(m.summary.image_hash_mismatches,0);
assert.equal(m.source_originals_retained,false);
assert.equal(m.max_batch_images,84);
const n=m.summary.new_gallery_images;
const quality06=read('app-data/sacred-art/quality-recovery-wave06-20261116.v1.json');
const n06=quality06.summary.new_gallery_paintings;
const quality06IDs=new Set(quality06.artworks.map(a=>a.artwork_id));
assert(n>=12&&n<=84);
assert.equal(m.assets.length,n);
assert.equal(m.held.length,84-n);
assert.equal(m.summary.held_or_deferred_rows,84-n);
assert.equal(g.records.length,873);
assert.equal(g.counts.total_records,873);
assert.equal(g.counts.distinct_locally_hosted_paintings,429+n+n06);
assert.equal(g.counts.image_available_records,432+n+n06);
assert.equal(g.counts.verified_image_files,429+n+n06);
assert.equal(p.sources.length,429+n+n06);
assert.equal(p.local_image_count,429+n+n06);
assert.equal(p.catalogue_record_images_count,432+n+n06);
assert.equal(old1.assets.length,161);
assert.equal(old2.assets.length,109);
assert.equal(old3.assets.length,49);
assert.equal(old4.artworks.length,37);
assert.equal(excluded.rejected_originals.length,103);
assert.equal(canonical.artworks.length,862);
const cohort=g.records.filter(x=>x.id.startsWith('RECENT575::')&&x.record_status==='OWNER_APPROVED_CURATED');
assert.equal(cohort.length,84,'The other historically owner-approved cohort must be complete');
assert(cohort.every(x=>x.owner_selected_artwork===true));
const ids=new Set(cohort.map(x=>x.id));
const processed=new Set([...m.assets.map(x=>x.artwork_id),...m.held.map(x=>x.artwork_id)]);
assert.equal(processed.size,84,'The completed manifest must cover every older selected artwork once');
assert.deepEqual([...ids].sort(),[...processed].sort());
const bannedUrls=new Set(excluded.rejected_originals.map(x=>
 decodeURIComponent(x.source_url||'').replace(/_/g,' ').toLowerCase()));
const already=new Set([
 ...old1.assets.map(x=>x.artwork_id),
 ...old2.assets.map(x=>x.artwork_id),
 ...old3.assets.map(x=>x.artwork_id),
 ...old4.artworks.map(x=>x.artwork_id)
]);
const pages=new Set(),photoHashes=new Set();
let total=0;
for(const a of m.assets){
 assert(ids.has(a.artwork_id));
 assert(!already.has(a.artwork_id));
 assert(!/prado/i.test(a.source_page+' '+a.title),
  'Historic Prado-source exclusion cannot be bypassed');
 assert(!bannedUrls.has(decodeURIComponent(a.source_page).replace(/_/g,' ').toLowerCase()));
 assert(!pages.has(a.commons_pageid),'One image page may not count as multiple new images');
 pages.add(a.commons_pageid);
 assert(a.derivative_path.startsWith('site/gallery/images/owner-approved-curated-wave05-'));
 assert(a.derivative_path.endsWith('.webp'));
 const raw=fs.readFileSync(a.derivative_path);
 assert.equal(raw.subarray(0,4).toString(),'RIFF');
 assert.equal(raw.subarray(8,12).toString(),'WEBP');
 assert.equal(raw.length,a.derivative_bytes);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),a.derivative_sha256);
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+raw.length+'\0')).update(raw).digest('hex'),a.derivative_git_blob_sha);
 assert(!photoHashes.has(a.derivative_git_blob_sha),'Duplicate display photo bytes must not inflate painted-work counts');
 photoHashes.add(a.derivative_git_blob_sha);
 assert(a.derivative_dimensions.every(v=>v>=700));
 assert(a.original_dimensions.every(v=>v>=1050));
 assert(['false','0','no'].includes(a.license_evidence.copyrighted_flag));
 assert(/public domain|cc0/.test(a.license_evidence.license_short));
 assert(!/by-nc|by-sa|cc by|copyrighted|all rights reserved/i.test(a.license_evidence.license_short));
 assert.equal(a.old_curation,'OWNER_APPROVED_CURATED');
 assert(['NOT_INDEPENDENTLY_CLEARED','NOT_PRODUCTION_CLEARED'].includes(a.previous_photo_rights_note));
 assert.equal(a.original_bytes_archived,false);
 const row=g.records.find(x=>x.id===a.artwork_id);
 assert(row && row.owner_selected_artwork);
 assert.equal(row.record_status,'OWNER_APPROVED_CURATED');
 assert.equal(row.title,a.title);
 assert.equal(row.artist,a.artist);
 assert.equal(row.rights_note,a.previous_photo_rights_note);
 assert.equal(row.image.src,'./'+a.derivative_path.slice('site/'.length));
 assert.equal(row.image.usage,'GALLERY_ONLY__USER_SELECTED_WORK__NO_NEW_PRAYER_DEFAULT');
 assert.equal(row.image.license_url,
  'https://commons.wikimedia.org/wiki/'+a.commons_file_title.replace(/ /g,'_'));
 const provenance=p.sources.find(x=>x.artwork_id===a.artwork_id&&x.path===a.derivative_path);
 assert(provenance,'Every source must have a permanent image-rights and hash provenance row');
 assert.equal(provenance.sha256,a.derivative_sha256);
 assert.equal(provenance.git_blob_sha,a.derivative_git_blob_sha);
 assert.equal(provenance.commons_page_id,a.commons_pageid);
 assert.equal(provenance.source_image_original_bytes_retained,false);
 total+=raw.length;
}
assert.equal(total,m.summary.new_bytes);
for(const h of m.held){
 assert(ids.has(h.artwork_id));
 const row=g.records.find(x=>x.id===h.artwork_id);
  if(quality06IDs.has(h.artwork_id)){
   assert(['BELOW_FULL_COMPOSITION_QUALITY_FLOOR','EXTREME_ASPECT_RATIO_OR_DIMENSIONS','IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED'].includes(h.reason));
   assert(row && row.image && row.image.src.includes('owner-selected-quality-upgrade-'));
  }else assert(row && row.image===null,'An unresolved held source must remain unpublished');
}
for(const old of canonical.artworks){
 const row=g.records.find(x=>x.id===old.artwork_id);
 assert(row,'Every original catalogue artwork must remain');
 assert.deepEqual(row.exact_prayer_cards,old.owner_approved_exact_card_ids);
 assert.equal(row.eligible_card_count,old.candidate_prayer_card_ids.length);
 assert.equal(row.attribution_status,old.attribution_status);
}
assert(g.source_references.curated_cohort_wave05==='app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json');
assert(fs.readFileSync('site/gallery/gallery.js','utf8').includes('data.records?.length !== 873'));
console.log('PASS wave05: complete 84 curated-owner cohort, '+n+' source-verified locally archived images, '+total+' bytes, '+(84-n)+' individually held; 103 rejections and all original assignments preserved.');
