// Teste 2.0.0: dosar de verificare a referințelor (ISBN, DOI, ani, structură APA/IEEE, duplicate) — complet local.
// Rulare: node tests/references.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
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
const net = [];
await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(FILE); await page.waitForTimeout(400);
await page.evaluate(() => { document.querySelector('#refPanel').open = true; window.__printed = 0; window.print = () => { window.__printed++; }; });

const BIB = [
 'Knuth, D. E. (1997). The Art of Computer Programming (3rd ed.). Addison-Wesley. ISBN 0-201-89683-4',            // 1 ok (ISBN-10 valid)
 'Smith, J. (2019). A study of things. Journal of Stuff, 12(3), 45-67. https://doi.org/10.1038/nature12373',        // 2 ok
 'Smith, J. (2019). A study of things. Journal of Stuff, 12(3), 45-67. doi:10.1038/NATURE12373',                    // 3 duplicat DOI cu 2
 'Doe, A. (3024). Future work in the far future. Time Press. ISBN 978-0-306-40615-8',                               // 4 an viitor
 'Roe, B. (2020). Bad checksum book. Press. ISBN 978-0-306-40615-9',                                               // 5 ISBN invalid
 'Poe, C. (2018). Bad doi. Journal, 1(1), 1-2. doi: 10.12/abc',                                                     // 6 DOI malformat
 'random scribble',                                                                                                  // 7 prea scurt
 'Lee, K. (2015) Something without a proper structure but long enough to be an entry Press',                        // 8 structură
 'Knuth, D. E. (1997). The Art of Computer Programming (Third Edition). Addison-Wesley. ISBN: 0201896834',          // 9 duplicat ISBN cu 1
].join('\n\n');
await page.fill('#refIn', BIB);
await page.click('#refRun');
const sum = await page.textContent('#refSum');
check('rezumat cu 9 intrări', /^9 entries/.test(sum), sum);
const items = await page.$$eval('#refList > li', (els) => els.map((e) => ({cls: e.className, txt: e.textContent})));
check('9 intrări afișate', items.length === 9, items.length);
check('intrarea 1 (ISBN-10 valid) fără erori', /\bok\b/.test(items[0].cls), items[0]);
check('intrarea 2 OK', /\bok\b/.test(items[1].cls), items[1]);
check('intrarea 3: același DOI ca intrarea 2 (insensibil la majuscule)', /err/.test(items[2].cls) && /Same DOI as entry 2/.test(items[2].txt), items[2]);
check('intrarea 4: an în viitor', /err/.test(items[3].cls) && /Year 3024 is in the future/.test(items[3].txt), items[3]);
check('intrarea 5: cifră de control ISBN invalidă', /err/.test(items[4].cls) && /invalid check digit/.test(items[4].txt), items[4]);
check('intrarea 6: DOI malformat', /err/.test(items[5].cls) && /does not follow the 10\.NNNN/.test(items[5].txt), items[5]);
check('intrarea 7: prea scurtă și fără an', /Entry too short/.test(items[6].txt) && /No publication year/.test(items[6].txt), items[6]);
check('intrarea 8: structură nerecunoscută', /Structure not recognized/.test(items[7].txt), items[7]);
check('intrarea 9: același ISBN (10 vs. 13 cifre fără cratime) ca intrarea 1 — duplicat', /err/.test(items[8].cls) && /(Same ISBN as entry 1|Duplicate of entry 1|Probable duplicate of entry 1)/.test(items[8].txt), items[8]);
check('antetul arată structura detectată (APA-like pentru 1)', /APA-like/.test(items[0].txt), items[0].txt.slice(0, 120));

// IEEE numerotat + cap de rând multi-linie
await page.fill('#refIn', '[1] A. Author and B. Writer, “Deep things,” IEEE Trans. Stuff, vol. 3, no. 2, pp. 10–20, 2021.\n[2] C. Person,\n“Wrapped title,” Proc. Conf., pp. 1–5, 2099.\n[3] D. Real, "Another," J. X, vol. 1, 2022.');
await page.click('#refRun');
const it2 = await page.$$eval('#refList > li', (els) => els.map((e) => ({cls: e.className, txt: e.textContent})));
check('IEEE numerotat: 3 intrări (rândurile continuate se unesc)', it2.length === 3, it2.length);
check('IEEE detectat', /IEEE-like/.test(it2[0].txt) && /\bok\b/.test(it2[0].cls), it2[0]);
check('an 2099 în IEEE e semnalat', /err/.test(it2[1].cls) && /2099/.test(it2[1].txt), it2[1]);

// duplicat aproape (același titlu/autori, punctuație diferită)
await page.fill('#refIn', 'Alpha, B. (2010). Studying the natural history of quantum widgets in laboratories. Science Press.\nAlpha, B. (2010) Studying the natural history of quantum widgets in laboratories, Science Press');
await page.click('#refRun');
const it3 = await page.$$eval('#refList > li', (els) => els.map((e) => e.textContent));
check('duplicat exact/aproape detectat', it3.length === 2 && /(Duplicate|Probable duplicate) of entry 1/.test(it3[1]), it3);

// HTML nu se injectează
await page.fill('#refIn', 'Evil, E. (2020). <img src=x onerror=window.__x=1> a title that is long enough. Press.');
await page.click('#refRun');
check('fără HTML injectat din intrări', (await page.$$('#refList img')).length === 0 && !(await page.evaluate(() => window.__x)));

// text gol
await page.fill('#refIn', '');
await page.click('#refRun');
check('intrare goală: fără listă', (await page.$$('#refList')).length === 0);

// din textul principal
await page.fill('#text', 'Knuth, D. E. (1997). The Art of Computer Programming. Addison-Wesley. ISBN 0-201-89683-4');
await page.click('#refFromText');
check('„Folosește textul de sus” rulează verificarea', (await page.$$('#refList > li')).length === 1 && (await page.inputValue('#refIn')).startsWith('Knuth'));

// export + tipărire
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#refExp')]);
const md = await (await import('node:fs')).promises.readFile(await dl.path(), 'utf8');
check('export .md cu titlu și intrări', dl.suggestedFilename() === 'freedetect-references.md' && /^# Reference verification report/.test(md) && /Knuth/.test(md), md.slice(0, 80));
await page.click('#refPrint');
check('tipărire: se apelează window.print și foaia de tipărit are conținut', (await page.evaluate(() => window.__printed)) === 1 && /Knuth/.test(await page.textContent('#refPrintSheet')));
await page.emulateMedia({media: 'print'});
const vis = await page.evaluate(() => ({sheet: getComputedStyle(document.querySelector('#refPrintSheet')).display, wrap: getComputedStyle(document.querySelector('.wrap')).display}));
check('în modul print doar foaia raportului e vizibilă', vis.sheet === 'block' && vis.wrap === 'none', vis);
await page.emulateMedia({media: 'screen'});

// limbă: RO
await page.evaluate(() => { document.querySelector('#langSel').value = 'ro'; document.querySelector('#langSel').dispatchEvent(new Event('change')); });
await page.waitForTimeout(300);
check('RO: rezumat tradus', /intrări/.test(await page.textContent('#refSum')), await page.textContent('#refSum'));
check('RO: butonul „Verifică referințele”', /Verifică referințele/.test(await page.textContent('#refRun')));

check('nicio cerere de rețea', net.length === 0, net);
check('niciun pageerror', errs.length === 0, errs);
await b.close();
console.log(`FreeDetect references: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
