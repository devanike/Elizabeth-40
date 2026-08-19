// Builds the WhatsApp/iMessage link preview image and the favicons.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const ORIGIN = process.env.SITE || 'http://localhost:5173';

const b64 = async f => `data:font/woff2;base64,${(await readFile(f)).toString('base64')}`;
const SCRIPT_FONT = await b64('public/fonts/scr-great-vibes.woff2');
const BODY_FONT = await b64('public/fonts/par-jost.woff2');
const PHOTO = `data:image/jpeg;base64,${(await readFile('public/photos/img-8013-1440.jpg')).toString('base64')}`;

const browser = await chromium.launch({ channel: 'msedge' });

/* link preview card */
const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.setContent(`
  <style>
    @font-face { font-family: "Script"; src: url("${SCRIPT_FONT}") format("woff2"); }
    @font-face { font-family: "Body"; src: url("${BODY_FONT}") format("woff2"); font-weight: 300 700; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; display: flex; background: #F7F4EF; font-family: "Body", sans-serif; }
    .art { width: 46%; position: relative; overflow: hidden; }
    .art img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; }
    .copy {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      padding: 0 76px; gap: 18px;
    }
    .kicker { font-size: 19px; font-weight: 500; letter-spacing: .34em; text-transform: uppercase; color: #D2540A; }
    .name { font-family: "Script", cursive; font-size: 116px; line-height: 1.24; color: #16120D; white-space: nowrap; }
    .name i { font-style: normal; color: #D2540A; }
    .meta { font-size: 21px; font-weight: 400; letter-spacing: .22em; text-transform: uppercase; color: #6A6058; line-height: 1.9; }
  </style>
  <div class="art"><img src="${PHOTO}"></div>
  <div class="copy">
    <p class="kicker">You are invited</p>
    <p class="name">Elizabeth <i>&#64;</i> 40</p>
    <p class="meta">Friday 16 October 2026<br>London Events &middot; Las Vegas</p>
  </div>
`);
await card.evaluate(() => document.fonts.ready);
await card.waitForTimeout(400);
await card.screenshot({ path: 'public/_share-raw.png' });
await card.close();

let quality = 88;
let jpeg;
while (quality >= 60) {
  jpeg = await sharp('public/_share-raw.png').jpeg({ quality, mozjpeg: true }).toBuffer();
  if (jpeg.length < 280 * 1024) break;
  quality -= 6;
}
await unlink('public/_share-raw.png');

const hash = createHash('md5').update(jpeg).digest('hex').slice(0, 8);
const name = `share-card-${hash}.jpg`;

for (const f of await readdir('public')) {
  if (/^share-card(-[0-9a-f]{8})?\.jpg$/.test(f) && f !== name) await unlink(`public/${f}`);
}
await writeFile(`public/${name}`, jpeg);
console.log(`${name}   1200x630, ${(jpeg.length / 1024).toFixed(0)}KB at q${quality}`);

/* favicons */
const icon = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
await icon.setContent(`
  <style>
    @font-face { font-family: "Body"; src: url("${BODY_FONT}") format("woff2"); font-weight: 300 700; }
    * { margin: 0; }
    body {
      width: 512px; height: 512px; display: grid; place-items: center;
      background: #D2540A; font-family: "Body", sans-serif;
    }
    span { font-size: 300px; font-weight: 500; color: #F7F4EF; letter-spacing: -.04em; line-height: 1; }
  </style>
  <span>40</span>
`);
await icon.evaluate(() => document.fonts.ready);
await icon.waitForTimeout(300);
await icon.screenshot({ path: 'public/_icon.png' });
await icon.close();
await browser.close();

for (const [size, name] of [[180, 'apple-touch-icon.png'], [32, 'favicon-32.png'], [16, 'favicon-16.png']]) {
  await sharp('public/_icon.png').resize(size, size).png().toFile(`public/${name}`);
  console.log(`${name.padEnd(20)} ${size}x${size}`);
}
await unlink('public/_icon.png');
