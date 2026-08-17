import convert from 'heic-convert';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const files = ['IMG_7478.HEIC', 'IMG_7483.HEIC'];
await mkdir('images/converted', { recursive: true });

for (const f of files) {
  try {
    const buf = await readFile(`images/${f}`);
    const jpg = await convert({ buffer: buf, format: 'JPEG', quality: 0.95 });
    const out = `images/converted/${f.replace(/\.HEIC$/i, '.jpg')}`;
    await writeFile(out, Buffer.from(jpg));
    console.log(`ok   ${f} -> ${out}`);
  } catch (e) {
    console.log(`FAIL ${f} -- ${e.message}`);
  }
}
