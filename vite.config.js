import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';

const host = (
  process.env.SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  ''
).replace(/^https?:\/\//, '').replace(/\/$/, '');

const shareCard =
  readdirSync('public').find(f => /^share-card-[0-9a-f]{8}\.jpg$/.test(f)) || 'share-card.jpg';

export default defineConfig({
  plugins: [
    {
      name: 'resolve-site-url',
      transformIndexHtml(html) {
        if (!host) {
          console.warn('\n  SITE_URL not set: link previews will not work on this build.\n');
          return html.replaceAll('SHARE_CARD', shareCard);
        }
        console.log(`  link previews: https://${host}/${shareCard}`);
        return html.replaceAll('SITE_URL', host).replaceAll('SHARE_CARD', shareCard);
      },
    },
  ],
  build: {
    target: 'es2019',    
    assetsInlineLimit: 2048,
    cssCodeSplit: false,     
  },
});
