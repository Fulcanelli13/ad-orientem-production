import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateAngelusA1Crosswalk, angelusA1Movements, angelusA1ApprovedUnitOptions}
  from '../site/prayers/angelus-a1-stage-bridge.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read = file => readFileSync(path.join(root,file),'utf8');
const crosswalk=JSON.parse(read('site/prayers/angelus-regina-a1-crosswalk.v1.json'));
const artworks=JSON.parse(read('site/prayers/card-artwork-bindings.v1.json'));
const donor=read('design/prayer-donors/2026-11-11-a1/angelus-a1-definitive.js');
const donorStyles=read('design/prayer-donors/2026-11-11-a1/angelus-a1-definitive-styles.js');

assert.equal(validateAngelusA1Crosswalk(crosswalk),true);
assert(donor.includes('angelus-a1-three-bells-caption-v1'));
assert(donor.includes('STAGE_TITLES={'));
assert(donor.includes('labelPrayerUnits(view)'));
assert(donor.includes('anchorRitualIcon(card'));
assert(donor.includes('for(const count of [3,3,3,9])'));
assert(donorStyles.includes('.aoA1Caption>span:before'));

const angelus=angelusA1Movements(crosswalk,'angelus');
const regina=angelusA1Movements(crosswalk,'regina_caeli');
assert.deepEqual(angelus.map(x=>x.stage_id),
  ['announcement','fiat','incarnation','prayer','conclusion']);
assert.deepEqual(regina.map(x=>x.stage_id),
  ['rejoice','resurrection','prayer','conclusion']);
assert.equal(angelusA1Movements(crosswalk,'angelus',{historicalConclusion:false}).length,4);
assert.equal(angelusA1Movements(crosswalk,'regina_caeli',{historicalConclusion:false}).length,3);
assert.deepEqual(angelus.find(x=>x.stage_id==='prayer').canonical_unit_indices,[6,7]);
assert.deepEqual(regina.find(x=>x.stage_id==='prayer').canonical_unit_indices,[2,3]);

const exactAngelus=angelusA1ApprovedUnitOptions(crosswalk,artworks,'angelus.a1.prayer');
const exactRegina=angelusA1ApprovedUnitOptions(crosswalk,artworks,'regina_caeli.a1.prayer');
assert.equal(exactAngelus.length,1);
assert.equal(exactRegina.length,6);
assert(exactAngelus.every(x=>x.source_editorial_key==='angelus.collect' &&
  x.unit==='collect' && !x.release_as_stage_background));
assert(exactRegina.every(x=>x.source_editorial_key==='regina_caeli.collect' &&
  x.unit==='collect' && !x.release_as_stage_background));
for(const stage of [...angelus,...regina]) {
  if(stage.stage_id==='prayer')continue;
  assert.equal(angelusA1ApprovedUnitOptions(crosswalk,artworks,stage.key).length,0);
}
assert.equal(angelusA1ApprovedUnitOptions(crosswalk,artworks,'nonexistent').length,0);
assert.throws(()=>angelusA1Movements(crosswalk,'unknown'));
const mutated=structuredClone(crosswalk);
mutated.stages[0].primary_artwork_id='AUTO_SELECTED';
assert.throws(()=>validateAngelusA1Crosswalk(mutated));

assert.equal(crosswalk.donor.status,'DRAFT_UNMERGED');
assert.equal(crosswalk.scope.startsWith('SEMANTIC_CARD_CROSSWALK_ONLY'),true);
console.log('Angelus/Regina A1 crosswalk verified: 5+4 movements, 7 exact Collect unit options, zero whole-stage primary images; legacy editorial stages correctly consolidated.');
