"""Copy only the verified app and its bound data to the GitHub Pages directory."""
import hashlib, json, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'app/dist'; target=ROOT/'docs'
manifest=json.loads((source/'data-app-build.json').read_text())
for key in ('html','snapshot'):
    entry=manifest[key]; path=source/entry['path']
    assert path.parent==source
    assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256']
snapshot=json.loads((source/manifest['snapshot']['path']).read_text())
assert snapshot['buildStatus']=='complete'
target.mkdir(exist_ok=True)
# Old, generated data sidecars are the only files removed on a rebuild.
for path in target.glob('snapshot.*.json'):
    if path.name!=manifest['snapshot']['path']: path.unlink()
for entry in (manifest['html'],manifest['snapshot']):
    shutil.copyfile(source/entry['path'],target/entry['path'])
shutil.copyfile(source/'data-app-build.json',target/'data-app-build.json')
(target/'.nojekyll').touch()
print('Verified static site packaged in docs/')
