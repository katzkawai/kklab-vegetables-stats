"""Verify a source build and package it with its reviewed snapshot for GitHub Pages."""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "app/dist"
target = ROOT / "docs"
receipt = json.loads((ROOT / "app/.source-build.json").read_text())
assert receipt["source"] is True and receipt["prebuilt"] is False
html = (source / "index.html").read_bytes()
snapshot_bytes = (ROOT / "app/src/data.json").read_bytes()
html_hash = hashlib.sha256(html).hexdigest()
snapshot_hash = hashlib.sha256(snapshot_bytes).hexdigest()
assert html_hash == receipt["htmlSha256"]
assert snapshot_hash == receipt["snapshotSha256"]
assert f'name="data-app-snapshot-sha256" content="{snapshot_hash}"'.encode() in html
assert json.loads(snapshot_bytes)["buildStatus"] == "complete"

# Source builds embed the data. Retain a separate, hashed copy for inspection.
manifest = {
    "version": 1,
    "kind": "source-inline-v1",
    "html": {"path": "index.html", "sha256": html_hash, "bytes": len(html)},
    "snapshot": {
        "path": f"snapshot.{snapshot_hash}.json",
        "sha256": snapshot_hash,
        "bytes": len(snapshot_bytes),
        "embedded": True,
    },
    "sourceSnapshotSha256": snapshot_hash,
}
target.mkdir(exist_ok=True)
for path in target.glob("snapshot.*.json"):
    if path.name != manifest["snapshot"]["path"]:
        path.unlink()
shutil.copyfile(source / "index.html", target / "index.html")
(target / manifest["snapshot"]["path"]).write_bytes(snapshot_bytes)
(target / "data-app-build.json").write_text(json.dumps(manifest, indent=2) + "\n")
(target / ".nojekyll").touch()
print("Verified source build and snapshot packaged in docs/")
