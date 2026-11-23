// Building blocks shared by every component.
import { html, raw, attrs, cx } from '../lib/html.mjs';

// THE cross. Every cross on the site is drawn from these two paths, through
// cross() below or the #i-cross symbols. Never use the ☦ text glyph.
//
// slavic:    Russian Orthodox eight-pointed cross. Short top bar (titulus),
//            main bar, and a slanted footrest whose LEFT end (viewer's left)
//            is HIGHER. On the 24 x 40 grid the footrest runs from y=22 at
//            x=4 down to y=30 at x=20.
// byzantine: equal-armed Greek cross, used inside the prosphora seal.
export const CROSSES = {
  slavic: { viewBox: '0 0 24 40', path: 'M10 0h4v40h-4zM6 4h12v4H6zM0 12h24v4H0zM4 22l16 8v4L4 26z' },
  byzantine: { viewBox: '0 0 24 24', path: 'M9.5 0h5v24h-5zM0 9.5h24v5H0z' }
};

const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  chevron: '<path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  close: '<path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  cart: '<path d="M3.5 4.5h2.2l2 10.5h10l1.8-7.5H7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.4" fill="currentColor"/><circle cx="16.5" cy="19" r="1.4" fill="currentColor"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.3a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9.7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  phone: '<path d="M6.6 3.5 9 3l1.6 4-2 1.3a11 11 0 0 0 7.1 7.1l1.3-2 4 1.6-.5 2.4a2 2 0 0 1-2 1.6A16.6 16.6 0 0 1 5 5.5a2 2 0 0 1 1.6-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  mail: '<path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  calendar: '<path d="M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  play: '<path d="M9 7.5v9l7.5-4.5z" fill="currentColor"/>',
  check: '<path d="m5 12.5 4.2 4L19 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  candle: '<path d="M12 3.2c1.7 2 2.3 3.3 1.5 4.6a1.8 1.8 0 0 1-3 0c-.8-1.3-.2-2.6 1.5-4.6zM10.4 10.5h3.2V19h-3.2zM7 19h10M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  bell: '<circle cx="12" cy="2.9" r="1.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 4v1.4M7.2 16.5c.7-1.1 1-2.6 1-4.6v-2a3.8 3.8 0 0 1 7.6 0v2c0 2 .3 3.5 1 4.6zM5.5 16.5h13M10.7 18.7a1.4 1.4 0 0 0 2.6 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  house: '<path d="M4 11.5 12 5l8 6.5M6 10v9.5h12V10M10 19.5v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  book: '<path d="M5 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v13.5H6.5A1.5 1.5 0 0 1 5 18zM5 18a1.5 1.5 0 0 1 1.5-1.5H18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  heart: '<path d="M12 19.5s-7-4.3-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.2c0 5-7 9.3-7 9.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  hands: '<path d="M8 20v-4.5L4.5 11V6.5M16 20v-4.5l3.5-4.5V6.5M8 15.5l1.5-6M16 15.5l-1.5-6M12 4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
};

export const SPRITE = raw(`<svg width="0" height="0" class="sprite" aria-hidden="true" focusable="false"><defs>
<symbol id="i-cross" viewBox="${CROSSES.slavic.viewBox}"><path d="${CROSSES.slavic.path}" fill="currentColor"/></symbol>
<symbol id="i-cross-byzantine" viewBox="${CROSSES.byzantine.viewBox}"><path d="${CROSSES.byzantine.path}" fill="currentColor"/></symbol>
${Object.entries(ICONS)
  .map(([id, body]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${body}</symbol>`)
  .join('\n')}
</defs></svg>`);

export const icon = (name, className = 'icon') => html`<svg class="${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

export const cross = (className = 'cross', variant = 'slavic') =>
  html`<svg class="${className}" viewBox="${CROSSES[variant].viewBox}" aria-hidden="true" focusable="false"><use href="#i-${variant === 'slavic' ? 'cross' : 'cross-byzantine'}"></use></svg>`;

// A cross placed inside another SVG drawing (logo, art). x/y/width/height
// in that drawing's units; the symbol keeps its own proportions.
export const crossInSvg = (x, y, w, h, cls = 'a-gold', variant = 'slavic') =>
  `<use href="#i-${variant === 'slavic' ? 'cross' : 'cross-byzantine'}" x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;

export function eyebrow(text) {
  if (!text) return '';
  return html`<p class="eyebrow">${cross('eyebrow__cross')}<span>${text}</span></p>`;
}

export function sectionHead(props, ctx, { level = 2, align = 'start', className } = {}) {
  const title = ctx.l(props.title);
  if (!props.eyebrow && !title && !props.intro) return '';
  const Tag = `h${level}`;
  return html`<header class="${cx('section-head', `section-head--${props.align || align}`, className)}">
    ${eyebrow(ctx.l(props.eyebrow))}
    ${title ? raw(`<${Tag} class="section-head__title">${html`${ctx.text(props.title)}`}</${Tag}>`) : ''}
    ${props.intro ? html`<div class="section-head__intro prose">${ctx.md(props.intro)}</div>` : ''}
  </header>`;
}

const BUTTON_STYLES = ['primary', 'secondary', 'quiet', 'light', 'link'];

export function button(action, ctx, { className } = {}) {
  if (!action) return '';
  const url = ctx.href(action);
  const external = ctx.isExternal(url);
  const style = BUTTON_STYLES.includes(action.style) ? action.style : 'primary';
  return html`<a${attrs({ class: cx('btn', `btn--${style}`, className), href: url, target: external ? '_blank' : null, rel: external ? 'noopener' : null })}>${action.icon ? icon(action.icon, 'btn__icon') : ''}<span>${ctx.text(action.label)}</span>${external ? icon('external', 'btn__icon btn__icon--end') : style === 'link' ? icon('arrow', 'btn__icon btn__icon--end flip-rtl') : ''}</a>`;
}

export function actions(list, ctx, className) {
  if (!list?.length) return '';
  return html`<div class="${cx('actions', className)}">${list.map((a) => button(a, ctx))}</div>`;
}

// Image: { src, alt, position } or drawn art: { art: "honey" }
export function image(img, ctx, { className, priority = false, sizes } = {}) {
  if (!img) return '';
  if (img.art) return art(img.art, { className, label: ctx.l(img.alt) });
  const size = ctx.imageSize(img.src) || {};
  return html`<img${attrs({
    class: className,
    src: ctx.asset(img.src),
    alt: ctx.l(img.alt) || '',
    width: size.width,
    height: size.height,
    loading: priority ? null : 'lazy',
    decoding: priority ? null : 'async',
    fetchpriority: priority ? 'high' : null,
    sizes,
    style: img.position ? `object-position:${img.position}` : null
  })}>`;
}

export function figure(img, ctx, { className, shape = 'arch', caption = true, ...rest } = {}) {
  if (!img) return '';
  const credit = img.src ? ctx.credit(img.src) : null;
  const text = ctx.l(img.caption) || (credit ? ctx.l(credit.caption) : '');
  return html`<figure class="${cx('figure', `figure--${img.shape || shape}`, className)}">
    <div class="figure__media">${image(img, ctx, rest)}</div>
    ${caption && text ? html`<figcaption class="figure__caption">${text}</figcaption>` : ''}
  </figure>`;
}

// ---- Drawn placeholders ----------------------------------------------------
// Tasteful line-and-wash drawings used where a client has no photo yet.
// Icons are drawn frontal and are never mirrored. Only saints carry a
// nimbus; portraits of living people never do.

const ICON_FIGURE = `<path class="a-gold" d="M10 150V52a50 50 0 0 1 100 0v98z"/>
<circle class="a-nimbus" cx="60" cy="58" r="25"/>
<path class="a-robe" d="M22 150c2-30 12-50 26-58 7-3 17-3 24 0 14 8 24 28 26 58z"/>
<path class="a-robe-2" d="M48 92c4 10 8 30 12 58 4-28 8-48 12-58-7-3-17-3-24 0z"/>
<ellipse class="a-face" cx="60" cy="62" rx="12" ry="15"/>
<path class="a-line" d="M10 150V52a50 50 0 0 1 100 0v98z"/>`;

const ART = {
  'patron-icon': { vb: '0 0 120 160', body: ICON_FIGURE },
  icon: { vb: '0 0 120 160', body: `<rect class="a-wood" x="2" y="2" width="116" height="156" rx="3"/><g transform="translate(9 9) scale(.85)">${ICON_FIGURE}</g>` },
  portrait: {
    vb: '0 0 120 160',
    body: `<path class="a-stone" d="M10 150V52a50 50 0 0 1 100 0v98z"/><circle class="a-shade" cx="60" cy="66" r="17"/><path class="a-shade" d="M26 150c3-28 15-46 34-46s31 18 34 46z"/><path class="a-line" d="M10 150V52a50 50 0 0 1 100 0v98z"/>`
  },
  candles: {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><g class="a-wax"><rect x="48" y="40" width="10" height="70" rx="2"/><rect x="75" y="28" width="10" height="82" rx="2"/><rect x="102" y="46" width="10" height="64" rx="2"/></g><g class="a-flame"><path d="M53 24c5 6 6 10 3 14a4 4 0 0 1-6 0c-3-4-2-8 3-14z"/><path d="M80 12c5 6 6 10 3 14a4 4 0 0 1-6 0c-3-4-2-8 3-14z"/><path d="M107 30c5 6 6 10 3 14a4 4 0 0 1-6 0c-3-4-2-8 3-14z"/></g><path class="a-line" d="M30 110h100"/>`
  },
  honey: {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><rect class="a-wood" x="56" y="20" width="48" height="12" rx="3"/><path class="a-honey" d="M52 36h56v62a10 10 0 0 1-10 10H62a10 10 0 0 1-10-10z"/><rect class="a-label" x="60" y="56" width="40" height="28" rx="2"/>${crossInSvg(76.5, 60, 7, 20, 'a-ink')}<path class="a-line" d="M30 108h100"/>`
  },
  incense: {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><path class="a-cloth" d="M58 44c-6 20-8 40-4 58 8 6 44 6 52 0 4-18 2-38-4-58z"/><path class="a-line" d="M58 44c8-6 36-6 44 0M66 40c4 6 24 6 28 0"/><g class="a-grain"><circle cx="38" cy="100" r="3"/><circle cx="46" cy="104" r="2.5"/><circle cx="118" cy="102" r="3"/><circle cx="126" cy="98" r="2"/><circle cx="112" cy="106" r="2"/></g><path class="a-smoke" d="M80 36c-6-8 6-12 0-20s4-10 2-14"/>`
  },
  'prayer-rope': {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><ellipse class="a-knots" cx="80" cy="50" rx="34" ry="30"/>${crossInSvg(74.5, 80, 11, 18, 'a-ink')}<path class="a-tassel" d="M80 98l-6 16h12z"/>`
  },
  book: {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><rect class="a-leather" x="52" y="14" width="60" height="90" rx="3"/><rect class="a-pages" x="112" y="18" width="6" height="82"/><rect class="a-line" x="58" y="20" width="48" height="78" rx="2"/>${crossInSvg(74, 38, 16, 27, 'a-gold')}`
  },
  handmade: {
    vb: '0 0 160 120',
    body: `<rect class="a-stone" width="160" height="120"/><path class="a-wood" d="M40 70h80l-8 30H48z"/><path class="a-line" d="M40 70h80M48 100h64M56 70c4-10 44-10 48 0"/><path class="a-wood-2" d="M100 22c8 0 12 6 10 14-1 6-6 9-10 10l-24 34-4-3 22-36c-3-3-4-8-2-12 2-5 4-7 8-7z"/>`
  },
  lampada: {
    vb: '0 0 120 160',
    body: `<path class="a-line" d="M60 4v40M44 44l16-12 16 12"/><path class="a-glass" d="M36 52h48c0 30-10 48-24 48S36 82 36 52z"/><path class="a-flame" d="M60 58c5 6 6 10 3 14a4 4 0 0 1-6 0c-3-4-2-8 3-14z"/><path class="a-gold" d="M40 50h40v6H40z"/><path class="a-line" d="M60 100v14"/>`
  },
  // Prosphora (Lamb) seal: cross with IC XC above the arms and NI KA below.
  'prosphora-seal': {
    vb: '0 0 120 120',
    body: `<circle class="a-bread" cx="60" cy="60" r="58"/><circle class="a-bread-line" cx="60" cy="60" r="50"/><rect class="a-bread-line" x="26" y="26" width="68" height="68"/>${crossInSvg(26, 26, 68, 68, 'a-bread-ink', 'byzantine')}
<g class="a-seal-text" text-anchor="middle"><text x="39.5" y="46">IC</text><text x="80.5" y="46">XC</text><text x="39.5" y="85.5">NI</text><text x="80.5" y="85.5">KA</text></g>
<path class="a-bread-line" d="M32 32.5h15M73 32.5h15"/>`
  },
  map: {
    vb: '0 0 400 260',
    body: `<rect class="a-stone" width="400" height="260"/><g class="a-contour"><path d="M-10 60c60-20 120 10 180-10s140-30 240 0"/><path d="M-10 90c70-18 130 14 190-6s130-24 230 6"/><path d="M-10 200c80 10 150-30 220-10s120 30 200 10"/></g><path class="a-water" d="M-10 150c50-10 80 20 130 14s60-40 110-38 100 30 180 20"/><path class="a-road" d="M60 270c30-60 70-90 120-110s110-30 150-90"/><path class="a-trees" d="M300 190l8-16 8 16zM318 196l8-16 8 16zM282 200l8-16 8 16zM90 70l8-16 8 16zM108 76l8-16 8 16z"/><g transform="translate(206 92)"><path class="a-pin" d="M0 34S-16 18-16 6a16 16 0 0 1 32 0C16 18 0 34 0 34z"/>${crossInSvg(-4, -6, 8, 13.3, 'a-pin-cross')}</g>`
  }
};

export const ART_KINDS = Object.keys(ART);

export function art(kind, { className, label } = {}) {
  const a = ART[kind];
  if (!a) throw new Error(`Unknown art "${kind}"`);
  return raw(`<svg class="${cx('art', `art--${kind}`, className)}" viewBox="${a.vb}" ${label ? `role="img" aria-label="${String(label).replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'} focusable="false">${a.body}</svg>`);
}
