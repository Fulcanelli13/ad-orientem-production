#!/usr/bin/env python3
"""Inventory every still-unpublished selected artwork against archived source masters."""
import json,pathlib,re,collections
R=pathlib.Path(".")
def read(p):return json.loads((R/p).read_text(encoding="utf-8"))
def write(p,v):
 target=R/p;target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
g=read("site/gallery/catalogue.v1.json")
a=read("app-data/sacred-art/source-master-migration-20261116.v1.json")
b=read("app-data/sacred-art/source-photo-recovery-20261116.v1.json")
c=read("app-data/sacred-art/class-i-source-recovery-20261116.v1.json")
prev=read("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json")
assert len(g["records"])==873 and g["counts"]["distinct_locally_hosted_paintings"]==343
unpublished=[x for x in g["records"] if x["image"] is None]
approved=[x for x in unpublished if x.get("owner_selected_artwork")]
other=[x for x in approved if not x["id"].startswith("RECENT575::")]
all_unselected=[x for x in unpublished if not x.get("owner_selected_artwork")]
def domain(url):
 m=re.match(r"https?://([^/]+)",url or "")
 return m.group(1) if m else "not-recorded"
def source_group(row):
 u=row.get("source_url") or ""
 rights=row.get("rights_note") or ""
 if re.search(r"NOT_CERTIFIED|NOT_INDEPENDENTLY_CLEARED|NOT_PRODUCTION_CLEARED|NOT_VERIFIED",rights,re.I):
  return "EXACT_PHOTOGRAPH_OR_REUSE_NOT_CERTIFIED"
 if re.search(r"permission|fee|paid|commercial-use|licens|©|copyright|restriction",rights,re.I):
  return "RESTRICTED_OR_SOURCE_REUSE_REVIEW"
 if re.search(r"CC0|Public domain|PUBLIC DOMAIN|PDM|PD-Art",rights,re.I):
  return "POSITIVE_SOURCE_LICENSE_CLAIM_NEEDS_FILE_CHECK"
 return "UNCLASSIFIED_SOURCE_RIGHTS"
groups=collections.Counter(map(source_group,other))
domains=collections.Counter(map(lambda x:domain(x.get("source_url")),other))
preexisting=[]
for row in other:
 srcurl=(row.get("source_url") or "").lower()
 matches=[]
 for e in a["inventory"]:
  if e.get("transfer_status") not in ["PERMANENT_MASTER_TRANSFERRED__PRAYER_PLACEMENT_UNCHANGED","ALREADY_PRESERVED_EXACT_BLOB"]:continue
  if row["id"] in (e.get("gallery_artwork_ids") or []) or row["id"] == e.get("original_artwork_id"):
   matches.append({"type":"LEGACY_RELEASED_MASTER","file":e["master_path"],"source_ref":e["source_ref"],"old_pr":e.get("source_release_pr"),"rights":e.get("source_release_rights"),"status":e.get("transfer_status")})
 for e in b["sources"]:
  if row["id"]==e.get("artwork_id") or (e.get("record_url") and e["record_url"].lower()==srcurl):
   matches.append({"type":"MUSEUM_SOURCE_MASTER","file":e.get("source_master_path"),"source_ref":e.get("record_url"),"rights":e.get("recorded_rights"),"status":e.get("status")})
 for e in c["sources"]:
  if row["id"]==e.get("artwork_id"):
   matches.append({"type":"CLASS_I_MASTER","file":e.get("source_master_path"),"rights":e.get("rights")})
 if matches:
  preexisting.append({"artwork_id":row["id"],"title":row["title"],"artist":row["artist"],"sources":matches,"record_rights":row.get("rights_note")})
entries=[{
 "artwork_id":r["id"],"title":r["title"],"artist":r["artist"],"institution":r.get("institution"),
 "source_url":r.get("source_url"),"rights_note":r.get("rights_note"),
 "owner_selected":bool(r.get("owner_selected_artwork")),
 "record_status":r["record_status"],"reuse_lane":source_group(r),
 "institution_domain":domain(r.get("source_url")),
 "candidate_prayer_card_count":r.get("eligible_card_count",0),
 "owner_approved_prayer_card_count":len(r.get("exact_prayer_cards",[]))
} for r in other]
p={
 "schema":"ao.sacred-art.bulk-gallery-museum-candidate-inventory.v1",
 "date":"2026-11-16",
 "scope":"Only existing user-selected catalogue identities still missing image files; evidence inventory, NOT photo reuse clearance or approval for new prayer/calendar assignments.",
 "counts":{"catalogue_records":873,"gallery_paintings":343,"image_bearing_records":346,
 "image_missing_all":len(unpublished),"image_missing_owner_selected":len(approved),
 "image_missing_november3_commons":sum(x["id"].startswith("RECENT575::") for x in approved),
 "image_missing_other_selected":len(other),
 "image_missing_not_owner_selected":len(all_unselected),
 "archival_original_master_matches":len(preexisting),
 "source_rights_lanes":dict(groups),"source_domains":dict(domains)},
 "existing_master_matches":preexisting,
 "museum_and_other_selected_queue":entries,
 "policy":"Preserve existing approvals and exclusions; do not auto-publish image solely because museum source is public domain on a different object or a low-quality/restricted photograph. Neither historical artist nor title alone proves exact artwork/photograph identity.",
 "previous_commons_remaining_holds":prev["summary"]["held_or_deferred_rows"]
}
write("app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json",p)
print(json.dumps(p["counts"],ensure_ascii=False),flush=True)
print(json.dumps({"existing_source_matches":preexisting[:18]},ensure_ascii=False),flush=True)
