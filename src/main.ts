import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { event, featured } from './data';
import photos from './photos.json';

gsap.registerPlugin(ScrollTrigger, SplitText);

type Photo = { id: string; src: string; w: number; h: number; lqip: string; sizes: number[] };
const all = photos as Photo[];
const byId = new Map(all.map(p => [p.id, p]));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

/* images */
function frame(p: Photo, sizes: string, curtain = true): HTMLElement {
  const fig = document.createElement('figure');
  fig.setAttribute('data-zoom', '');
  fig.setAttribute('role', 'button');
  fig.setAttribute('tabindex', '0');

  fig.style.setProperty('--ratio', String(p.w / p.h));
  const widths = p.sizes;
  const set = (ext: string) => widths.map(w => `/photos/${p.id}-${w}.${ext} ${w}w`).join(', ');

  fig.innerHTML = `
    <picture>
      <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
      <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
      <img src="/photos/${p.id}-${widths[widths.length - 1]}.jpg" alt="Elizabeth"
          width="${p.w}" height="${p.h}"
          loading="lazy" decoding="async"
          style="background-image:url('${p.lqip}');background-size:cover;background-position:center">
    </picture>`;

  const img = fig.querySelector('img')!;
  img.addEventListener('load', () => { img.style.backgroundImage = 'none'; }, { once: true });
  return fig;
}

/* populate */
const portrait = byId.get(featured.storyPortrait);
if (portrait) $('#storyPortrait').append(frame(portrait, '(min-width:900px) 52vw, 84vw'));

const family = byId.get(featured.storyFamily);
// prepended so the caption stays beneath the photograph
if (family) $('#storyFamily').prepend(frame(family, '(min-width:900px) 40vw, 72vw'));

const closing = byId.get(featured.closing[0]);
if (closing) $('#thanksPortrait').append(frame(closing, '(min-width:900px) 40vw, 90vw'));

const backdrop = byId.get(featured.backdrops[0]);
if (backdrop) $('#venueBg').append(frame(backdrop, '(min-width:860px) 50vw, 100vw'));

function scatter<T>(items: T[]): T[] {
  const n = items.length;
  if (n < 4) return items.slice();
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  let stride = Math.floor(n / 2) + 1;
  while (gcd(stride, n) !== 1) stride++;
  return Array.from({ length: n }, (_, i) => items[(i * stride) % n]);
}

const spoken = new Set<string>([
  featured.hero, ...featured.numerals,
  featured.storyPortrait, featured.storyFamily,
  ...featured.closing, featured.backdrops[0],
]);
const rest = scatter(all.filter(p => !spoken.has(p.id)));
const rowA = $('#reelA'), rowB = $('#reelB'), rowC = $('#reelC');
const rows = [rowA, rowB, rowC];
const ROW_HEIGHTS = [40, 50, 34];     
const weights = ROW_HEIGHTS.map(h => 1 / h);
const totalWeight = weights.reduce((a, b) => a + b, 0);

let cursor = 0;
weights.forEach((w, i) => {
  const take = i === weights.length - 1
    ? rest.length - cursor
    : Math.round(rest.length * w / totalWeight);
  rest.slice(cursor, cursor + take).forEach(p => rows[i].append(frame(p, 'auto', false)));
  cursor += take;
});

// Schedule
$('#slots').innerHTML = event.schedule.map(s => {
  const [time, ampm] = s.time.split(' ');
  return `
  <div class="slot" data-rise data-anim="left">
    <p class="slot__time">${time}<span style="font-size:.42em"> ${ampm.toLowerCase()}</span></p>
    <p class="slot__title">${s.title}</p>
    <p>${s.note}</p>
  </div>`;
}).join('');

$('#crew').innerHTML = event.hosts.map(h =>
  `<div class="crew__card" data-rise data-anim="left"><span>${h.role}</span><b>${h.name}</b></div>`).join('');

// Links
$<HTMLAnchorElement>('#directions').href = event.venue.directions;
$<HTMLAnchorElement>('#rsvp').href = event.rsvp;
$<HTMLAnchorElement>('#rsvpFoot').href = event.rsvp;

// Colour wheel. 
const shades = event.dressCode.swatches;
const step = 360 / shades.length;
const ring = $<HTMLElement>('#wheelRing');
const wheelName = $('#wheelName');
const wheelHex = $('#wheelHex');

ring.style.background = `conic-gradient(from -90deg, ${
  shades.map((c, i) => `${c.hex} ${i * step}deg ${(i + 1) * step}deg`).join(', ')
})`;

shades.forEach((c, i) => {
  const mid = (-90 + i * step + step / 2) * Math.PI / 180;
  const r = 37; 
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'wheel__dot';
  dot.dataset.hex = c.hex;
  dot.dataset.name = c.name;
  dot.style.left = `${50 + Math.cos(mid) * r}%`;
  dot.style.top = `${50 + Math.sin(mid) * r}%`;
  dot.setAttribute('aria-label', `Copy ${c.name}, ${c.hex}`);
  $('#wheel').append(dot);
});

function selectShade(dot: HTMLElement) {
  document.querySelectorAll('.wheel__dot').forEach(d => d.classList.remove('is-on'));
  dot.classList.add('is-on');
  wheelName.textContent = dot.dataset.name!;
  wheelHex.textContent = dot.dataset.hex!;
}

$('#wheel').addEventListener('click', async e => {
  const dot = (e.target as HTMLElement).closest<HTMLElement>('.wheel__dot');
  if (!dot) return;
  selectShade(dot);
  try { await navigator.clipboard.writeText(dot.dataset.hex!); } catch { /* blocked in some in-app browsers */ }
  const was = wheelHex.textContent;
  wheelHex.textContent = 'copied';
  setTimeout(() => { wheelHex.textContent = was; }, 1300);
});

selectShade(document.querySelector<HTMLElement>('.wheel__dot')!);

// Thank you
$('#thanksCopy').innerHTML = event.thankYou
  .map((line, i) => i === 0
    ? `<p class="thanks__lead" data-rise data-anim="right">${line}</p>`
    : `<p data-rise data-anim="right">${line}</p>`)
  .join('');
$('#thanksSign').textContent = event.signature;

/* countdown */
const target = new Date(event.startsAt).getTime();
const grid = $('#countGrid');
const UNITS: [string, number][] = [['days', 864e5], ['hours', 36e5], ['minutes', 6e4], ['seconds', 1e3]];
let lastValues: string[] = [];

function tick() {
  const remaining = target - Date.now();

  if (remaining <= 0) {
    grid.innerHTML = `<li style="grid-column:1/-1"><b>Today</b><span>the day is here</span></li>`;
    return;
  }

  let left = remaining;
  const values = UNITS.map(([, ms]) => {
    const v = Math.floor(left / ms);
    left -= v * ms;
    return String(v).padStart(2, '0');
  });

  if (!lastValues.length) {
    grid.innerHTML = UNITS.map(([label], i) =>
      `<li data-rise data-anim="blur"><b data-unit="${label}">${values[i]}</b><span>${label}</span></li>`).join('');
  } else {
    UNITS.forEach(([label], i) => {
      if (values[i] === lastValues[i]) return;
      const el = grid.querySelector<HTMLElement>(`[data-unit="${label}"]`);
      if (!el) return;
      el.textContent = values[i];
      if (!reduced) gsap.fromTo(el, { y: -6, opacity: .55 }, { y: 0, opacity: 1, duration: .35, ease: 'power2.out' });
    });
  }
  lastValues = values;
}
tick();
setInterval(tick, 1000);

/* theme */
const THEME_KEY = 'e40-theme';
const themeBtn = $<HTMLButtonElement>('#theme');

function applyTheme(name: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', name);
  themeBtn.setAttribute('aria-label', name === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', name === 'dark' ? '#0C0806' : '#F7F4EF');
  try { localStorage.setItem(THEME_KEY, name); } catch { /* private mode */ }
}

const saved = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
applyTheme(saved === 'dark' ? 'dark' : 'light');
themeBtn.addEventListener('click', () =>
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

/* sound */
const track = document.getElementById('track') as HTMLAudioElement | null;
const soundBtn = document.getElementById('sound') as HTMLButtonElement | null;
let hasAudio = false;

track?.addEventListener('canplay', () => { hasAudio = true; }, { once: true });

const VOLUME = .5;
const SEAM = 1.2; 
let ramping = false;

track?.addEventListener('timeupdate', () => {
  if (!track || ramping || track.paused) return;
  const d = track.duration;
  if (!isFinite(d) || d <= SEAM * 2) return;
  const t = track.currentTime;
  const k = t < SEAM ? t / SEAM
          : t > d - SEAM ? (d - t) / SEAM
          : 1;
  track.volume = Math.max(0, Math.min(VOLUME, VOLUME * k));
});

function setSound(on: boolean) {
  if (!soundBtn) return;
  soundBtn.hidden = false;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? 'Mute music' : 'Play music');
}

track?.addEventListener('playing', () => setSound(true));
track?.addEventListener('pause', () => setSound(false));
track?.addEventListener('waiting', () => setSound(false));
track?.addEventListener('ended', () => setSound(false));

async function startMusic() {
  if (!track || !soundBtn) return;
  try {
    track.volume = VOLUME;
    await track.play();
  } catch {
    if (hasAudio) setSound(false);
  }
}

soundBtn?.addEventListener('click', async () => {
  if (!track) return;
  if (soundBtn.getAttribute('aria-pressed') === 'true') {
    track.pause();      
  } else {
    try { track.volume = VOLUME; await track.play(); } catch { /* still blocked */ }
  }
});

document.addEventListener('visibilitychange', () => {
  if (!track) return;
  if (document.hidden) track.pause();
  else if (soundBtn?.getAttribute('aria-pressed') === 'true') track.play().catch(() => {});
});

/* lightbox */
function lightbox() {
  const box = $<HTMLElement>('#lightbox');
  const img = $<HTMLImageElement>('#lightboxImg');
  const count = $('#lightboxCount');
  const figures = gsap.utils.toArray<HTMLElement>('[data-zoom]');
  let index = 0;
  let lastFocus: HTMLElement | null = null;

  const bigSrc = (fig: HTMLElement) => {
    const el = fig.querySelector('img');
    return el ? el.currentSrc.replace(/-\d+\.(avif|webp|jpg)$/, '-1440.jpg') : '';
  };

  function show(i: number) {
    index = (i + figures.length) % figures.length;
    img.src = bigSrc(figures[index]);
    count.textContent = `${index + 1} / ${figures.length}`;
    if (!reduced) gsap.fromTo(img, { opacity: 0, scale: .985 }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out' });
  }

  function open(i: number) {
    lastFocus = document.activeElement as HTMLElement;
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    $<HTMLElement>('#lightboxClose').focus();
  }

  function close() {
    box.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
    lastFocus?.focus();
  }

  figures.forEach((fig, i) => {
    fig.addEventListener('click', () => open(i));
    fig.addEventListener('keydown', e => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') { e.preventDefault(); open(i); }
    });
  });

  $('#lightboxPrev').addEventListener('click', e => { e.stopPropagation(); show(index - 1); });
  $('#lightboxNext').addEventListener('click', e => { e.stopPropagation(); show(index + 1); });
  $('#lightboxClose').addEventListener('click', close);

  box.addEventListener('click', e => {
    if (e.target === box) close();
  });

  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    const k = (e as KeyboardEvent).key;
    if (k === 'Escape') close();
    if (k === 'ArrowRight') show(index + 1);
    if (k === 'ArrowLeft') show(index - 1);
  });

  // swipe
  let x0 = 0, y0 = 0;
  box.addEventListener('touchstart', e => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90) close();          
  }, { passive: true });
}

/* the opening */
const gate = $('#gate');
const main = $('#main');
const card = $<HTMLElement>('#card');

let opened = false;
const skipGate = new URLSearchParams(location.search).has('open');

function openInvitation(instant = false) {
  if (opened) return;
  opened = true;

  startMusic();
  card.classList.remove('is-idle');

  document.documentElement.classList.add('js-motion');

  main.classList.remove('locked');
  prepareHero();
  const controls = $('#controls');
  controls.removeAttribute('hidden');
  setTimeout(() => controls.classList.add('is-hinting'), 900);
  setTimeout(() => controls.classList.remove('is-hinting'), 4200);

  const finish = () => {
    gate.classList.add('is-gone');
    heroIn();
    requestAnimationFrame(() => requestAnimationFrame(initScroll));
  };

  if (reduced || instant) { finish(); return; }

  const from = card.getBoundingClientRect();

  gsap.set(card, {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    clipPath: `inset(${from.top}px ${window.innerWidth - from.right}px ${window.innerHeight - from.bottom}px ${from.left}px)`,
    zIndex: 2,
  });
  gsap.set('.card__img img', { scale: 1.14, transformOrigin: '50% 24%' });
  gsap.set('#cardBand', {
    position: 'absolute',
    top: from.bottom - 1,
    left: from.left,
    width: from.width,
    bottom: 'auto',
    xPercent: 0,
    yPercent: -100,
  });

  const tl = gsap.timeline({ onComplete: finish });

  tl.to('#gateCue', { autoAlpha: 0, duration: .25 }, 0)
    .to(card, { scale: .97, duration: .12, ease: 'power2.out' }, 0)
    .to(card, { scale: 1, duration: .2, ease: 'power2.inOut' }, .12)
    .to('#cardBand', { y: from.height * .9, autoAlpha: 0, duration: .5, ease: 'power3.inOut' }, .16)
    .to(card, {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: 1.05,
      ease: 'expo.inOut',
    }, .6)
    .to('.card__img img', { scale: 1, duration: 1.25, ease: 'expo.out' }, .6)
    .to(gate, { autoAlpha: 0, duration: .3 }, 1.5);
}

card.addEventListener('click', () => openInvitation(), { once: true });
card.addEventListener('keydown', e => {
  const k = (e as KeyboardEvent).key;
  if (k === 'Enter' || k === ' ') { e.preventDefault(); openInvitation(); }
});
if (skipGate) openInvitation(true);

/* hero entrance */
let playHeroLines: (() => void) | null = null;

function prepareHero() {
  if (reduced) return;
  playHeroLines = prepareLines('.hero__copy [data-split]', .1);
}

function heroIn() {
  lightbox();
  if (reduced) return;
  gsap.timeline({ delay: .15 })
    .to('#heroMedia img', { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .add(() => playHeroLines?.(), .2);
}

/* line reveals */
function prepareLines(target: string | HTMLElement, stagger = .09): () => void {
  const targets = typeof target === 'string'
    ? gsap.utils.toArray<HTMLElement>(target)
    : [target];
  const plays: Array<() => void> = [];
  targets.forEach(el => {
    const split = new SplitText(el, { type: 'lines', linesClass: 'line' });
    split.lines.forEach(line => {
      const inner = document.createElement('span');
      inner.className = 'line__inner';
      inner.style.display = 'block';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });

    const inners = el.querySelectorAll('.line__inner');
    gsap.set(inners, { yPercent: 118 });
    plays.push(() => gsap.to(inners, {
      yPercent: 0,
      duration: 1.05,
      stagger,
      ease: 'power4.out',
    }));
  });
  return () => plays.forEach(play => play());
}

function onEnter(el: Element, run: () => void) {
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.disconnect();
      run();
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
  io.observe(el);
}

/* scroll motion */
function initScroll() {
  document.documentElement.classList.add('js-motion');

  if (reduced) {
    ScrollTrigger.refresh();
    return;
  }

  gsap.ticker.lagSmoothing(0);

  type Variant = 'up' | 'drop' | 'left' | 'right' | 'scale' | 'blur';

  const SECTION_MOTION: Record<string, Variant> = {
    story:    'left',
    reel:     'up',
    evening:  'left',
    venue:    'right',
    dress:    'scale',
    count:    'blur',
    thanks:   'right',
  };

  const FROM: Record<Variant, gsap.TweenVars> = {
    up:    { autoAlpha: 0, y: 90 },
    drop:  { autoAlpha: 0, y: -80 },
    left:  { autoAlpha: 0, x: -80 },
    right: { autoAlpha: 0, x: 80 },
    scale: { autoAlpha: 0, scale: .74 },
    blur:  { autoAlpha: 0, y: 50, filter: 'blur(20px)' },
  };

  const PARTS = 'h1, h2, h3, p, figure, blockquote, .btn, .wheel, .slot, .crew__card, .count__grid li, .foot__rows span';
  const EXCLUDE = '.numerals__text';  

  function topLevelParts(root: HTMLElement): HTMLElement[] {
    const found = [...root.querySelectorAll<HTMLElement>(PARTS)]
      .filter(el => !el.matches(EXCLUDE));
    return found.filter(el => !found.some(other => other !== el && other.contains(el)));
  }

  // Sideways-travelling rows: 
  const GROUP_OBSERVED = new Set(['reel']);

  function revealGroup(container: HTMLElement, variant: Variant, stagger = .12) {
    const parts = topLevelParts(container);
    if (!parts.length) return;

    const from = FROM[variant];
    gsap.set(parts, from);

    const settle = {
      autoAlpha: 1, x: 0, y: 0, scale: 1,
      ...(variant === 'blur' ? { filter: 'blur(0px)' } : {}),
      duration: variant === 'blur' ? 1.5 : 1.25,
      ease: 'expo.out',
      overwrite: 'auto' as const,
    };

    if (GROUP_OBSERVED.has(container.id)) {
      onEnter(container, () => gsap.to(parts, { ...settle, stagger: .04 }));
    } else {
      parts.forEach((el, i) => {
        onEnter(el, () => gsap.to(el, {
          ...settle,
          delay: Math.min(i, 3) * stagger, 
        }));
      });
    }

    const rescue = setInterval(() => {
      let remaining = 0;
      parts.forEach(el => {
        if (parseFloat(getComputedStyle(el).opacity) >= .05) return;
        remaining++;
        const box = el.getBoundingClientRect();
        const onScreen = box.top < window.innerHeight * .9 && box.bottom > 0;
        if (onScreen) {
          gsap.to(el, {
            autoAlpha: 1, x: 0, y: 0, scale: 1, filter: 'none',
            duration: .8, ease: 'expo.out',
          });
        }
      });
      if (!remaining) clearInterval(rescue);
    }, 1200);
  }

  Object.entries(SECTION_MOTION).forEach(([id, variant]) => {
    const sec = document.getElementById(id);
    if (sec) revealGroup(sec, variant);
  });

  const foot = document.querySelector<HTMLElement>('.foot');
  if (foot) revealGroup(foot, 'scale', .07);

  gsap.set('.numerals__line', { autoAlpha: 0, y: 50, filter: 'blur(20px)' });

  const caption = document.querySelector('.numerals__line');
  if (caption) {
    onEnter(caption, () => gsap.to(caption, {
      autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out',
    }));
  }

  gsap.fromTo('.numerals__text',
    { backgroundPosition: '50% 0%' },
    { backgroundPosition: '50% 100%', ease: 'none',
      scrollTrigger: {
        trigger: '#numerals',
        start: 'top top',

        end: () => '+=' + window.innerHeight * 1.6,
        pin: true,
        scrub: .5,
        invalidateOnRefresh: true,
      } });

  const span = (row: Element) => Math.max(0, row.scrollWidth - window.innerWidth);
  gsap.timeline({
    scrollTrigger: {
      trigger: '#reel',
      start: 'top bottom',
      end: () => '+=' + Math.max(span(rowA), span(rowB), span(rowC), window.innerHeight * 1.5),
      scrub: 1,
      invalidateOnRefresh: true,
    },
  })
    .fromTo(rowA, { x: 0 }, { x: () => -span(rowA), ease: 'none' }, 0)
    .fromTo(rowB, { x: () => -span(rowB) }, { x: 0, ease: 'none' }, 0)
    .fromTo(rowC, { x: 0 }, { x: () => -span(rowC), ease: 'none' }, 0);

  gsap.fromTo('#spineFill', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.spine', start: 'top 75%', end: 'bottom 60%', scrub: .6 },
  });

  gsap.to('#heroMedia img', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  ScrollTrigger.refresh();

  let pending = 0;
  const resettle = () => {
    clearTimeout(pending);
    pending = window.setTimeout(() => ScrollTrigger.refresh(), 220);
  };
  window.addEventListener('load', resettle);
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', resettle, { once: true });
  });
}
