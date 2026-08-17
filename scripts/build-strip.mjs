// Builds the tall image strip that scrolls through the "40" numerals.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const FRAMES = ['img-8268', 'img-8256', 'img-8283', 'img-8286'];
const SIZES = [
  { w: 1080, h: 1350, suffix: '' },
  { w: 640,  h: 800,  suffix: '-sm' },
];

await mkdir('public/photos', { recursive: true });

for (const { w: W, h: H, suffix } of SIZES) {
  const src = W > 800 ? '1440' : '960';
  const tiles = await Promise.all(FRAMES.map(async (id, i) => ({
    input: await sharp(`public/photos/${id}-${src}.jpg`)
      .resize({ width: W, height: H, fit: 'cover', position: 'attention' })
      .toBuffer(),
    top: i * H,
    left: 0,
  })));

  const canvas = () => sharp({
    create: { width: W, height: H * FRAMES.length, channels: 3, background: '#0B0F18' },
  }).composite(tiles);

  await canvas().webp({ quality: 74 }).toFile(`public/photos/numeral-strip${suffix}.webp`);
  await canvas().jpeg({ quality: 74, mozjpeg: true }).toFile(`public/photos/numeral-strip${suffix}.jpg`);
  console.log(`numeral strip${suffix || ' (desktop)'}: ${W}x${H * FRAMES.length}`);
}
