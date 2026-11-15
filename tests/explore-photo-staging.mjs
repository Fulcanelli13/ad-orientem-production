// Review-only integrity test: photo files never enter the deployable site directory.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const manifest=JSON.parse(readFileSync("review/explore-photo-candidates/manifest.v1.json","utf8"));
assert.equal(manifest.schema,"AO_EXPLORE_OWNER_SELECTED_SIX_MEDIA_STAGE_V1");
assert.equal(manifest.disposition,"REVIEW_ONLY_NO_SITE_TRANSFER");
assert.equal(manifest.assets.length,6);
const seen=new Set();
for(const asset of manifest.assets){
 assert.ok(asset.place_id.startsWith("place:") && !seen.has(asset.place_id));
 seen.add(asset.place_id);
 assert.ok(asset.staged_path.startsWith("review/explore-photo-candidates/"));
 assert.ok(asset.source_url.startsWith("https://commons.wikimedia.org/wiki/File:"));
 assert.ok(asset.license_url.startsWith("https://creativecommons.org/"));
 assert.equal(asset.release_state,"HOLD_PENDING_CLAUDE_CARD_FOLIO_SCREENSHOTS");
 assert.ok(asset.photographer && asset.owner_selected_file.startsWith("File:"));
 const bytes=readFileSync(asset.staged_path);
 assert.equal(bytes.length,asset.bytes);
 assert.equal(bytes.toString("ascii",0,4),"RIFF");
 assert.equal(bytes.toString("ascii",8,12),"WEBP");
 assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.derivative_sha256);
 const le16=i=>bytes[i]|(bytes[i+1]<<8);
 assert.equal(bytes.toString("ascii",12,16),"VP8 ");
 assert.equal(le16(26)&16383,asset.width);
 assert.equal(le16(28)&16383,asset.height);
}
assert.equal(manifest.assets.filter(a=>a.license==="CC0 1.0").length,1);
assert.equal(manifest.assets.filter(a=>a.license==="CC BY-SA 4.0").length,5);
const data=JSON.parse(readFileSync("site/explore/selected-sites.v1.json","utf8"));
assert.equal(data.sacred.length,18);
assert.equal(data.tlm.length,10);
const photoIds=new Set(manifest.assets.map(a=>a.place_id));
for(const item of [...data.sacred,...data.tlm]){
 const selected=photoIds.has(item.id);
 assert.equal(item.media_status,selected?"OWNER_SELECTED_PHOTO_TRANSFERRED":"NO_IMAGE_TRANSFERRED",
  "Incorrect photo transfer boundary: "+item.id);
 if(!selected){assert.equal(item.media,undefined);continue;}
 const staged=manifest.assets.find(a=>a.place_id===item.id);
 assert.equal(item.media.src,"./explore/media/"+staged.staged_path.split("/").at(-1));
 assert.equal(item.media.source_url,staged.source_url);
 assert.equal(item.media.photographer,staged.photographer);
 assert.equal(item.media.license,staged.license);
 assert.equal(item.media.license_url,staged.license_url);
 assert.equal(item.media.sha256,staged.derivative_sha256);
 const publicationFile="site/"+item.media.src.slice(2);
 const live=readFileSync(publicationFile);
 const candidate=readFileSync(staged.staged_path);
 assert.deepEqual(live,candidate,"Published image bytes must equal the owner-reviewed derivative");
 assert.equal(createHash("sha256").update(live).digest("hex"),staged.derivative_sha256);
}
assert.equal(data.tlm.filter(x=>x.media).length,0);
console.log("PASS six exact owner-selected Explore photos: published bytes, source rights, staged SHA-256, remaining 22 no-photo sites");
