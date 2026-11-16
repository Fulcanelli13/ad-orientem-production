#!/usr/bin/env python3
"""Reconcile stated 84 older RECENT575 entries with actual owner approvals."""
import json,collections
def read(p):return json.load(open(p,encoding="utf-8"))
g=read("site/gallery/catalogue.v1.json")
b=read("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json")
w3=read("app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json")
w4=read("app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json")
miss=[x for x in g["records"] if x["id"].startswith("RECENT575::") and x["image"] is None]
oldhold={x["artwork_id"]:x for x in b["held"]}
outside=[x for x in miss if x["id"] not in oldhold]
prior=[x for x in miss if x["id"] in oldhold]
from collections import Counter
print(json.dumps({"counts":g["counts"],"total_recents":len([x for x in g["records"] if x["id"].startswith("RECENT575::")]),"remaining_575":len(miss),"outside_batch02":len(outside),"held_batch02":len(prior),"outside_owner_approved":Counter(str(x["owner_selected_artwork"]) for x in outside),"outside_status":dict(Counter(x["record_status"] for x in outside)),"outside_rights":dict(Counter(x["rights_note"] for x in outside))},ensure_ascii=False),flush=True)
for x in outside:
 print("OUTSIDE "+json.dumps({"id":x["id"],"title":x["title"],"artist":x["artist"],"source":x.get("source_url"),"owner":x["owner_selected_artwork"],"status":x["record_status"],"rights":x["rights_note"]},ensure_ascii=False),flush=True)
reason=Counter(oldhold[x["id"]]["reason"] for x in prior)
print(json.dumps({"prior_current_holds":dict(reason),"released_wave03":len(w3["assets"]),"released_wave04":len(w4["artworks"])},ensure_ascii=False),flush=True)
