# /// script
# requires-python = ">=3.11"
# dependencies = ["xlrd==2.0.2"]
# ///
"""Rebuild the reviewed snapshot and CSV from the archived official XLS files."""
import csv, hashlib, json, re
from datetime import datetime, timezone
from pathlib import Path
import xlrd

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['ばれいしょ','キャベツ','たまねぎ','だいこん','はくさい','トマト','レタス','にんじん','きゅうり','ねぎ','なす','ほうれんそう','ブロッコリー','ピーマン','さといも']
FILES = [('roots','根菜類','000040470474'),('leaves','葉茎菜類','000040470534'),('fruits','果菜類','000040470594')]
MAFF = 'https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/sakkyou_yasai/'
ESTAT = 'https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001486220&page=1'
rows, sources = [], []
retrieved_at = datetime.fromtimestamp(max((ROOT/'data/raw'/(f+'.xls')).stat().st_mtime for f,_,_ in FILES), timezone.utc).isoformat()
for filename, group, statid in FILES:
    path = ROOT / 'data/raw' / (filename+'.xls')
    sheet = xlrd.open_workbook(path).sheet_by_index(0)
    assert sheet.cell_value(3,0) == '全国'
    for c, name in enumerate(sheet.row_values(4)):
        if name not in NAMES: continue
        assert sheet.cell_value(5,c+1) == '収穫量' and sheet.cell_value(6,c+1) == 't'
        for r in range(7,sheet.nrows):
            match = re.search(r'\((\d{4})\)', str(sheet.cell_value(r,0)))
            if not match: continue
            year = int(match[1]); raw = sheet.cell_value(r,c+1)
            if isinstance(raw,(int,float)):
                assert raw >= 0 and raw == int(raw)
                value = int(raw)
            else:
                assert str(raw).strip() in {'…','...','-','－','x','X',''}
                value = None
            rows.append({'year':year,'vegetable':name,'group':group,'harvest_t':value,'source_file':path.name,'source_cell':f'{xlrd.formula.colname(c+1)}{r+1}','source_symbol':str(raw) if value is None else ''})
    sources.append({'name':f'全国・{group}（1973〜2024年）','url':f'https://www.e-stat.go.jp/stat-search/file-download?statInfId={statid}&fileKind=0','file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'updated':'2026-07-03'})
rows.sort(key=lambda r:(r['year'],NAMES.index(r['vegetable'])))
assert len(rows)==52*15 and len({(r['year'],r['vegetable']) for r in rows})==len(rows)
missing=[r for r in rows if r['harvest_t'] is None]
assert len(missing)==16 and all(r['vegetable']=='ブロッコリー' and r['year']<1989 for r in missing)
metadata={'retrieved':'2026-09-17','official_updated':'2026-07-03','period':[1973,2024],'vegetables':NAMES,'sources':sources,'scope':'全国・品目別年間計・収穫量（t）','notes':['15品目は2026年9月時点の指定野菜に対応。過去の指定状況を示すものではない。','ブロッコリーは1989年にカリフラワーから分離。1973〜1988年は未掲載で、0ではない。','主産県調査年の全国値には農林水産省による推計を含む。','季節別区分を加算せず、品目の年間計を直接使用。トマトはミニ・加工用を含み、ばれいしょは春植え・秋植えを含む。','2025年産は一部品目の公表のみのため、全品目共通の2024年産まで収録。']}
(ROOT/'data/metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
with (ROOT/'data/harvest.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n'); w.writeheader(); w.writerows(rows)
source={'label':'農林水産省「作物統計調査／野菜生産出荷統計」長期累年','provider':'農林水産省 / e-Stat','executedAt':retrieved_at,'updatedAt':'2026-07-03','coverage':{'startDate':'1973-01-01','endDate':'2024-12-31'},'grain':'全国 × 年産 × 品目','files':[s['file'] for s in sources],'links':[{'label':'農林水産省：作況調査（野菜）','url':MAFF},{'label':'e-Stat：長期累年統計表','url':ESTAT}, *[{'label':s['name'],'url':s['url']} for s in sources]],'filters':['全国','品目の年間計','収穫量（t）','15品目・1973〜2024年'],'assumptions':metadata['notes'],'metricDefinitions':[{'label':'収穫量（t）','definition':'収穫物のうち生食用・加工用として流通できる基準に達するものの重量。出荷量とは異なる。'},{'label':'収穫量（万t）','definition':'公表収穫量（t）を10,000で除した値。','formula':'harvest_t / 10000'},{'label':'指数（開始年＝100）','definition':'選択した開始年の収穫量を100とする。同年が欠測の品目は算出しない。','formula':'harvest_t / baseline_harvest_t * 100'},{'label':'期間増減率','definition':'選択終了年と開始年の収穫量を比較。基準年が欠測または0なら算出しない。','formula':'(end_harvest_t / start_harvest_t - 1) * 100'}],'evidenceFlow':[{'title':'公式ファイル取得','detail':s['url']+' / SHA-256: '+s['sha256']} for s in sources]+[{'title':'抽出と検証','detail':'scripts/prepare_data.py：全国・年間計の収穫量列を抽出。単位t、780行のキー一意性、16件の未掲載を検証。'}]}
snapshot={'id':'kklab-vegetables-harvest','surface':'dashboard','title':'主要野菜の収穫量','generatedAt':retrieved_at,'status':'reviewed','buildStatus':'creating','filters':[{'id':'vegetable','label':'野菜','field':'vegetable','multiple':True,'defaultValue':['ばれいしょ','キャベツ','たまねぎ','だいこん','トマト','ブロッコリー']}],'queries':{'harvest':{'rows':rows,'source':source,'methods':[{'language':'python','code':'uv run scripts/prepare_data.py（リポジトリ内の元Excelから再生成）'}]}},'metadata':metadata}
output=ROOT/'app/src/data.json'
if output.exists():
    old=json.loads(output.read_text()); snapshot['id']=old['id']; snapshot['buildStatus']=old.get('buildStatus','creating')
    output.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/reviewed.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
print(f'{len(rows)} rows; {len(missing)} missing; {len(NAMES)} vegetables; 1973–2024')
