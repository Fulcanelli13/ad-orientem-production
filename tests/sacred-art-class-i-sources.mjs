import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const manifest = JSON.parse(fs.readFileSync('app-data/sacred-art/class-i-source-recovery-20261116.v1.json', 'utf8'));
assert.equal(manifest.schema, 'ao.sacred-art.class-i-legacy-exact-source-recovery.v1');
assert.equal(manifest.sources.length, 3);
assert.equal(manifest.summary.distinct_jpegs, 3);
assert.equal(manifest.summary.source_bytes, 11438704);
assert.equal(manifest.summary.sha256_failures, 0);
assert.equal(manifest.summary.git_blob_mismatches, 0);

const expected = new Map([
  ['2026-03-01', 'a5b060eda8b9a6eba6c8e2f1a5c92d2bdd341785'],
  ['2026-03-15', '26aaf88956e0624881aaa611295c6c9334753b37'],
  ['2026-05-25', '0b18c483a56493d0d1218e26abd558ef74575ddf']
]);
let total = 0;
const seen = new Set();
for (const item of manifest.sources) {
  assert.equal(item.status, 'EXACT_SOURCE_PRESERVED__NOT_PUBLISHED__NO_NEW_GALLERY_ASSIGNMENT');
  assert.equal(item.gallery_activation, false);
  assert.equal(item.source_ref, '14cd9d3ac11a6f27856f4740ae7c81e1b073bf1a');
  assert.equal(item.source_git_sha, expected.get(item.date));
  assert.ok(Number.isInteger(item.historical_release_pr));
  assert.ok(item.rights && item.rights.includes('caveat'));
  assert.ok(item.source_path.startsWith('assets/home/class-i-2026/'));
  assert.equal(item.source_master_path, `app-data/sacred-art/source-masters/${item.source_git_sha}.jpg`);
  assert.ok(!seen.has(item.source_git_sha));
  seen.add(item.source_git_sha);
  const data = fs.readFileSync(item.source_master_path);
  assert.equal(data.length, item.source_bytes);
  assert.equal(data[0], 0xff);
  assert.equal(data[1], 0xd8);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), item.source_sha256);
  const objectBytes = Buffer.concat([Buffer.from(`blob ${data.length}\0`), data]);
  assert.equal(crypto.createHash('sha1').update(objectBytes).digest('hex'), item.source_git_sha);
  total += data.length;
}
assert.equal(seen.size, 3);
assert.equal(total, manifest.summary.source_bytes);
const catalogue = JSON.parse(fs.readFileSync('site/gallery/catalogue.v1.json', 'utf8'));
assert.equal(catalogue.records.length, 870);
assert.equal(catalogue.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')).length, 862);
console.log('PASS: three previously released Class I originals recovered exactly (11,438,704 bytes); gallery IDs untouched.');
