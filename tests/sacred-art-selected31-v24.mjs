import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=p=>resolve(root,p);
const bytes=p=>readFileSync(path(p));
const json=p=>JSON.parse(bytes(p).toString('utf8'));
const sha=p=>createHash('sha256').update(bytes(p)).digest('hex');
const old=json('app-data/sacred-art/selected31-clearance-v23.json');
const now=json('app-data/sacred-art/selected31-clearance-v24.json');
const held=json('app-data/sacred-art/selected31-held-remediation-v24.json');
const release=json('app-data/sacred-art/selected31-release-decision-v24.json');
const matrix=json('app-data/sacred-art/staged-selected31-v24/selected31-all-visual-source-matrix.v24.json');
const risd=json('app-data/sacred-art/staged-selected31-v24/risd-dolci-probe.v24.json');
const gallery=json('site/gallery/catalogue.v1.json');
const prov=json('site/gallery/image-provenance.v1.json');
assert.equal(now.schema,'ao.sacred-art.selected31-clearance.v24');
assert.equal(now.records.length,31);
assert.deepEqual(now.counts,{main_preserved:7,overlay_eligible:11,source_only_holds:13});
assert.deepEqual(now.counts,old.counts,'V24 must preserve existing 31 selection classifications');
assert.deepEqual(new Set(now.records.map(x=>x.review_artwork_id)),new Set(old.records.map(x=>x.review_artwork_id)));
for(const x of now.records){
  const before=old.records.find(v=>v.review_artwork_id===x.review_artwork_id);
  assert(before,x.review_artwork_id);
  assert.equal(x.disposition,before.disposition,'No automatic gallery candidate promotion in V24');
  assert.equal(x.source_sha256,before.source_sha256);
  assert.equal(x.automatic_prayer_card_assignment,false);
}
assert.equal(matrix.total,31);
assert.deepEqual(matrix.category_counts,{CURRENT_MAIN_PRESERVE:7,DRAFT_GALLERY_ELIGIBLE:11,HOLD_SOURCE_ONLY:13});
assert.equal(matrix.rows.length,31);
assert.deepEqual(new Set(matrix.rows.map(x=>x.review_artwork_id)),new Set(now.records.map(x=>x.review_artwork_id)));
assert(matrix.no_gallery_publication && matrix.no_new_photo_acquisition && matrix.no_cinematic_approval);
for(const x of matrix.rows){
  assert(existsSync(path(x.photograph_path)),x.review_artwork_id);
  assert.equal(sha(x.photograph_path),x.source_sha256,x.review_artwork_id);
  assert(x.pixel_dimensions.length===2);
  assert(x.pixel_dimensions.every(v=>Number.isInteger(v)&&v>120));
  assert.equal(x.approved_prayer_card_default,false);
}
const sheets=matrix.contact_sheets;
assert.equal(sheets.all_31.count,31);
assert.equal(sheets.draft_11.count,11);
for(const obj of Object.values(sheets)){
  assert.equal(sha(obj.path),obj.sha256);
  assert.equal(bytes(obj.path).length,obj.bytes);
  assert(obj.dimensions[0]>=1500&&obj.dimensions[1]>=950);
}
assert.equal(release.schema,'ao.sacred-art.selected31-release-decision.v24');
assert.equal(release.candidates.length,11);
assert.deepEqual(release.counts.by_class,{
  MUSEUM_OPEN_ACCESS:5,
  PUBLIC_DOMAIN_MARK:3,
  INSTITUTION_PUBLIC_DOMAIN_SERVICE:1,
  EXPLICIT_MUSEUM_CC0_1:1,
  EXPLICIT_PHOTOGRAPHER_CC_BY_3:1
});
assert.equal(release.counts.strong_photo_reuse_evidence,8);
assert.equal(release.counts.public_domain_mark_extra_review,3);
assert(release.no_new_selection&&release.no_gallery_changes&&release.no_prayer_card_assignments);
assert.deepEqual(new Set(release.candidates.map(x=>x.review_artwork_id)),
  new Set(now.records.filter(x=>x.disposition==='DRAFT_GALLERY_ELIGIBLE').map(x=>x.review_artwork_id)));
for(const x of release.candidates){
  const img=matrix.rows.find(r=>r.review_artwork_id===x.review_artwork_id);
  assert(img);
  assert.equal(x.gallery_sha256,img.source_sha256);
  assert.equal(x.gallery_image_path,img.photograph_path);
  assert(x.owner_selected_artwork);
  assert.equal(x.user_selected_card_or_cinematic_default,false);
  assert.equal(x.legal_reuse_certified_for_every_country,false);
  assert.equal(x.requires_owner_final_presentation_check,true);
  if(x.photo_rights_class==='PUBLIC_DOMAIN_MARK') assert(x.remaining_release_gate.startsWith('PDM_'));
}
assert.equal(held.records.length,13);
assert.equal(held.counts.held,13);
assert.deepEqual(new Set(held.records.map(x=>x.review_artwork_id)),
  new Set(now.records.filter(x=>x.disposition==='HOLD_SOURCE_ONLY').map(x=>x.review_artwork_id)));
for(const id of ['bap-haarlem','king-bourdon','tri-dolci','euch-champaigne']){
  const x=now.records.find(x=>x.review_artwork_id===id);
  assert(x?.v24_image_review && x.disposition==='HOLD_SOURCE_ONLY',id);
}
assert(now.records.find(x=>x.review_artwork_id==='bap-haarlem').v24_image_review.includes('ornate gilded frame'));
assert(now.records.find(x=>x.review_artwork_id==='king-bourdon').v24_image_review.includes('does not prove crop'));
assert(now.records.find(x=>x.review_artwork_id==='euch-champaigne').v24_image_review.includes('1112x591'));
assert.equal(risd.schema,'ao.sacred-art.risd-dolci-exact-photo-probe.v24');
assert.equal(risd.new_high_res_archive_count,0);
assert.equal(risd.api_attempts.length,2);
assert(risd.api_attempts.every(a=>a.status==='UNAVAILABLE'&&a.reason.includes('403')));
assert.equal(risd.no_site_or_prayer_change,true);
assert.equal(gallery.counts.total_records,873);
assert.equal(gallery.counts.distinct_locally_hosted_paintings,472);
assert.equal(prov.local_image_count,472);
assert.equal(release.proposed_draft.gallery_records,883);
assert.equal(release.proposed_draft.local_paintings,483);
assert(!existsSync(path('site/gallery/images/selected31-v24-bap-haarlem-sailko.webp')));
const memo=bytes('app-data/sacred-art/selected31-v24-all-artwork-review.md').toString('utf8');
assert(memo.includes('selected31-all-review-matrix.v24.webp'));
assert(memo.includes('selected31-eleven-draft-contact-sheet.v24.webp'));
assert(memo.includes('No legal permission request, contact or fee was made'));
console.log('V24 PASS: full 31-photo matrix verified, 11 draft images classified 8 explicit/institutional vs 3 PDM; thirteen holds unchanged; RISD exact API 403 recorded; 873/472 production and prayers intact');
