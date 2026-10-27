// Teste 2.1.0: avertizarea despre detectoarele AI (8 limbi) și verificarea online (la cerere) a DOI-urilor din referințe. Rețeaua e simulată.
// Rulare: node tests/doi-ai.test.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1200, height: 900}, locale: 'en-US', acceptDownloads: true});
const net = []; const hosts = new Set();
const cors = {'access-control-allow-origin': '*'};
const cr = (title, year) => ({status: 'ok', message: {title: [title], issued: {'date-parts': [[year]]}}});
await ctx.route(/^https?:/, (r) => {
  const u = r.request().url(); net.push(u); hosts.add(new URL(u).host);
  const json = (o, s = 200) => r.fulfill({status: s, contentType: 'application/json', headers: cors, body: JSON.stringify(o)});
  if (/api\.crossref\.org\/works\/10\.1000%2Fokpaper/.test(u)) return json(cr('Quantum widgets for modern engineering', 2019));
  if (/api\.crossref\.org\/works\/10\.1000%2Fotherpaper/.test(u)) return json(cr('Deep learning for protein folding dynamics', 2020));
  if (/api\.crossref\.org\/works\/10\.1000%2Fyearpaper/.test(u)) return json(cr('Quantum widgets for modern engineering again', 2015));
  if (/api\.crossref\.org\/works\/10\.1000%2Fnetfail/.test(u)) return json({err: 1}, 500);
  if (/api\.crossref\.org\/works\//.test(u)) return json({err: 'nf'}, 404);
  if (/doi\.org\/api\/handles\/10\.5281\/zenodo\.12345/.test(u)) return json({responseCode: 1, handle: '10.5281/zenodo.12345'});
  if (/doi\.org\/api\/handles\//.test(u)) return json({responseCode: 100}, 404);
  r.abort();
});
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(FILE); await page.waitForTimeout(500);

// --- avertizarea despre detectoarele AI
check('panou de avertizare vizibil, deschis', await page.evaluate(() => { const d = document.getElementById('aiWarn'); return !!d && d.open && d.offsetHeight > 40; }));
check('avertizarea en: „never accuse”', /never accuse/i.test(await page.textContent('#aiWarn summary')));
const L = ['ro', 'fr', 'de', 'es', 'pt', 'it', 'hu'];
for (const l of L) {
  await page.selectOption('#langSel', l); await page.waitForTimeout(150);
  const s = await page.textContent('#aiWarn summary');
  check(`avertizare tradusă: ${l}`, s.trim().length > 20 && !/never accuse/i.test(s), s);
}
await page.selectOption('#langSel', 'ro'); await page.waitForTimeout(150);
check('ro: sfat „În schimb” cu HTML randat', await page.$eval('#aiWarn [data-i18n-html="aiwP2"] strong', (e) => /În schimb/.test(e.textContent)));
await page.selectOption('#langSel', 'ja'); await page.waitForTimeout(150);
check('limbă fără traducere: revine la engleză', /never accuse/i.test(await page.textContent('#aiWarn summary')));
await page.selectOption('#langSel', 'en'); await page.waitForTimeout(150);

// --- verificarea DOI online
net.length = 0;
const BIB = [
 'Smith, J. (2019). Quantum widgets for modern engineering. Journal of Stuff, 12(3), 45-67. https://doi.org/10.1000/okpaper',
 'Doe, A. (2020). Totally unrelated cooking recipes for tomato soup. Press House. doi:10.1000/otherpaper',
 'Roe, B. (2018). Dataset of ocean temperatures near Spain. Zenodo. doi:10.5281/zenodo.12345',
 'Poe, C. (2017). A paper that does not exist at all anywhere. Journal, 1(1), 1-2. doi:10.1000/ghostpaper',
 'Lee, K. (2016). Something with network trouble in the lookup. Journal, 2(2), 3-4. doi:10.1000/netfail',
 'Kim, H. (2010). Quantum widgets for modern engineering again. Journal of Stuff, 3(1), 1-9. doi:10.1000/yearpaper',
 'Fara, D. (2012). Book without any DOI at all. Editura Test. ISBN 978-0-306-40615-7'
].join('\n\n');
await page.evaluate(() => { document.querySelector('#refPanel').open = true; });
await page.fill('#refIn', BIB); await page.click('#refRun'); await page.waitForTimeout(200);
check('butonul „Check DOIs online” apare doar cu DOI-uri', await page.isVisible('#refDoi'));
check('nicio cerere de rețea înainte de apăsare', net.length === 0, net);
const before = await page.evaluate(() => refState.res.map((r) => r.lvl));
await page.click('#refDoi');
await page.waitForFunction(() => refState.doiChecked === true, null, {timeout: 30000});
const R = await page.evaluate(() => refState.res.map((r) => ({lvl: r.lvl, keys: r.msgs.filter((m) => m.online).map((m) => m.k + ':' + m.lvl)})));
check('DOI valid, titlu potrivit: info „găsit”', R[0].keys.join() === 'mDoiOk:i', R[0]);
check('DOI valid, titlu diferit: avertisment', R[1].keys.includes('mDoiTitle:w') && R[1].lvl !== 'err', R[1]);
check('DOI din alt registru (doi.org): doar informare, fără acuzație', R[2].keys.join() === 'mDoiOther:i' && !R[2].keys.some((k) => /:e$/.test(k)), R[2]);
check('DOI inexistent peste tot: eroare', R[3].keys.join() === 'mDoiNone:e' && R[3].lvl === 'err', R[3]);
check('eroare de rețea: neconcludent (avertisment), nu eroare', R[4].keys.join() === 'mDoiNet:w' && R[4].lvl !== 'err', R[4]);
check('anul diferit: avertisment', R[5].keys.includes('mDoiYear:w'), R[5]);
check('intrare fără DOI neatinsă', R[6].keys.length === 0 && R[6].lvl === before[6], R[6]);
check('gazde: doar api.crossref.org și doi.org', [...hosts].every((h) => h === 'api.crossref.org' || h === 'doi.org'), [...hosts]);
check('se trimit doar DOI-urile (nu textul)', net.every((u) => !/Quantum|tomato|Zenodo/.test(decodeURIComponent(u).replace(/10\.\d+\/\S*/g, ''))));
check('fallback doi.org doar pentru DOI necunoscute în Crossref', net.filter((u) => /doi\.org\/api/.test(u)).length === 2, net.filter((u) => /doi\.org\/api/.test(u)));
check('mesajul „intrare 4” apare în listă', /does not exist/.test(await page.textContent('#refList')));
// idempotență
const n1 = await page.evaluate(() => refState.res.reduce((a, r) => a + r.msgs.length, 0));
await page.click('#refDoi'); await page.waitForFunction(() => !document.getElementById('refDoi').disabled, null, {timeout: 30000}); await page.waitForTimeout(200);
const n2 = await page.evaluate(() => refState.res.reduce((a, r) => a + r.msgs.length, 0));
check('a doua rulare nu dublează mesajele', n1 === n2, [n1, n2]);
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#refExp')]);
const md = (await import('node:fs')).readFileSync(await dl.path(), 'utf8');
check('raportul .md include rezultatele online și versiunea curentă', /does not exist/.test(md) && /FreeDetect Hub v2\.1\.0/.test(md), md.slice(-200));
// „Scan input text”: DOI din alt registru nu mai e numit „inventat”
await page.evaluate(() => { document.querySelector('#citePanel').open = true; });
await page.fill('#text', 'Vezi 10.5281/zenodo.12345 și 10.1000/ghostpaper în text.');
await page.click('#citeScan'); await page.waitForFunction(() => /📊/.test(document.getElementById('citeOut').textContent), null, {timeout: 30000});
const so = await page.textContent('#citeOut');
check('scan: DOI din alt registru → informare, nu „inventat”', /10\.5281\/zenodo\.12345 — registered, but not in Crossref/.test(so) && !/zenodo\.12345 — not in Crossref/.test(so), so);
check('scan: DOI inexistent rămâne semnalat', /10\.1000\/ghostpaper — not in Crossref/.test(so), so);
// limbi: cheile noi
const keys = await page.evaluate(() => { const ks = ['aiwH', 'aiwP', 'aiwL1', 'aiwL2', 'aiwL3', 'aiwP2', 'refDoi', 'refDoiTip', 'refDoiProg', 'refDoiDone', 'mDoiOk', 'mDoiOther', 'mDoiNone', 'mDoiNet', 'mDoiTitle', 'mDoiYear', 'mDoiSkip']; return ['en', 'ro', 'fr', 'de', 'es', 'pt', 'it', 'hu'].every((l) => ks.every((k) => I18N[l][k])); });
check('chei noi în cele 8 limbi', keys);
check('fără erori JS', errs.length === 0, errs);
await b.close(); console.log(`\nFreeDetect 2.1.0: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
