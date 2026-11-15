import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'app-data/sacred-art', name), 'utf8'));
const idx = read('prayer-card-index.v1.json');
const artworks = [...read('artwork-catalogue-01.v1.json').artworks, ...read('artwork-catalogue-02.v1.json').artworks];
const links = read('card-eligible-artworks.v1.json').artwork_card_links;
const provenance = read('staged-image-provenance.v1.json');
assert.equal(artworks.length, 860);
assert.equal(idx.prayer_cards.length, 288);
assert.equal(idx.prayer_routes.length, 179);
assert.equal(links.length, 660);
const artIds = new Set(artworks.map(a => a.id));
const cardIds = new Set(idx.prayer_cards.map(c => c.card_id));
assert.equal(artIds.size, artworks.length, 'Duplicate art IDs');
assert.equal(cardIds.size, idx.prayer_cards.length, 'Duplicate card IDs');
assert.equal(new Set(links.map(x => x.card_id + '\\0' + x.artwork_id)).size, links.length, 'Duplicate card–art links');
for (const e of links) {
  assert(artIds.has(e.artwork_id), 'Artwork missing from catalogue: ' + e.artwork_id);
  assert(cardIds.has(e.card_id), 'Card missing from index: ' + e.card_id);
  assert.equal(e.placement_suitable_for_auto_publication, false);
}
for (const c of idx.prayer_cards) {
  assert.equal(c.production_runtime_verified, false);
  assert.equal(c.image_publish_ready_count, 0);
}
for (const img of provenance.staged_images) {
  const bytes = fs.readFileSync(path.join(root, img.path));
  assert.equal(bytes.length, img.size_bytes, 'Unexpected staged image size: ' + img.path);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
}
assert.equal(provenance.public_path_release_ready, false);
console.log('Sacred-art curation registry valid: 860 works, 288 card slots, 660 distinct links, 2 staged WebP files; no runtime defaults.');
