// Trims the source track to a short loop for the invitation.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SRC = 'audio-source/Evi-Edna-Ogholi-Happy-Birthday.mp3';
const OUT = 'public/audio/theme.mp3';

const START = Number(process.argv[2] ?? 12);
const LENGTH = Number(process.argv[3] ?? 72);

const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const RATES = [44100, 48000, 32000];

const buf = await readFile(SRC);

// skip an ID3v2 tag if present; its size is stored as four 7-bit bytes
let pos = 0;
if (buf.toString('latin1', 0, 3) === 'ID3') {
  pos = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
}

const frames = [];
let time = 0;

while (pos < buf.length - 4) {
  if (buf[pos] !== 0xff || (buf[pos + 1] & 0xe0) !== 0xe0) { pos++; continue; }

  const bitrate = BITRATES[(buf[pos + 2] >> 4) & 0x0f];
  const rate = RATES[(buf[pos + 2] >> 2) & 0x03];
  const pad = (buf[pos + 2] >> 1) & 0x01;
  if (!bitrate || !rate) { pos++; continue; }

  const size = Math.floor((144 * bitrate * 1000) / rate) + pad;
  if (size < 24) { pos++; continue; }

  frames.push({ start: pos, size, time });
  time += 1152 / rate;     
  pos += size;
}

const keep = frames.filter(f => f.time >= START && f.time < START + LENGTH);
if (!keep.length) throw new Error(`no frames between ${START}s and ${START + LENGTH}s (track is ${time.toFixed(1)}s)`);

const from = keep[0].start;
const to = keep[keep.length - 1].start + keep[keep.length - 1].size;
const out = buf.subarray(from, to);

await mkdir('public/audio', { recursive: true });
await writeFile(OUT, out);

const secs = keep.length * 1152 / 44100;
console.log(`source   ${(buf.length / 1048576).toFixed(2)} MB, ${time.toFixed(1)}s, ${frames.length} frames`);
console.log(`clip     ${START}s to ${(START + secs).toFixed(1)}s`);
console.log(`written  ${OUT}  ${(out.length / 1024).toFixed(0)} KB, ${secs.toFixed(1)}s`);
