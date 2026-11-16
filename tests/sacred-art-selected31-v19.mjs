import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>resolve(root,p);
const json=p=>JSON.parse(readFileSync(file(p),'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(file(p))).digest('hex');
const selection=json('app-data/sacred-art/selected31-gallery-reconciliation-v12.json');
const policy=json('app-data/sacred-art/selected31-clearance-v19.json');
const gallery=json('site/gallery/catalogue.v1.json');
const provenance=json('site/gallery/image-provenance.v1.json');
const v13=json('site/gallery/selected31-reviewed-images.v13.json');
const v14=json('site/gallery/selected31-reviewed-images.v14.json');
const js=readFileSync(file('site/gallery/gallery.js'),'utf8');
assert.equal(policy.schema,'ao.sacred-art.selected31-clearance.v19');
assert.equal(selection.records.length,31);
assert.equal(policy.records.length,31);
assert.deepEqual(new Set(policy.records.map(r=>r.review_artwork_id)),new Set(selection.records.map(r=>r.review_artwork_id)));
assert.equal(new Set(policy.records.map(r=>r.review_artwork_id)).size,31);
assert.equal(gallery.counts.total_records,873);
assert(gallery.counts.distinct_locally_hosted_paintings>=343,'Production images should not regress below V19');
assert.equal(provenance.local_image_count,gallery.counts.distinct_locally_hosted_paintings);
assert.deepEqual(policy.counts,{main_preserved:5,overlay_eligible:7,source_only_holds:19});
const states=policy.records.reduce((acc,r)=>{(acc[r.disposition]??=[]).push(r);return acc;},{});
assert.equal(states.CURRENT_MAIN_PRESERVE.length,5);
assert.equal(states.DRAFT_GALLERY_ELIGIBLE.length,7);
assert.equal(states.HOLD_SOURCE_ONLY.length,19);
for(const r of policy.records) {
  assert.equal(r.automatic_prayer_card_assignment,false);
  assert(r.selected_object_page.startsWith('https://'));
  if(r.disposition==='CURRENT_MAIN_PRESERVE') {
    assert(existsSync(file(r.gallery_image_file)),r.gallery_image_file);
    assert(!r.source_archive_path);
  } else {
    assert(r.source_archive_path && existsSync(file(r.source_archive_path)),r.review_artwork_id);
    assert.equal(sha(r.source_archive_path),r.source_sha256,'Source SHA for '+r.review_artwork_id);
    assert(r.source_dimensions?.length===2);
    assert(r.source_dimensions.every(n=>Number.isInteger(n)&&n>=500));
  }
}
const sources=['v13','v14','v15','v17','v18'].map(v=>json('app-data/sacred-art/staged-selected31-'+v+'/acquisition-results.'+v+'.json'));
assert.deepEqual(sources.map(x=>x.records.length),[5,5,4,4,8]);
assert.equal(new Set(sources.flatMap(x=>x.records.map(r=>r.review_artwork_id))).size,26);
assert.equal(v13.records.length,5);
assert.equal(v14.records.length,1);
assert.deepEqual(v14.records.map(r=>r.id),['REVIEW31::bap-murillo']);
assert.deepEqual(v14.image_patches.map(r=>r.id),['plate-bloch-sermon']);
assert.equal(v14.provenance.length,2);
const visible=[...v13.records,...v14.records];
assert.equal(visible.length,6);
const plannedIds=new Set([...visible.map(x=>x.id.replace('REVIEW31::','')),'king-bloch']);
assert.deepEqual(plannedIds,new Set(states.DRAFT_GALLERY_ELIGIBLE.map(x=>x.review_artwork_id)));
for(const r of visible) {
  assert(r.owner_selected_artwork);
  assert.equal(r.exact_prayer_cards.length,0);
  assert.equal(r.prayer_parts.length,0);
  assert.equal(r.eligible_card_count,0);
  assert(r.image.src.startsWith('./gallery/images/selected31-'));
  assert(existsSync(file('site/'+r.image.src.slice(2))));
}
for(const f of [
'site/gallery/images/selected31-v14-bap-verrocchio-2000.webp',
'site/gallery/images/selected31-v14-cana-francken-2000.webp',
'site/gallery/images/selected31-v14-cana-vermeyen-2000.webp'
]) assert(!existsSync(file(f)),'Held photograph must not enter public site: '+f);
for (const p of [...v13.provenance,...v14.provenance]) {
 assert(existsSync(file(p.gallery_file)));
 assert.equal(sha(p.gallery_file),p.derivative_sha256);
 assert(existsSync(file(p.source_archive)));
 assert.equal(sha(p.source_archive),p.source_sha256);
}
assert(js.includes('legacyRecordCount !== 873 || addedRecords !== 7 || addedImages !== 8'));
assert(js.includes('selected31-reviewed-images.v13.json'));
assert(js.includes('selected31-reviewed-images.v14.json'));
assert.equal(873+visible.length,879);
assert.equal(gallery.counts.distinct_locally_hosted_paintings+visible.length+v14.image_patches.length,provenance.local_image_count+7);
console.log('V19 release gate PASS: canonical 873 and all published images preserved; V19 seven draft photos; 31 selected, 7 vetted candidates, 19 held, 5 existing; all research source hashes valid.');
