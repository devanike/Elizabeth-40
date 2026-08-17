import { defineConfig } from 'vite';

/*
  Link previews need absolute URLs, so the SITE_URL placeholder in index.html
  has to become a real host at build time. Vercel sets these itself, so a
  deploy fills it in with no manual step:

    VERCEL_PROJECT_PRODUCTION_URL   the custom domain, or the .vercel.app one
    VERCEL_URL                      this specific deployment

  Locally, set SITE_URL to override. If none are present the placeholder is
  left alone, which is obvious rather than silently wrong.
*/
const host = (
  process.env.SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  ''
).replace(/^https?:\/\//, '').replace(/\/$/, '');

export default defineConfig({
  plugins: [
    {
      name: 'resolve-site-url',
      transformIndexHtml(html) {
        if (!host) {
          console.warn('\n  SITE_URL not set: link previews will not work on this build.\n');
          return html;
        }
        console.log(`\n  link previews pointing at https://${host}\n`);
        return html.replaceAll('SITE_URL', host);
      },
    },
  ],
  build: {
    target: 'es2019',          // in-app browsers on older Android lag behind Chrome
    assetsInlineLimit: 2048,
    cssCodeSplit: false,       // one small stylesheet beats a second round trip
  },
});
