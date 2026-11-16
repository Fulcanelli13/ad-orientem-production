#!/usr/bin/env python3
"""Probe institutional source metadata for previously selected artworks, no images saved."""
import json,urllib.request,urllib.error,urllib.parse,re,html,time,collections
j=json.load(open("app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json"))
rows=j["museum_and_other_selected_queue"]
known=["www.mskgent.be","www.rijksmuseum.nl","art.thewalters.org","iiif.kmska.be","artmuseum.princeton.edu","clevelandart.org"]
subset=[r for r in rows if r["institution_domain"] in known]
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"AdOrientemSelectedArtSourceProbe/1.0 (https://github.com/Fulcanelli13/ad-orientem-production)","Accept":"application/ld+json,application/json,text/html;q=0.9,*/*;q=0.5"})
 with urllib.request.urlopen(req,timeout=25) as r:
  body=r.read(250000)
  ct=r.headers.get("Content-Type","")
  out={"status":r.status,"content_type":ct,"final_url":r.url,"length_read":len(body)}
  if "json" in ct.lower():
   try:
    d=json.loads(body)
    out["json_keys"]=list(d)[:20] if isinstance(d,dict) else []
    out["label"]=str(d.get("label",""))[:200] if isinstance(d,dict) else ""
    out["rights"]=str(d.get("rights",d.get("license","")))[:200] if isinstance(d,dict) else ""
    out["items"]=str(d.get("items",[]))[:450] if isinstance(d,dict) else ""
   except:out["json_invalid"]=True
  else:
   s=body.decode("utf8","replace")
   for pattern,label in [
    (r"""<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)""","og_image"),
    (r"""<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)""","twitter_image"),
    (r"""https?://[^"'<>\s]{20,150}(?:iiif|image)[^"'<>\s]{0,100}""","image_link"),
    (r'"license"\s*:\s*"([^"]{4,200})"',"embedded_license")]:
    m=re.search(pattern,s,re.I)
    if m:out[label]=html.unescape(m.group(1))[:250]
   out["headline"]=re.sub(r"<[^>]+>","",re.search(r"<title[^>]*>(.*?)</title>",s,re.S|re.I).group(1))[:180] if re.search(r"<title[^>]*>(.*?)</title>",s,re.S|re.I) else ""
  return out
for r in subset:
 try:v=fetch(r["source_url"])
 except Exception as e:v={"error":str(e)[:190]}
 print(json.dumps({"id":r["artwork_id"],"title":r["title"],"domain":r["institution_domain"],"url":r["source_url"],"data":v},ensure_ascii=False),flush=True)
 time.sleep(.2)
