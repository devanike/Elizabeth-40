// Real browser check. Drives the installed Edge, so nothing is downloaded.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.env.SITE || 'http://localhost:5173/';
const OUT = 'shots';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },   // small Android
  { name: '390', width: 390, height: 844 },   // iPhone
  { name: '411', width: 411, height: 891 },   // Galaxy S21 FE
  { name: '430', width: 430, height: 932 },   // large phone
  { name: '768', width: 768, height: 1024 },  // tablet
  { name: '1440', width: 1440, height: 900 }, // desktop
];

const only = process.argv[2];
const list = only ? VIEWPORTS.filter(v => v.name === only) : VIEWPORTS;

const SECTIONS = ['hero', 'numerals', 'story', 'reel', 'evening', 'venue', 'dress', 'count', 'thanks'];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
let failures = 0;

for (const vp of list) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.width < 700,
    hasTouch: vp.width < 700,
  });

  const errors = [];
  page.on('pageerror', e => errors.push('EXCEPTION: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().replace(URL, '')}`); });

  console.log(`\n${'='.repeat(58)}\n${vp.name}px  (${vp.width}x${vp.height})\n${'='.repeat(58)}`);

  await page.goto(URL, { waitUntil: 'load' });

  await page.evaluate(() => (document.getElementById('card')).click());
  await page.waitForTimeout(2800);

  // walk the page in viewport steps so every observer gets its chance
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(vp.height * 0.7)) {
    await page.evaluate(_y => window.scrollTo(0, _y), y);
    await page.waitForTimeout(320);
  }
  await page.waitForTimeout(900);

  // 1. anything still invisible after its section has been scrolled through
  const hidden = await page.evaluate(sections => {
    const out = [];
    for (const id of sections) {
      const sec = document.getElementById(id);
      if (!sec) { out.push({ id, part: '(section missing)', why: '-' }); continue; }
      sec.querySelectorAll('h1,h2,h3,p,figure,.btn,.wheel,.slot,.crew__card,li').forEach(el => {
        const cs = getComputedStyle(el);
        if (!el.getBoundingClientRect().width) return;
        if (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden') {
          out.push({ id, part: el.className || el.tagName, why: `opacity ${cs.opacity} ${cs.visibility}` });
        }
      });
    }
    return out;
  }, SECTIONS);

  // 2. horizontal overflow, with the widest offender named
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    if (over <= 0) return { over: 0, worst: null };
    let worst = null;
    document.querySelectorAll('*').forEach(el => {
      const b = el.getBoundingClientRect();
      const past = Math.round(b.right - de.clientWidth);
      if (b.width > 0 && past > 0 && (!worst || past > worst.past)) {
        worst = { past, tag: (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName) };
      }
    });
    return { over, worst };
  });

  // 3. images that are cropped hard or overflowing their frame
  const crops = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('figure img').forEach(img => {
      const box = img.getBoundingClientRect();
      if (!box.width || !img.naturalWidth) return;
      const boxRatio = box.width / box.height;
      const natRatio = img.naturalWidth / img.naturalHeight;
      const drift = Math.abs(boxRatio - natRatio) / natRatio;
      if (drift > 0.18) {
        const parent = img.closest('figure').parentElement;
        out.push({
          where: parent.id || parent.className || '?',
          box: `${Math.round(box.width)}x${Math.round(box.height)}`,
          crop: `${Math.round(drift * 100)}%`,
        });
      }
    });
    return out;
  });

  console.log(errors.length ? '\nERRORS:\n  ' + errors.slice(0, 8).join('\n  ') : '\nerrors: none');
  console.log(hidden.length ? `\nSTILL HIDDEN (${hidden.length}):\n  ` + hidden.slice(0, 12).map(h => `${h.id} > ${h.part}  [${h.why}]`).join('\n  ') : 'hidden: none');
  console.log(overflow.over ? `\nOVERFLOW: +${overflow.over}px, worst ${overflow.worst?.tag} +${overflow.worst?.past}` : 'overflow: none');
  console.log(crops.length ? `\nHARD CROPS (${crops.length}):\n  ` + crops.map(c => `${c.where}  box ${c.box}  cropping ${c.crop}`).join('\n  ') : 'crops: none');

  if (errors.length || hidden.length || overflow.over) failures++;

  // screenshots per section
  for (const id of SECTIONS) {
    const el = page.locator('#' + id);
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${vp.name}-${id}.png` }).catch(() => {});
    }
  }

  await page.close();
}

await browser.close();
console.log(`\n${'='.repeat(58)}\n${failures ? failures + ' viewport(s) with problems' : 'all viewports clean'}  ·  screenshots in ${OUT}/\n`);
