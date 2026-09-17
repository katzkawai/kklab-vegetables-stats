import React from 'react';
import { EvidenceChart, DataComponent, Section, SectionHeader, SortableRegion, SortableItem, SegmentedControl, Icon, barChartSpec, useDataApp, useDashboardTabs } from '../../data-app-public.jsx';
import { DEFAULT_CROPS, COLORS, scopeRows, buildView, csvFor } from './vegetables.js';
import './vegetables.css';

const TABS = [{ id:'harvest', label:'全国の収穫量', filterIds:['vegetable'], focusFields:['start','end','mode'] }];
const years = Array.from({length:52},(_,i)=>1973+i);
const number = n => n == null ? '—' : new Intl.NumberFormat('ja-JP',{maximumFractionDigits:0}).format(n);
const signed = n => n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

function ToolbarGuide() {
  return <details className="veg-toolbar-guide" open>
    <summary>右上のアイコン・ボタンの使い方</summary>
    <dl className="veg-toolbar-guide-items">
      <div>
        <dt><Icon name="more" size={18} /><span>…（More／その他）</span></dt>
        <dd>配色の変更、ページの複製、PDFなどへの書き出しを選びます。複製・書き出しはChatGPTに依頼します。</dd>
      </div>
      <div>
        <dt><Icon name="edit" size={18} /><span>鉛筆（編集）</span></dt>
        <dd>見出しや図表の配置を編集します。Saveで保存、Cancelで編集前の状態に戻します。</dd>
      </div>
      <div>
        <dt><Icon name="chatBubble" size={18} /><span>Ask ChatGPT（質問）</span></dt>
        <dd>表示中のグラフや選択条件についてChatGPTに質問します。日本語で回答するよう指定しています。</dd>
      </div>
      <div>
        <dt><span className="veg-toolbar-guide-publish">Publish</span><span>公開</span></dt>
        <dd>共有範囲を指定し、ChatGPTに公開作業を依頼します。このGitHub Pagesの更新は管理者が行います。</dd>
      </div>
    </dl>
    <div className="veg-toolbar-guide-notes">
      <p>画面が狭いときは、一部の操作が「…（More）」にまとまります。ChatGPTへの依頼は、開いた画面で内容を確認して送信します。</p>
      <p>PDF・Google Slidesなどの変換で、このサイトのURLが対象外と表示された場合は、<a href="https://github.com/katzkawai/kklab-vegetables-stats/archive/refs/heads/main.zip">元プロジェクト（ZIP）</a>をダウンロードし、ChatGPTに渡してください。公開用HTMLと元データを同梱しています。<a href="https://github.com/katzkawai/kklab-vegetables-stats" target="_blank" rel="noreferrer">ソースコードを見る ↗</a></p>
    </div>
  </details>;
}

export function DashboardContent() {
  const shell = useDataApp();
  useDashboardTabs(TABS);
  const { queries, snapshot, filters, setFilter, viewFocus, setDashboardFocus } = shell;
  const all = queries.harvest.rows;
  const names = snapshot.metadata.vegetables;
  const selected = Array.isArray(filters.vegetable) ? filters.vegetable : DEFAULT_CROPS;
  const active = selected.length ? names.filter(n=>selected.includes(n)) : names;
  const startValue = Number(viewFocus?.start ?? 2000);
  const endValue = Number(viewFocus?.end ?? 2024);
  const start = years.includes(startValue) ? startValue : 2000;
  const end = years.includes(endValue) && endValue >= start ? endValue : 2024;
  const mode = viewFocus?.mode === 'index' ? 'index' : 'quantity';
  const focus = patch => setDashboardFocus({...viewFocus, start:String(start), end:String(end), mode, ...patch});
  const rows = scopeRows(all, selected, start, end);
  const {trend, comparison} = buildView(rows, active, start, end);
  const unavailable = comparison.filter(r=>r.first == null).map(r=>r.vegetable);
  const quantity = '収穫量（万t）';
  const measure = mode === 'index' ? '指数' : quantity;
  const changes = comparison.filter(r=>r['増減率（%）'] != null).sort((a,b)=>b['増減率（%）']-a['増減率（%）']);
  const latest = [...comparison].sort((a,b)=>(b.last??-1)-(a.last??-1));
  const scope = [{field:'year',label:'期間',value:`${start}〜${end}年産`}];
  function toggle(name) {
    const current = [...active];
    if (current.includes(name)) {
      if (current.length === 1) return;
      setFilter('vegetable',current.filter(n=>n!==name));
    } else setFilter('vegetable',[...current,name]);
  }
  function download() {
    const url=URL.createObjectURL(new Blob([csvFor(rows)],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a'); a.href=url; a.download=`vegetables-${start}-${end}.csv`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const chartStyle = { colors:COLORS, showXAxisLabel:false, showYAxisLabel:true, startAtZero:true, valueDecimals:1, stackable:false };
  return <article className="veg-page">
    <div className="veg-meta"><span>農林水産省「作物統計調査」</span><span>全国・年間計</span><span>1973–2024年</span></div>
    <ToolbarGuide />
    <div className="veg-controls" aria-label="表示条件">
      <div className="veg-period">
        <label>開始年<select aria-label="開始年" value={start} onChange={e=>focus({start:e.target.value,end:String(Math.max(Number(e.target.value),end))})}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select></label>
        <span aria-hidden="true">—</span>
        <label>終了年<select aria-label="終了年" value={end} onChange={e=>focus({end:e.target.value,start:String(Math.min(Number(e.target.value),start))})}>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select></label>
        <button type="button" className="veg-text-button" onClick={()=>focus({start:'1973',end:'2024'})}>全期間</button>
        <button type="button" className="veg-text-button" onClick={()=>{setFilter('vegetable',DEFAULT_CROPS);focus({start:'2000',end:'2024',mode:'quantity'});}}>初期表示</button>
      </div>
      <button className="veg-download" onClick={download}>表示中のデータをCSV保存 ↓</button>
    </div>
    <fieldset className="veg-crops"><legend>比較する野菜 <span>{active.length} / 15品目</span></legend>
      <div className="veg-preset"><button onClick={()=>setFilter('vegetable',[])}>全15品目</button><button onClick={()=>setFilter('vegetable',DEFAULT_CROPS)}>代表6品目</button></div>
      <div className="veg-chips">{names.map(name=><label key={name} className={active.includes(name)?'veg-chip is-selected':'veg-chip'} style={{'--crop-color':COLORS[name]}}>
        <input type="checkbox" checked={active.includes(name)} onChange={()=>toggle(name)} disabled={active.length===1 && active.includes(name)}/><span className="veg-dot" aria-hidden="true"/>{name === 'ばれいしょ' ? 'ばれいしょ（じゃがいも）' : name}
      </label>)}</div>
    </fieldset>
    <SortableRegion id="vegetables:charts" label="収穫量の図表" variant="canvas" columns={12} spacing="standard" authoredRevision={1}
      rows={[{id:'vegetables:trend',items:['harvest-trend'],spacing:'content',header:<SectionHeader id="veg-trend-heading" title="収穫量の推移" filters={<SegmentedControl value={mode} onChange={value=>focus({mode:value})} options={[{value:'quantity',label:'収穫量（万t）'},{value:'index',label:'指数（開始年＝100）'}]}/>} />}, {id:'vegetables:comparisons',items:['harvest-level','harvest-change'],spacing:'section'}]}>
      <SortableItem id="harvest-trend" label="収穫量の推移" kind="chart" span={12}>
        <EvidenceChart id="harvest-trend" queryId="harvest" variant="card" title={`${start}〜${end}年 / ${mode==='index'?'指数':'収穫量'}`} rows={trend} sourceRows={rows} scopeFilters={scope} height={400}
          spec={{...chartStyle,type:'line',x:'年産',y:measure,series:'vegetable',yLabel:mode==='index'?`${start}年＝100`:'万t'}}
          description="各年産の全国・年間収穫量。欠測値は補完しません。指数は開始年の各品目の収穫量を100とします。線は年次データの傾向を示します。">
          <p className="veg-chart-note">{mode==='index'?`指数 ＝ 各年の収穫量 ÷ ${start}年の収穫量 × 100。100を上回ると開始年より増加。`:'1万t ＝ 10,000t。折れ線上にカーソルを合わせると年ごとの値を確認できます。'}</p>
          {unavailable.length>0 && <p className="veg-missing" role="status">{unavailable.join('、')}：{start}年は未掲載のため、指数・期間増減率は算出しません。ブロッコリーの単独集計は1989年からです。</p>}
        </EvidenceChart>
      </SortableItem>
      <SortableItem id="harvest-level" label="終了年の収穫量" kind="chart" span={6}>
        <EvidenceChart id="harvest-level" queryId="harvest" variant="card" title={`${end}年の収穫量（万t）`} rows={latest} sourceRows={rows.filter(r=>r.year===end)} scopeFilters={[{field:'year',label:'年産',value:String(end)}]}
          height={Math.max(260,active.length*33)} spec={barChartSpec({presentation:'plot',orientation:'horizontal',category:'vegetable',value:quantity,categoryWidth:108,domain:[0,'auto'],style:{colorField:'color',radius:4},format:{maximumFractionDigits:2}})} />
      </SortableItem>
      <SortableItem id="harvest-change" label="開始年からの増減率" kind="chart" span={6}>
        <EvidenceChart id="harvest-change" queryId="harvest" variant="card" title={`${start}→${end}年の増減率（%）`} rows={changes}
          sourceRows={rows.filter(r=>r.year===start || r.year===end)} scopeFilters={scope} height={Math.max(260,active.length*33)}
          spec={barChartSpec({presentation:'plot',orientation:'horizontal',category:'vegetable',value:'増減率（%）',categoryWidth:108,style:{color:'#557d83',radius:4},markers:[{value:0,color:'#767676'}],format:{maximumFractionDigits:1}})}
          description="（終了年の収穫量 ÷ 開始年の収穫量 − 1）×100。基準年が未掲載の品目は除外します。増減の理由を示すものではありません。">
          {unavailable.length>0 && <p className="veg-chart-note">比較不可：{unavailable.join('、')}（開始年の値なし）</p>}
        </EvidenceChart>
      </SortableItem>
    </SortableRegion>
    <Section id="veg-detail-heading" title="数値で確認">
      <DataComponent id="harvest-table" queryId="harvest" kind="table" title="選択品目の期間比較" sourceRows={rows.filter(r=>r.year===start||r.year===end)} displayRows={comparison} scopeFilters={scope}>
        <div className="veg-table-scroll" tabIndex={0} role="region" aria-label="収穫量の比較表（横スクロール可能）"><table className="veg-table" data-reviewed-rows="true"><thead><tr><th>品目</th><th>{start}年（t）</th><th>{end}年（t）</th><th>増減率</th></tr></thead><tbody>{comparison.map(r=><tr key={r.vegetable}><th scope="row"><span className="veg-dot" style={{background:COLORS[r.vegetable]}}/>{r.vegetable}</th><td>{number(r.first)}</td><td>{number(r.last)}</td><td>{signed(r['増減率（%）'])}</td></tr>)}</tbody></table></div>
      </DataComponent>
    </Section>
    <footer className="veg-sources">
      <h2>データと出典</h2>
      <p>農林水産省「作物統計調査／野菜生産出荷統計」の長期累年表を加工して作成。全国の品目別年間計を使い、季節別の値は重ねて加算していません。</p>
      <p>対象は2026年9月時点の指定野菜に対応する15品目。ブロッコリーは1989年にカリフラワーから分離され、それ以前は未掲載です。主産県調査年の全国値には農林水産省による推計を含みます。</p>
      <p>収穫量は、生食・加工向けに流通できる基準に達する収穫物の重量です。出荷量や消費量とは異なります。2025年産は一部品目のみ公表されているため、共通して比較できる2024年産までを収録しています。</p>
      <div className="veg-source-links"><a href="https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/sakkyou_yasai/" target="_blank" rel="noreferrer">農林水産省・作況調査（野菜） ↗</a><a href="https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001486220&page=1" target="_blank" rel="noreferrer">e-Stat・長期累年表 ↗</a><a href="https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/sakkyou_yasai/gaiyou/" target="_blank" rel="noreferrer">調査の概要・定義 ↗</a><a href="https://github.com/katzkawai/kklab-vegetables-stats" target="_blank" rel="noreferrer">ソースコード・元データ ↗</a></div>
      <p className="veg-date">原表更新：2026年7月3日 ／ データ取得：2026年9月17日　　本ページは農林水産省の公式サイトではありません。</p>
      <p className="veg-date">このサイトは GPT 6 Astra で作成されました。</p>
    </footer>
  </article>;
}
