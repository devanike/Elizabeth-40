// Swaps the SITE_URL placeholder for the real domain once it is registered.
import { readFile, writeFile } from 'node:fs/promises';

const domain = process.argv[2];
if (!domain) {
  console.error('usage: node scripts/set-domain.mjs <domain>   e.g. elizabethat40.com');
  process.exit(1);
}
const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

let html = await readFile('index.html', 'utf8');
const before = (html.match(/SITE_URL/g) || []).length;
if (!before) {
  console.log('No SITE_URL placeholders left. Current og:url:');
  console.log('  ' + (html.match(/property="og:url" content="([^"]+)"/) || [])[1]);
  process.exit(0);
}
html = html.replaceAll('SITE_URL', host);
await writeFile('index.html', html);
console.log(`replaced ${before} placeholder(s) with ${host}`);
console.log('remember to rebuild:  npm run build');
