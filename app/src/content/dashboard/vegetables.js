export const DEFAULT_CROPS = ['ばれいしょ', 'キャベツ', 'たまねぎ', 'だいこん', 'トマト', 'ブロッコリー'];
export const COLORS = Object.fromEntries([
  ['ばれいしょ','#96744a'], ['キャベツ','#21845a'], ['たまねぎ','#c17b18'],
  ['だいこん','#427ab6'], ['はくさい','#7b9941'], ['トマト','#ce5549'],
  ['レタス','#449c8d'], ['にんじん','#d47027'], ['きゅうり','#286a61'],
  ['ねぎ','#74893e'], ['なす','#8559a5'], ['ほうれんそう','#325f87'],
  ['ブロッコリー','#3c9b40'], ['ピーマン','#ae557b'], ['さといも','#826d67'],
]);
export function scopeRows(rows, crops, start, end) {
  return rows.filter(r => (!crops.length || crops.includes(r.vegetable)) && r.year >= start && r.year <= end);
}
export function buildView(rows, names, start, end) {
  const lookup = new Map(rows.map(r => [`${r.vegetable}:${r.year}`, r.harvest_t]));
  const trend = rows.map(r => {
    const baseline = lookup.get(`${r.vegetable}:${start}`);
    return { '年産':`${r.year}年`, vegetable:r.vegetable, '収穫量（万t）': r.harvest_t == null ? null : r.harvest_t/10000,
      '指数': r.harvest_t == null || baseline == null || baseline === 0 ? null : r.harvest_t/baseline*100 };
  });
  const comparison = names.map(vegetable => {
    const first = lookup.get(`${vegetable}:${start}`) ?? null;
    const last = lookup.get(`${vegetable}:${end}`) ?? null;
    return { vegetable, color:COLORS[vegetable], start, end, first, last, '収穫量（万t）': last == null ? null : last/10000,
      '増減率（%）': first == null || first === 0 || last == null ? null : (last/first-1)*100 };
  });
  return { trend, comparison };
}
export function csvFor(rows) {
  const quote = v => `"${String(v ?? '').replaceAll('"','""')}"`;
  return '\uFEFF年産,品目,収穫量（t）,分類,原表ファイル,原表セル,原表記号\r\n' +
    rows.map(r => [r.year,r.vegetable,r.harvest_t,r.group,r.source_file,r.source_cell,r.source_symbol].map(quote).join(',')).join('\r\n');
}
