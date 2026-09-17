import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {scopeRows,buildView,csvFor} from '../app/src/content/dashboard/vegetables.js';
const data=JSON.parse(fs.readFileSync(new URL('../app/src/data.json',import.meta.url)));
const rows=data.queries.harvest.rows;
const names=data.metadata.vegetables;
test('all selection includes all 15 crops and uses exact endpoints',()=>{
 const scope=scopeRows(rows,[],2000,2024); assert.equal(scope.length,375);
 const view=buildView(scope,names,2000,2024);
 const broccoli=view.comparison.find(r=>r.vegetable==='ブロッコリー');
 assert.equal(broccoli.first,82900);assert.equal(broccoli.last,160500);
 assert.ok(Math.abs(broccoli['増減率（%）']-93.60675512665863)<1e-9);
 assert.equal(view.trend.filter(r=>r['年産']==='2000年').every(r=>r['指数']===100),true);
});
test('missing baseline stays missing; no implicit rebase or zero-fill',()=>{
 const scope=scopeRows(rows,['ブロッコリー'],1973,2024);
 const view=buildView(scope,['ブロッコリー'],1973,2024);
 assert.equal(view.trend.filter(r=>r['収穫量（万t）']===null).length,16);
 assert.equal(view.trend.every(r=>r['指数']===null),true);
 assert.equal(view.comparison[0]['増減率（%）'],null);
 assert.equal(view.comparison[0].last,160500);
});
test('one-year and filtered export retain the same population',()=>{
 const scope=scopeRows(rows,['だいこん'],2024,2024);
 assert.equal(scope.length,1);
 const view=buildView(scope,['だいこん'],2024,2024);
 assert.equal(view.comparison[0]['増減率（%）'],0);
 assert.equal(view.trend[0]['収穫量（万t）'],108.2);
 assert.match(csvFor(scope),/"1082000"/);
 assert.equal(csvFor(scope).split('\r\n').length,2);
});
