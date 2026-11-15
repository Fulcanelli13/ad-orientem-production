import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  validatePrayerArtworkManifest,
  findPrayerCard,
  getApprovedCardArtworkOptions,
  resolvePrayerCardArtwork
} from '../site/prayers/card-artwork-resolver.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'site/prayers/card-artwork-bindings.v1.json');
const manifest = JSON.parse(readFileSync(input, 'utf8'));
assert.equal(validatePrayerArtworkManifest(manifest), true);
assert.equal(manifest.cards.length, 29);
assert.equal(new Set(manifest.cards.map(c => c.card_key)).size, manifest.cards.length);
assert.equal(manifest.cards.filter(c => c.family === 'angelus').length, 5);
assert.equal(manifest.cards.filter(c => c.family === 'regina_caeli').length, 4);
assert.equal(manifest.cards.filter(c => c.family === 'rosary' && c.mystery_set !== 'luminous').length, 15);
assert.equal(manifest.cards.filter(c => c.mystery_set === 'luminous').length, 5);
assert.equal(manifest.cards.reduce((n,c) => n + c.approved_exact_count, 0), 105);
assert.equal(manifest.cards.filter(c => c.approved_exact_count > 0).length, 17);
assert.equal(manifest.parent_prayer_candidates.find(x => x.route === 'angelus').candidates.length, 11);
assert.equal(manifest.parent_prayer_candidates.find(x => x.route === 'regina_caeli').candidates.length, 4);
const seen = new Set();
let matchedLocal = 0;
for (const card of manifest.cards) {
  assert.equal(card.production_runtime_card_id, null, 'No guessed runtime card ID');
  assert.equal(card.production_runtime_verified, false, 'No runtime card was verified');
  assert.equal(card.reviewed_stage_image_primary, null, 'No default paintings');
  assert.equal(card.owner_selected_primary, false, 'No inferred owner choice');
  assert.equal(card.active_image, null, 'No painted card is active');
  assert.equal(card.approved_exact_candidates.length, card.approved_exact_count);
  assert.equal(resolvePrayerCardArtwork(manifest, card.card_key, card.legacy_card_id), null);
  for (const c of card.approved_exact_candidates) {
    assert(!seen.has(card.card_key + ':' + c.artwork_id), 'Duplicate option');
    seen.add(card.card_key + ':' + c.artwork_id);
    assert.equal(c.image_release_state, 'BLOCKED_UNTIL_PHOTO_QA_AND_EXPLICIT_PRIMARY_CHOICE');
    if (!c.local_asset) continue;
    matchedLocal++;
    if (c.local_asset.file) assert(existsSync(path.join(root,'site',c.local_asset.file)));
    if (c.local_asset.repository_path) assert(existsSync(path.join(root,c.local_asset.repository_path)));
    assert.equal(c.local_asset.card_use_authorized, false);
  }
}
assert.equal(matchedLocal, 3, 'Three exact-card choices currently point to locally stored image binaries');
assert(getApprovedCardArtworkOptions(manifest,'rosary.joyful.1')
  .some(a => a.artwork_id === 'released-photo:angelus' && a.site_asset_path));
assert(getApprovedCardArtworkOptions(manifest,'rosary.sorrowful.5')
  .some(a => a.artwork_id === 'CANONICAL::ART-nthony-van-yck-he-ance-hrust'));
assert(getApprovedCardArtworkOptions(manifest,'rosary.joyful.1')
  .some(a => a.artwork_id === 'REVIEW::commons:21885843' && a.photo_qa === 'PHONE_VISUAL_AND_CINEMATIC_QA_PENDING'));
assert.equal(getApprovedCardArtworkOptions(manifest,'rosary.luminous.1').length,0);
assert.equal(getApprovedCardArtworkOptions(manifest,'unknown').length,0);
assert.equal(findPrayerCard(manifest,'unknown'),null);

// Activation test using an isolated copy, without changing the source registry.
const testManifest = structuredClone(manifest);
const testCard = testManifest.cards.find(c => c.card_key === 'rosary.joyful.1');
testCard.owner_selected_primary = true;
testCard.reviewed_stage_image_primary = 'released-photo:angelus';
testCard.production_runtime_verified = true;
testCard.production_runtime_card_id = 'runtime/rosary/joyful-1';
assert.equal(resolvePrayerCardArtwork(testManifest,'rosary.joyful.1',testCard.production_runtime_card_id),null,'Owner selection is not sufficient without photo QA');
const choice = testCard.approved_exact_candidates.find(c => c.artwork_id === testCard.reviewed_stage_image_primary);
choice.local_asset.photo_qa = 'PASSED_MOBILE_CINEMATIC_QA';
choice.local_asset.card_use_authorized = true;
choice.image_release_state = 'PUBLISHED_QA_APPROVED';
assert.equal(resolvePrayerCardArtwork(testManifest,'rosary.joyful.1','wrong-runtime-card'),null);
const resolved = resolvePrayerCardArtwork(testManifest,'rosary.joyful.1','runtime/rosary/joyful-1');
assert(resolved?.src.endsWith('/artwork/champaigne-annunciation-home-v9.jpg'));
const bad = structuredClone(testManifest);
bad.cards.find(c => c.card_key === 'rosary.joyful.1').reviewed_stage_image_primary = 'not-in-catalogue';
assert.throws(() => validatePrayerArtworkManifest(bad));

console.log('Prayer artwork adapter valid: 29 slots (Angelus 5, Regina 4, Rosary 15+5 held), 105 exact approved candidates, 3 local candidate binaries, 0 runtime defaults.');
