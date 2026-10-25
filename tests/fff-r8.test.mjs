// Teste r8 (14 oct. 2026): protecție date personale înainte de „Check here” (FFF.pii), căutare în catalog (FFF.search), export profil.
// Rulare: node tests/fff-r8.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.join(HERE, '..', 'index.html');
const AXE = process.env.FFF_AXE || '/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(w = 1280, h = 800, noKit = false, lang = 'en-US') {
  const ctx = await b.newContext({viewport: {width: w, height: h}, acceptDownloads: true, locale: lang});
  const net = [];
  await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  await ctx.addInitScript(() => { window.__clip = null; try { Object.defineProperty(navigator, 'clipboard', {value: {writeText: (t) => { window.__clip = t; return Promise.resolve(); }}, configurable: true}); } catch (e) { /* */ } });
  if (noKit) await ctx.addInitScript(() => { Object.defineProperty(window, 'FFF', {get() { return undefined; }, set() {}, configurable: true}); });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) errs.push('csp: ' + t); });
  await page.goto(FILE);
  await page.waitForTimeout(500);
  return {ctx, page, errs, net};
}
const names = (page) => page.$$eval('#grid .card h3', (e) => e.map((x) => x.textContent));
const TEXT_PII = 'Contact the author at john.doe@example.org or call +40 722 123 456 for the dataset. IBAN RO49AAAA1B31007593840000.';
const TEXT_OK = 'The quick brown fox jumps over the lazy dog. A perfectly ordinary sentence for a detector.';

{
  const {ctx, page, errs, net} = await open();
  check('versiune 1.3.9 în meta și #app-version', await page.evaluate(() => document.querySelector('meta[name=application-version]').content === '1.3.9' && /v 1\.3\.9 · 2026-10-26/.test(document.getElementById('app-version').textContent)));
  check('kitul e prezent (pii, search)', await page.evaluate(() => !!(window.FFF && FFF.pii && FFF.search)));

  // --- protecție date personale ---
  await page.fill('#text', TEXT_PII);
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForSelector('dialog.fff-pii[open]', {timeout: 3000});
  check('apare dialogul „Personal data detected” (3 elemente)', (await page.$$('dialog.fff-pii li')).length >= 3, await page.$$eval('dialog.fff-pii li', (e) => e.map((x) => x.textContent)));
  await page.evaluate(fs.readFileSync(AXE, 'utf8') + '\n;0');
  const ax = await page.evaluate(async () => (await window.axe.run(document.querySelector('dialog.fff-pii'), {resultTypes: ['violations']})).violations.map((v) => v.id + ':' + v.nodes.length));
  check('axe 0 violări în dialogul PII', ax.length === 0, ax);
  check('nimic copiat cât dialogul e deschis', (await page.evaluate(() => window.__clip)) === null);
  await page.click('dialog.fff-pii button[data-primary]');
  await page.waitForTimeout(400);
  const clip = await page.evaluate(() => window.__clip);
  check('textul copiat e mascat (fără e-mail/telefon/IBAN)', clip && !/john\.doe|722 123|RO49AAAA/.test(clip) && /\[EMAIL\]/.test(clip) && /\[PHONE\]/.test(clip) && /\[IBAN\]/.test(clip), clip);
  check('textul din casetă rămâne neschimbat', (await page.inputValue('#text')) === TEXT_PII);
  check('bannerul de lansare e afișat', await page.evaluate(() => document.getElementById('launchBanner').classList.contains('show')));

  // continuă fără mascare
  await page.evaluate(() => { window.__clip = null; });
  await page.click('#grid button[data-url] >> nth=1');
  await page.waitForSelector('dialog.fff-pii[open]');
  await page.click('dialog.fff-pii button:not([data-primary]) >> nth=0');
  await page.waitForTimeout(400);
  check('„Continuă fără mascare” copiază textul original', (await page.evaluate(() => window.__clip)) === TEXT_PII);

  // anulare
  await page.evaluate(() => { window.__clip = null; });
  await page.click('#grid button[data-url] >> nth=2');
  await page.waitForSelector('dialog.fff-pii[open]');
  await page.click('dialog.fff-pii button:not([data-primary]) >> nth=1');
  await page.waitForTimeout(400);
  check('„Cancel” nu copiază nimic', (await page.evaluate(() => window.__clip)) === null && /Nothing was copied/.test(await page.textContent('#toast')), await page.textContent('#toast'));
  // Escape = anulare
  await page.click('#grid button[data-url] >> nth=2');
  await page.waitForSelector('dialog.fff-pii[open]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape închide dialogul PII fără copiere', (await page.$('dialog.fff-pii')) === null && (await page.evaluate(() => window.__clip)) === null);

  // text curat: fără dialog
  await page.fill('#text', TEXT_OK);
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForTimeout(500);
  check('text fără date personale: fără dialog, copiat direct', (await page.$('dialog.fff-pii')) === null && (await page.evaluate(() => window.__clip)) === TEXT_OK);
  await page.fill('#text', '');
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForTimeout(300);
  check('text gol: mesajul vechi (toast)', /./.test(await page.textContent('#toast')) && (await page.$('dialog.fff-pii')) === null);

  // --- căutare în catalog ---
  const total = (await names(page)).length;
  check('fără interogare: 42 de instrumente', total === 42, total);
  await page.fill('#tq', 'plagarism');
  await sleep(300);
  let n = await names(page);
  check('greșeală de scriere „plagarism” găsește instrumente de plagiat (fuzzy)', n.length >= 3 && n.length < 42, n.length);
  check('contorul arată „by relevance”', /by relevance/.test(await page.textContent('#tcount')), await page.textContent('#tcount'));
  await page.fill('#tq', 'gptzero');
  await sleep(300);
  n = await names(page);
  check('potrivirea literală veche se păstrează (GPTZero primul)', n[0] === 'GPTZero', n.slice(0, 3));
  await page.fill('#tq', 'copiere');
  await sleep(300);
  n = await names(page);
  check('sinonim „copiere” → instrumente de plagiat (după sens)', n.length >= 3 && n.length < 42, n.length);
  await page.fill('#tq', 'zzzzqqqq');
  await sleep(300);
  check('fără potriviri: mesaj gol', (await names(page)).length === 0 && (await page.$('#grid .empty')) !== null);
  await page.keyboard.press('Escape');
  await page.fill('#tq', '');
  await sleep(300);
  check('golind căutarea revin 42', (await names(page)).length === 42);

  // --- export profil ---
  await page.fill('#text', 'One two three. Four five six seven. Eight nine ten eleven twelve.');
  await page.click('#profPanel summary');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#profExport')]);
  const md = fs.readFileSync(await dl.path(), 'utf8');
  check('profil exportat .md cu cuvinte/propoziții', dl.suggestedFilename() === 'freedetect-profile.md' && /Words|words/i.test(md) && /: 12\b/.test(md) && /# /.test(md), md.slice(0, 300));
  check('0 erori / 0 CSP / 0 rețea', errs.length === 0 && net.length === 0, {errs, net});
  await ctx.close();
}
{
  // română: dialog tradus + export în română
  const {ctx, page} = await open(1280, 800, false, 'ro-RO');
  await page.fill('#text', TEXT_PII);
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForSelector('dialog.fff-pii[open]');
  check('dialogul PII apare în română', /Date personale detectate/.test(await page.textContent('dialog.fff-pii h2')), await page.textContent('dialog.fff-pii h2'));
  await page.click('dialog.fff-pii button[data-primary]');
  await page.waitForTimeout(300);
  check('toast în română după mascare', /mascate/.test(await page.textContent('#toast')), await page.textContent('#toast'));
  await ctx.close();
}
{
  // 360 px
  const {ctx, page} = await open(360, 740);
  await page.fill('#text', TEXT_PII);
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForSelector('dialog.fff-pii[open]');
  const o = await page.evaluate(() => ({doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: document.querySelector('dialog.fff-pii').getBoundingClientRect().width}));
  check('fără depășire orizontală la 360 px cu dialogul deschis', o.doc <= 1 && o.dlg <= 360, o);
  await ctx.close();
}
{
  // fără kit: comportament vechi
  const {ctx, page, errs} = await open(1280, 800, true);
  await page.fill('#text', TEXT_PII);
  await page.click('#grid button[data-url] >> nth=0');
  await page.waitForTimeout(400);
  check('fără kit: textul se copiază direct, fără dialog', (await page.evaluate(() => window.__clip)) === TEXT_PII);
  await page.fill('#tq', 'gptzero'); await sleep(300);
  check('fără kit: căutarea literală merge, 0 erori', (await names(page))[0] === 'GPTZero' && errs.length === 0, errs);
  await ctx.close();
}
await b.close();
console.log(`FreeDetect fff-r8: ${ok} ok, ${bad} eșuate`);
process.exit(bad ? 1 : 0);
