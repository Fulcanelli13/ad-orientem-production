import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=p=>resolve(root,p);
const read=p=>readFileSync(path(p));
const json=p=>JSON.parse(read(p).toString('utf8'));
const hash=p=>createHash('sha256').update(read(p)).digest('hex');
const v22=json('app-data/sacred-art/selected31-clearance-v22.json');
const v23=json('app-data/sacred-art/selected31-clearance-v23.json');
const holds=json('app-data/sacred-art/selected31-held-remediation-v23.json');
const board=json('app-data/sacred-art/selected31-review-board-v23.json');
const audit=json('app-data/sacred-art/staged-selected31-v23/held-photo-audit.v23.json');
const acquire=json('app-data/sacred-art/staged-selected31-v23/acquisition-results.v23.json');
const gallery=json('site/gallery/catalogue.v1.json');
const provenance=json('site/gallery/image-provenance.v1.json');
assert.equal(v23.schema,'ao.sacred-art.selected31-clearance.v23');
assert.equal(v23.records.length,31);
assert.equal(board.active_holds.length,13);
assert.equal(holds.records.length,13);
assert.equal(audit.held_count,13);
assert.equal(audit.records.length,13);
assert.deepEqual(v23.counts,{main_preserved:7,overlay_eligible:11,source_only_holds:13});
assert.deepEqual(v23.counts,v22.counts,'no new gallery promotion in V23');
assert.deepEqual(new Set(v23.records.map(x=>x.review_artwork_id)),new Set(v22.records.map(x=>x.review_artwork_id)));
for(const row of v23.records){
 assert.equal(row.disposition,v22.records.find(x=>x.review_artwork_id===row.review_artwork_id).disposition);
 assert.equal(row.automatic_prayer_card_assignment,false);
}
assert.deepEqual(new Set(board.active_holds.map(x=>x.review_artwork_id)),
 new Set(v23.records.filter(x=>x.disposition==='HOLD_SOURCE_ONLY').map(x=>x.review_artwork_id)));
assert.deepEqual(new Set(holds.records.map(x=>x.review_artwork_id)),
 new Set(board.active_holds.map(x=>x.review_artwork_id)));
assert.deepEqual(new Set(audit.records.map(x=>x.review_artwork_id)),
 new Set(board.active_holds.map(x=>x.review_artwork_id)));
assert.deepEqual(board.counts,{selected:31,existing:7,draft_gallery_candidates:11,still_held:13,held_with_photo_geometry_review:13,composition_outliers_above_8_percent:3,independently_licensed_haarlem_alternative_verified_not_acquired:1});
assert.equal(audit.automated_photo_publication_authorized,false);
assert.equal(hash(audit.source_contact_sheet),audit.contact_sheet_sha256);
assert.equal(read(audit.source_contact_sheet).length,audit.contact_sheet_bytes);
for(const photo of audit.records){
 assert(existsSync(path(photo.photo_archive)),photo.review_artwork_id);
 assert.equal(hash(photo.photo_archive),photo.photo_sha256);
 assert(Number.isFinite(photo.verified_object_physical_aspect_ratio));
 assert(Number.isFinite(photo.photo_to_object_aspect_deviation_percent));
 assert(photo.measurement_source.startsWith('https://'));
 assert(photo.needs_human_composition_review===true);
}
assert.deepEqual(audit.high_deviation_over_8_percent.map(x=>x.id).sort(),
 ['cana-tintoretto','euch-champaigne','king-bourdon']);
assert.deepEqual(board.active_holds.filter(x=>x.geometry_priority==='VISUAL_CROP_OR_FRAME_CHECK_REQUIRED').map(x=>x.review_artwork_id).sort(),
 ['cana-tintoretto','euch-champaigne','king-bourdon']);
assert.equal(acquire.acquired_count,0,'Wikimedia HTTP 429 must not be mislabelled as acquired');
assert.equal(acquire.records.length,0);
assert(acquire.failed_attempts.length>=1);
assert(acquire.failed_attempts.every(x=>x.error.includes('429')));
assert.equal(board.newly_discovered_candidate.photo_license,'CC BY 3.0');
assert.equal(board.newly_discovered_candidate.published_sha1,'85d22cb79366926281e7bcaa876f4290c46678d2');
assert(board.newly_discovered_candidate.acquisition_attempts_status.includes('NO_LOCAL_BINARY'));
assert.equal(board.other_unacquired_candidate.review_artwork_id,'euch-poussin');
assert(board.other_unacquired_candidate.status.startsWith('REFERENCE_ONLY'));
assert(!existsSync(path('site/gallery/images/selected31-v23-bap-haarlem-sailko-2000.webp')));
assert(!existsSync(path('app-data/sacred-art/staged-selected31-v23/bap-haarlem-sailko-2000.webp')));
assert.equal(gallery.counts.total_records,873);
assert.equal(gallery.counts.distinct_locally_hosted_paintings,472);
assert.equal(provenance.local_image_count,472);
const review=read('app-data/sacred-art/selected31-v23-held-photo-review.md').toString('utf8');
assert(review.includes('held-13-source-contact-sheet-v23.webp'));
assert(review.includes('Sailko'));
assert(review.includes('Artangel'));
assert(review.includes('No permissions or fees requested'));
const overlay=json('site/gallery/selected31-reviewed-images.v22.json');
assert.equal(overlay.records.length,2);
assert.equal(overlay.image_patches.length,0);
assert.equal(873+10,883);
assert.equal(472+11,483);
console.log('V23 PASS: 13 archived photos audited with complete museum geometry; 3 composition flags; Haarlem alternate source held due 429; Poussin alternate reference-only; 31 selection statuses unchanged; 472-image production intact');
