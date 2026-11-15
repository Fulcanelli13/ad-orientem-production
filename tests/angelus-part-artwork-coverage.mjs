import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 validateAngelusPartPaintings,
 angelusPaintingsForPart,
 angelusPaintingPartsForArtwork,
 angelusPaintingOptionsForStage
} from '../site/prayers/angelus-part-paintings.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(readFileSync(path.join(root,name),'utf8'));
const source = read('site/prayers/angelus-part-paintings.v1.json');
const index = read('app-data/sacred-art/artwork-assignment-index.v2.json');
const catalogue = [...read('app-data/sacred-art/artwork-catalogue-01.v1.json').artworks,
  ...read('app-data/sacred-art/artwork-catalogue-02.v1.json').artworks];
const previousLinks = read('app-data/sacred-art/card-eligible-artworks.v1.json').artwork_card_links;
const a1 = read('site/prayers/angelus-regina-a1-crosswalk.v1.json');

assert.equal(validateAngelusPartPaintings(source),true);
assert.equal(source.artworks.length,36);
assert.equal(source.part_artwork_links.length,47);
assert.equal(source.editorial_parts.length,9);
assert.equal(source.part_artwork_links.filter(x=>x.owner_approved_for_this_part).length,40);
assert.equal(source.part_artwork_links.filter(x=>!x.owner_approved_for_this_part).length,7);
const grouped = Object.fromEntries(source.editorial_parts.map(x=>[x.part_id,x.artwork_count]));
assert.deepEqual(grouped,{
 angelus:11,ave:12,angelus_collect:1,dox:5,dox_scene:5,departed:1,
 departed_context:2,regina:4,regina_collect:6
});
for(const work of source.artworks) {
 assert(angelusPaintingPartsForArtwork(source,work.artwork_id).length>0,
   'Every reviewed painting must be attributed to a prayer part or explicit context');
 assert.equal(work.primary_card_assignment,null);
 assert.equal(work.publication_status,'NOT_AUTO_PUBLISHABLE');
}
for(const group of source.editorial_parts) {
 const options=angelusPaintingsForPart(source,group.part_id,{includeContext:true});
 assert.equal(options.length,group.artwork_count,'All reviewed paintings must be queryable');
 assert(options.every(x=>x.final_primary_for_stage===false));
}
assert.equal(angelusPaintingsForPart(source,'dox_scene').length,0);
assert.equal(angelusPaintingsForPart(source,'dox_scene',{includeContext:true}).length,5);
assert.equal(angelusPaintingsForPart(source,'departed_context').length,0);
assert.equal(angelusPaintingsForPart(source,'departed_context',{includeContext:true}).length,2);
assert.equal(angelusPaintingsForPart(source,'angelus_collect').length,1);
assert.equal(angelusPaintingsForPart(source,'regina_collect').length,6);
assert.equal(angelusPaintingOptionsForStage(source,'angelus.a1.prayer').length,1);
assert.equal(angelusPaintingOptionsForStage(source,'regina_caeli.a1.prayer').length,6);
assert(angelusPaintingOptionsForStage(source,'angelus.a1.conclusion').length>=5);
assert(angelusPaintingOptionsForStage(source,'angelus.a1.conclusion',{includeContext:true}).length>=10);
assert.equal(angelusPaintingOptionsForStage(source,'no_stage').length,0);
const stageSet=new Set(a1.stages.map(x=>x.display_card_key));
for(const part of source.editorial_parts) {
 assert(part.canonical_display_keys.every(k=>stageSet.has(k)),
   'Unknown donor stage mapping for '+part.part_id);
}
assert.equal(index.schema,'ao.sacred-art.assignment-index.v2');
assert.equal(index.source_catalogue_count,860);
assert.equal(index.total_works,862);
assert.equal(index.artworks.length,862);
assert.equal(index.coverage.with_recorded_card_links,249);
assert.equal(index.coverage.with_angelus_review_part_links,36);
assert.equal(index.coverage.unassigned_to_any_category,611);
assert.equal(previousLinks.length,index.source_card_artwork_associations);
assert.equal(catalogue.length,index.source_catalogue_count);
assert.equal(new Set(index.artworks.map(x=>x.artwork_id)).size,862);
for(const work of source.artworks){
 const global = index.artworks.find(a=>a.artwork_id===work.artwork_id);
 assert(global,'Missing from global assignment index: '+work.artwork_id);
 assert.equal(global.prayer_part_links.length,
   source.part_artwork_links.filter(x=>x.artwork_id===work.artwork_id).length);
}
assert.deepEqual(index.artworks.filter(a=>a.source_catalogue.includes('LEGACY')).map(a=>a.artwork_id).sort(),
 ['LEGACY::soulsCarracci','LEGACY::soulsTeresa']);
assert(source.source.demo_default_choices_are_not_owner_approval);
assert.equal(source.active_prayer_default_assignments.length,0);

const invalid=structuredClone(source);
invalid.part_artwork_links.find(x=>x.part_id==='dox_scene').owner_approved_for_this_part=true;
assert.throws(()=>validateAngelusPartPaintings(invalid));

console.log('Angelus review registry: all 36 works and 47 part links accounted for (40 owner-selected, 7 contextual); 862 total indexed, 611 legacy records have no supported attribution; zero guessed primaries.');
