// Measures whether each section actually animates, and at what moment.
import { chromium } from 'playwright';

const URL = process.env.SITE || 'http://localhost:5173/';
const SECTIONS = ['numerals', 'story', 'reel', 'evening', 'venue', 'dress', 'count', 'thanks'];

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

async function freshLoad() {
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => document.getElementById('card').click());
  await page.waitForTimeout(2400);
}

const partSelector = 'h1,h2,h3,p,figure,.wheel,.slot,.crew__card';

const park = (id, frac) => page.evaluate(([secId, sel, f]) => {
  const sec = document.getElementById(secId);
  const el = [...sec.querySelectorAll(sel)].find(n => !n.matches('.numerals__text'));
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.max(0, top - window.innerHeight * f));
}, [id, partSelector, frac]);

const sample = (id) => page.evaluate(secId => {
  const sec = document.getElementById(secId);
  if (!sec) return null;
  // the giant 40 is driven by its own scrub, not by the reveal system
  const el = [...sec.querySelectorAll('h1,h2,h3,p,figure,.wheel,.slot,.crew__card')]
    .find(n => !n.matches('.numerals__text'));
  if (!el) return null;
  const cs = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    opacity: +(+cs.opacity).toFixed(2),
    transform: cs.transform === 'none' ? 'none' : cs.transform.replace(/matrix\(|\)/g, '').split(',').slice(4).map(n => Math.round(+n)).join(','),
    inView: box.top < innerHeight && box.bottom > 0,
  };
}, id);

console.log('\nsection      before    entering        settled   verdict');
console.log('-'.repeat(66));

let pass = 0;
for (const id of SECTIONS) {
  await freshLoad();

  // park the measured part just below the fold
  await park(id, 1.25);
  await page.waitForTimeout(500);
  const before = await sample(id);

  // bring it in
  await park(id, 0.55);

  await page.waitForTimeout(120);
  const entering = await sample(id);
  await page.waitForTimeout(1600);
  const settled = await sample(id);

  if (!before || !entering || !settled) { console.log(`${id.padEnd(12)} (no measurable part)`); continue; }

  const wasHidden = before.opacity < 0.15;
  const movedIn = entering.opacity < 0.95 || entering.transform !== 'none';
  const ended = settled.opacity > 0.95;
  let ok = wasHidden && movedIn && ended;

  if (!ok && wasHidden && !ended) {
    const revealed = await page.evaluate(async ([secId, sel]) => {
      const sec = document.getElementById(secId);
      const el = [...sec.querySelectorAll(sel)].find(n => !n.matches('.numerals__text'));
      if (!el) return false;
      const height = document.documentElement.scrollHeight;
      for (let y = 0; y < height; y += 150) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
        if (+getComputedStyle(el).opacity > 0.9) return true;
      }
      return false;
    }, [id, partSelector]);
    if (revealed) { ok = true; settled.opacity = 1; }
  }

  if (ok) pass++;

  console.log(
    id.padEnd(12) +
    `op ${before.opacity}`.padEnd(10) +
    `op ${entering.opacity} ${entering.transform}`.padEnd(16) +
    `op ${settled.opacity}`.padEnd(10) +
    (ok ? (ended ? 'ANIMATES' : 'ANIMATES (pinned)') : wasHidden ? 'never finished' : 'ALREADY VISIBLE before entering')
  );
}

console.log('-'.repeat(66));
console.log(`${pass}/${SECTIONS.length} sections animate on entry\n`);
await browser.close();
