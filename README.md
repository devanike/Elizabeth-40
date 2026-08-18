# Elizabeth @ 40

An animated single-page invitation for a 40th birthday in Las Vegas, built for guests opening one link on a phone from WhatsApp.

## What it does

A portrait invitation card sits centre screen. Tapping it breaks the sleeve away and the card opens out to fill the screen, becoming the hero photograph, so the guest passes through the invitation rather than closing it.

From there the page runs: the celebrant, an oversized **40** with photographs travelling through the letterforms while the section is pinned, three rows of photographs sliding at different speeds, the evening's schedule on a vertical spine, the venue, a colour wheel for the dress code, a live countdown pinned to Las Vegas time, and a thank-you note.

Every photograph opens full screen with swipe and keyboard navigation. Light and dark themes. Music starts on the opening tap, which is the only moment a browser will allow it.

## Stack

Vite 8, TypeScript, GSAP with ScrollTrigger and SplitText. No framework, no CSS preprocessor.

**Reveals use IntersectionObserver, not ScrollTrigger.** ScrollTrigger precomputes a scroll position per trigger, and thirty photographs loading changes the page height underneath it, leaving those positions stale so sections scroll past without firing. An observer has no positions to go stale. ScrollTrigger drives only the four things that genuinely need scroll *progress*: the pinned 40, the horizontal rows, the spine draw, and the hero drift.

One reveal system covers the whole page. Each section declares how its contents arrive (`left`, `right`, `up`, `scale`, `blur`, `drop`) in `SECTION_MOTION`, and every heading, paragraph, figure and button inside is collected automatically. Adding content later needs no markup attribute.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev -- --host` also serves on your local network, for testing on a real phone.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run check` | Real-browser audit at 360, 390, 411, 430, 768 and 1440: console errors, failed requests, elements left invisible, horizontal overflow with the culprit named, images cropping more than 18% off their natural shape. Saves a screenshot per section per viewport into `shots/`. |
| `npm run motion` | Proves every section animates on entry. Parks each section below the fold on a fresh load, scrolls it in, samples opacity and transform. |
| `npm run images` | Rebuilds the web image set from `images/` |
| `npm run audio` | Re-cuts the music loop. `npm run audio 45 72` takes 72s from 0:45 |
| `npm run heic` | Converts HEIC originals that sharp cannot decode |
| `npm run social` | Rebuilds the link-preview card and favicons in a real browser |
| `npm run domain <domain>` | Replaces the `SITE_URL` placeholder before deploying |

`check` and `motion` drive your installed Edge through Playwright. Nothing is downloaded.

`images`, `heic` and `audio` read from the excluded source folders, so they only run on a machine that has the originals. Everything else works from a fresh clone.

## Images

`images/` holds 342MB of camera originals and is **not** in git. `npm run images` turns them into `public/photos/`: AVIF, WebP and JPEG at 480, 960 and 1440 wide, plus a blurred placeholder inlined per photo. That is 342MB down to 35MB across 301 files, and a phone downloads roughly 80KB per photograph instead of 10MB.

`public/photos/` **is** committed, because the deploy needs it and the originals are not in the repo.

## Before deploying

The link preview needs an absolute URL, so this must run once the domain exists:

```bash
npm run domain elizabethat40.com
npm run build
```

Without it, `og:url` and `og:image` still say `SITE_URL` and WhatsApp will show no preview card at all.

## Things worth knowing

- **The countdown is pinned to Pacific time** (`2026-10-16T17:00:00-07:00`). Guests in Nigeria are eight hours ahead; without the offset half the guest list would see the wrong number.
- **RSVP is a link, not a feature.** It opens the client's existing rsvp.online page, the same destination as the QR on the printed cards. No responses are collected here.
- **The share card must stay a JPEG under about 300KB.** WhatsApp will not render AVIF or WebP in a preview and silently drops oversized images.
- **All event copy lives in `src/data.ts`.** A time or venue change is a one-line edit.
- **Sections clip their own overflow**, not `html` or `body`. Overflow on the root propagates to the viewport and changes which box scrolls, which breaks scroll measurement.

## Layout

```
index.html              all markup
src/main.ts             all behaviour
src/styles.css          all styling, two themes
src/data.ts             event copy, times, venue, RSVP
src/photos.json         generated image manifest
scripts/                build and test tooling
public/photos/          web-ready images (committed)
public/fonts/           Great Vibes and Jost, self-hosted, 84K
images/                 originals (not in git)
```

Type is Great Vibes for the celebrant's name and the emotional moments, Jost for everything structural.
