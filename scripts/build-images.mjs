// Turns the raw camera dump in images/ into web-ready assets.
import sharp from 'sharp';
import { readdir, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'images';
const SRC_CONVERTED = 'images/converted';   // HEIC files decoded by fix-heic.mjs
const OUT = 'public/photos';
const WIDTHS = [480, 960, 1440];
const SKIP = /INVITE/i;                 // the printed flyer is handled separately

sharp.cache(false);
sharp.concurrency(2);           

const slug = f => path.parse(f).name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const exists = p => access(p).then(() => true, () => false);

async function process(file, dir) {
  const id = slug(file);
  const src = path.join(dir, file);
  const base = sharp(src, { failOn: 'none' }).rotate();  
  const meta = await base.metadata();
  const out = { id, src: file, w: meta.width, h: meta.height, sizes: [] };

  for (const w of WIDTHS) {
    if (meta.width < w && w !== WIDTHS[0]) continue;    
    const pipe = () => sharp(src, { failOn: 'none' }).rotate()
      .resize({ width: w, withoutEnlargement: true });
    if (await exists(`${OUT}/${id}-${w}.avif`)) { out.sizes.push(w); continue; }
    await pipe().avif({ quality: 55, effort: 3 }).toFile(`${OUT}/${id}-${w}.avif`);
    await pipe().webp({ quality: 72 }).toFile(`${OUT}/${id}-${w}.webp`);
    await pipe().jpeg({ quality: 76, mozjpeg: true }).toFile(`${OUT}/${id}-${w}.jpg`);
    out.sizes.push(w);
  }

  // tiny blurred placeholder, inlined as a data URI so nothing ever pops in
  const lqip = await sharp(src, { failOn: 'none' }).rotate()
    .resize({ width: 20 }).blur(1).webp({ quality: 30 }).toBuffer();
  out.lqip = `data:image/webp;base64,${lqip.toString('base64')}`;
  return out;
}

const usable = f => /\.(jpe?g|png)$/i.test(f) && !SKIP.test(f);
const files = [
  ...(await readdir(SRC)).filter(usable).map(f => [f, SRC]),
  ...(await readdir(SRC_CONVERTED).catch(() => [])).filter(usable).map(f => [f, SRC_CONVERTED]),
];
await mkdir(OUT, { recursive: true });

const manifest = [], failed = [];
for (const [i, [f, dir]] of files.entries()) {
  try {
    manifest.push(await process(f, dir));
    console.log(`[${i + 1}/${files.length}] ok   ${f}`);
  } catch (e) {
    failed.push({ file: f, error: e.message });
    console.log(`[${i + 1}/${files.length}] FAIL ${f} -- ${e.message}`);
  }
}

await writeFile('src/photos.json', JSON.stringify(manifest, null, 2)).catch(async () => {
  await mkdir('src', { recursive: true });
  await writeFile('src/photos.json', JSON.stringify(manifest, null, 2));
});
console.log(`\ndone: ${manifest.length} processed, ${failed.length} failed`);
if (failed.length) console.log(JSON.stringify(failed, null, 2));
