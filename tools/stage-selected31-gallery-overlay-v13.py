#!/usr/bin/env python3
"""Stage five source-verified editorial paintings in additive gallery overlay.

Keeps the historical 862-item canonical source registry and all prayer-card
approvals intact. Safe only on the V13 draft branch; no main publication.
"""
import hashlib,json,pathlib,shutil

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/"app-data/sacred-art/staged-selected31-v13/acquisition-results.v13.json"
GALLERY=ROOT/"site/gallery"
IMAGE=GALLERY/"images"
JS=GALLERY/"gallery.js"
ADD=GALLERY/"selected31-reviewed-images.v13.json"
mapping={"bap-bordone":("Luminous I · Baptism in Jordan","National Gallery of Art, Washington"),
"bap-tintoretto":("Luminous I · Baptism in Jordan","Cleveland Museum of Art"),
"bap-bassano":("Luminous I · Baptism in Jordan","The Metropolitan Museum of Art"),
"bap-poussin":("Luminous I · Baptism in Jordan","National Gallery of Art, Washington"),
"cana-master":("Luminous II · Wedding at Cana","National Gallery of Art, Washington")}
assert SRC.exists()
report=json.loads(SRC.read_text())
rows=report["records"]
assert len(rows)==5 and {r["review_artwork_id"] for r in rows}==set(mapping)
canonical=json.loads((GALLERY/"catalogue.v1.json").read_text())
assert canonical["counts"]["total_records"]==862
assert len(canonical["records"])==862
assert not any(z.get("source_url") in {r["museum_page"] for r in rows} for z in canonical["records"])
existing=set(z["id"] for z in canonical["records"])
out=[];provenance=[]
for r in rows:
    rid=r["review_artwork_id"]
    assert r["publication_status"]=="STAGED_ONLY_NOT_LIVE_NOT_PRAYER_APPROVED"
    src=ROOT/r["derivative_path"]
    data=src.read_bytes()
    assert hashlib.sha256(data).hexdigest()==r["derivative_sha256"]
    assert len(data)==r["derivative_bytes"]
    original=ROOT/r["source_path"]
    assert hashlib.sha256(original.read_bytes()).hexdigest()==r["source_sha256"]
    name="selected31-"+rid+"-2000.webp"
    dest=IMAGE/name; dest.write_bytes(data)
    context,institution=mapping[rid]
    record_id="REVIEW31::"+rid
    assert record_id not in existing
    out.append({"id":record_id,"title":r["title"],"artist":r["artist"],
      "institution":institution,"source_url":r["museum_page"],
      "record_status":"OWNER_SELECTED_EDITORIAL_V12__ADDITIVE_GALLERY_RECORD",
      "owner_selected_artwork":True,
      "rights_note":r["rights_evidence"],"review_context":context,
      "image":{"src":"./gallery/images/"+name,
       "provenance":r["museum_page"]+" · "+r["rights_evidence"],
       "usage":"GALLERY_IMAGE_ONLY__PRAYER_QA_PENDING",
       "quality":"UNCROPPED_2000PX_LOCAL_WEBP__INSTITUTIONAL_SOURCE_VERIFIED",
       "pixel_width":r["derivative_dimensions"][0],
       "pixel_height":r["derivative_dimensions"][1]},
      "image_url_source_only":r["source_url"],
      "scene_ids":[context],"prayer_parts":[],
      "exact_prayer_cards":[],"parent_prayer_candidates":[],
      "eligible_card_count":0,"historical_destinations":[context],
      "attribution_status":"EXACT_MUSEUM_OBJECT_VERIFIED"})
    provenance.append({"review_artwork_id":rid,
       "gallery_file":"site/gallery/images/"+name,
       "derivative_bytes":len(data),
       "derivative_sha256":r["derivative_sha256"],
       "source_archive":r["source_path"],
       "source_sha256":r["source_sha256"],
       "source_dimensions_px":r["source_dimensions"],
       "gallery_dimensions_px":r["derivative_dimensions"],
       "rights_evidence":r["rights_evidence"],
       "identity_evidence":r["identity_evidence"],
       "museum_page":r["museum_page"],
       "publication_scope":"GALLERY_ONLY__NEVER_PRAYER_PRIMARY_AUTOMATICALLY"})
overlay={"schema":"ao.sacred-art.selected31-gallery-overlay.v13",
  "canonical_master_unchanged":True,
  "baseline_registry_count":862,
  "scope":"Five previously selected Luminous paintings, not additional canonical prayer-card approvals",
  "records":out,"provenance":provenance}
ADD.write_text(json.dumps(overlay,indent=2,ensure_ascii=False)+"\n")
text=JS.read_text()
old='        catalogue = data;\n'
new='''        // Add the separately approved editorial painting review without
        // rewriting the 862-entry canonical source master or its approvals.
        const supplementResponse = await fetch("./gallery/selected31-reviewed-images.v13.json",{cache:"no-cache"});
        if (!supplementResponse.ok) throw new Error("Review painting supplement unavailable");
        const supplement = await supplementResponse.json();
        if (supplement.schema !== "ao.sacred-art.selected31-gallery-overlay.v13" ||
            supplement.baseline_registry_count !== data.records.length ||
            supplement.records?.length !== 5) throw new Error("Invalid reviewed gallery supplement");
        for (const art of supplement.records) {
          if (!art.id?.startsWith("REVIEW31::") || ids.has(art.id) ||
              !art.image?.src?.startsWith("./gallery/images/selected31-") ||
              art.exact_prayer_cards?.length) throw new Error("Invalid review image scope");
          ids.add(art.id);
          data.records.push(art);
        }
        data.counts.total_records += supplement.records.length;
        data.counts.distinct_locally_hosted_paintings += supplement.records.length;
        catalogue = data;
'''
if old in text:
    text=text.replace(old,new,1)
elif new not in text:
    raise ValueError("No recognised gallery loader anchor")
JS.write_text(text)
readme=GALLERY/"README.md"
tail='''\n## Selected Luminous review photographs (V13 draft)\n\nFive separately source-verified, owner-selected Luminous paintings are available in\n\`selected31-reviewed-images.v13.json\` with five locally hosted full-composition\nWebPs. The historical 862-entry catalogue remains **unchanged**. The gallery\nloader adds these five editorial records on top of the canonical source master,\nso the combined view has 867 searchable records and 59 distinct display images.\n\nTheir source JPEGs and SHA-256 evidence are preserved under\n\`app-data/sacred-art/staged-selected31-v13/\`. These are gallery assets only;\nno prayer runtime card, cinematic transition or new stage primary is authorized.\nThe V13 promotion is on draft PR #21 and is not deployed to main.\n'''
contents=readme.read_text()
if '## Selected Luminous review photographs (V13 draft)' not in contents:
    readme.write_text(contents+tail)
print("Prepared five additive gallery images, canonical 862 master unchanged")
