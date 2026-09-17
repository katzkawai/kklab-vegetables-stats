"""Cross-check the time series against the separately published annual workbook."""
import csv, json, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
metadata=json.loads((ROOT/'data/metadata.json').read_text())
with (ROOT/'data/harvest.csv').open(encoding='utf-8-sig') as f: rows=list(csv.DictReader(f))
assert len(rows)==780
lookup={(r['vegetable'],int(r['year'])):int(r['harvest_t']) if r['harvest_t'] else None for r in rows}
assert len(lookup)==780
assert sum(v is None for v in lookup.values())==16
for (name,year),value in lookup.items():
    assert value is not None or (name=='ブロッコリー' and year<1989)
with zipfile.ZipFile(ROOT/'data/raw/annual-2024.xlsx') as z:
    strings=[''.join(t.text or '' for t in si.findall('s:t',ns)+si.findall('s:r/s:t',ns)) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    xml=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
verified=[]
for row in xml.findall('.//s:row',ns):
    cells={}
    for c in row:
        v=c.find('s:v',ns)
        if v is not None:
            cells[''.join(filter(str.isalpha,c.get('r')))]=strings[int(v.text)] if c.get('t')=='s' else v.text
    name=cells.get('B')
    if name not in metadata['vegetables']: continue
    for col,year in zip(['S','T','U','V','W','X'],range(2019,2025)):
        assert int(cells[col])==lookup[name,year], (name,year,cells[col],lookup[name,year])
        verified.append([name,year])
assert len(verified)==90
print('PASS: 780 unique crop-year records, 16 documented missing values; all 90 values for 2019–2024 match the annual final report.')
