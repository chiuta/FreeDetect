// Teste 1.3.9: generatorul de citări tolerează răspunsuri Crossref/Open Library valide dar incomplete și nu injectează HTML.
// Rulare: node tests/cite-robust.test.mjs  (Playwright din /opt/node-tools, Chromium local; rețeaua e simulată prin route)
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ISBN = '9780306406157';
const cases = [
  ['date-parts [null]', '10.1000/abc', {message: {title: ['T'], issued: {'date-parts': [null]}}}, /\(n\.d\.\)\. T\./],
  ['date-parts []', '10.1000/abc', {message: {title: ['T'], issued: {'date-parts': []}}}, /\(n\.d\.\)\. T\./],
  ['autor null', '10.1000/abc', {message: {title: 'T', author: [null, {family: 'Doe', given: 'Jane'}]}}, /Doe, J\./],
  ['autori fără nume', '10.1000/abc', {message: {title: 'T', author: [{}, {sequence: 'first'}]}}, /\(n\.d\.\)\. T\./],
  ['titlu cu HTML (text, nu markup)', '10.1000/abc', {message: {title: ['<img src=x onerror=window.__x=1>']}}, /<img src=x/],
  ['ISBN publishers []', ISBN, {['ISBN:' + ISBN]: {title: 'T', publishers: []}}, /T\./],
  ['ISBN autor cu nume non-text', ISBN, {['ISBN:' + ISBN]: {title: 'T', authors: [{name: 5}]}}, /T\./],
];
for (const [name, q, body, re] of cases) {
  const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await ctx.route(/^https?:/, (r) => /crossref|openlibrary/.test(r.request().url())
    ? r.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify(body)}) : r.abort());
  await p.goto(FILE); await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.querySelector('#citeIn').closest('details'); if (d) d.open = true; });
  await p.fill('#citeIn', q);
  await p.evaluate(() => document.querySelector('#citeGo').click());
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({o: document.querySelector('#citeOut').textContent, x: window.__x, imgs: document.querySelectorAll('#citeOut img').length}));
  check(name + ': citare afișată', re.test(r.o), r.o.slice(0, 120));
  check(name + ': fără pageerror, fără HTML injectat', errs.length === 0 && r.x === undefined && r.imgs === 0, [errs, r.x, r.imgs]);
  await ctx.close();
}
await b.close();
console.log(`FreeDetect cite-robust: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
