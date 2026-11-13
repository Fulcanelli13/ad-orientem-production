#!/usr/bin/env python3
"""Single-use controlled transfer of approved visual assets; no research code."""
import hashlib
import json
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.request

manifest = json.loads(pathlib.Path("design/approved-visual-asset-import.v1.json").read_text())
assert manifest["schema"] == "AO_PRODUCTION_APPROVED_VISUAL_ASSET_IMPORT_V1"
repo = manifest["source"]["repository"]
commit = manifest["source"]["commit"]
allowed_root = pathlib.Path("site/assets").resolve()
assets = manifest["assets"]
assert len(assets) == 14, "Unexpected asset allowlist change"
fetched = []

for row in assets:
    source_path = row["source"]
    dest = pathlib.Path(row["destination"])
    assert not source_path.startswith("/") and ".." not in pathlib.PurePosixPath(source_path).parts
    assert dest.resolve().is_relative_to(allowed_root), "Destination outside curated assets"
    url = f"https://raw.githubusercontent.com/{repo}/{commit}/{source_path}"
    error = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Ad-Orientem-Approved-Asset-Importer/1"})
            with urllib.request.urlopen(req, timeout=35) as response:
                payload = response.read()
            break
        except (urllib.error.URLError, TimeoutError) as exc:
            error = exc
            time.sleep(2 * (attempt + 1))
    else:
        raise RuntimeError(f"Could not fetch allowlisted asset {source_path}: {error}")
    git_blob = hashlib.sha1(f"blob {len(payload)}\\0".encode() + payload).hexdigest()
    if git_blob != row["git_blob_sha"]:
        raise RuntimeError(f"Blob hash mismatch for {source_path}: {git_blob}")
    if len(payload) != row["size_bytes"]:
        raise RuntimeError(f"Byte count mismatch for {source_path}")
    fetched.append((dest, payload))
    print(f"Verified {source_path}: {len(payload):,} bytes")

# Apply only if all downloaded objects verified.
for dest, payload in fetched:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.read_bytes() != payload:
        raise RuntimeError(f"Existing asset differs: {dest}")
    dest.write_bytes(payload)
print(f"Imported {len(fetched)} pinned licensed typography/navigation assets.")
