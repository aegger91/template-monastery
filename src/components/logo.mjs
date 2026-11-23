// The site logo. site.logo.style picks one of four styles:
//   "kiot"      arched icon case (kiot) with the patron icon inside (default)
//   "seal"      circular seal with the cross and the name around the edge
//   "square"    the client's own square image (site.logo.src)
//   "wordmark"  the name set in the display face, no mark
// site.logo.icon is the patron icon shown inside the kiot (an image path);
// without it a drawn placeholder icon is used.
import { html, raw, attrs, cx, esc } from '../lib/html.mjs';
import { art, crossInSvg } from './primitives.mjs';

let uid = 0;

function kiotMark(ctx) {
  const id = `kiot-${++uid}`;
  const iconSrc = ctx.site.logo.icon;
  const inner = iconSrc
    ? `<image href="${esc(ctx.asset(iconSrc))}" x="12" y="21" width="40" height="55" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    : `<g clip-path="url(#${id})"><svg x="12" y="21" width="40" height="55" viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice">${String(art('patron-icon')).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g>`;
  return raw(`<svg class="logo__mark logo__mark--kiot" viewBox="0 0 64 86" aria-hidden="true" focusable="false">
<defs><clipPath id="${id}"><path d="M12 76V36c0-9 9-15 20-15s20 6 20 15v40z"/></clipPath></defs>
${crossInSvg(28.5, 0, 7, 11.7, 'logo__cross')}
<path class="logo__case" d="M6 80V35c0-12 11.5-20 26-20s26 8 26 20v45z"/>
${inner}
<path class="logo__frame" d="M6 80V35c0-12 11.5-20 26-20s26 8 26 20v45zM12 76V36c0-9 9-15 20-15s20 6 20 15v40z"/>
<path class="logo__ledge" d="M2 80h60v4H2z"/>
</svg>`);
}

function sealMark(ctx) {
  const id = `seal-${++uid}`;
  const text = ctx.l(ctx.site.shortName).toLocaleUpperCase(ctx.locale);
  return raw(`<svg class="logo__mark logo__mark--seal" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
<defs><path id="${id}" d="M32 32m-23 0a23 23 0 1 1 46 0a23 23 0 1 1-46 0"/></defs>
<circle class="logo__seal-bg" cx="32" cy="32" r="31"/>
<circle class="logo__frame" cx="32" cy="32" r="30"/><circle class="logo__frame" cx="32" cy="32" r="17"/>
<text class="logo__seal-text"><textPath href="#${id}" startOffset="50%" text-anchor="middle" textLength="140" lengthAdjust="spacingAndGlyphs">${esc(text)} ·</textPath></text>
${crossInSvg(26, 20, 12, 24, 'logo__cross')}
</svg>`);
}

export function logo(ctx, { place = 'header', withText = true } = {}) {
  const { logo: cfg } = ctx.site;
  const style = cfg.style || 'kiot';
  let mark = '';
  if (style === 'kiot') mark = kiotMark(ctx);
  else if (style === 'seal') mark = sealMark(ctx);
  else if (style === 'square' && cfg.src) {
    const size = ctx.imageSize(cfg.src) || {};
    mark = html`<img class="logo__mark logo__mark--square"${attrs({ src: ctx.asset(cfg.src), alt: '', width: size.width, height: size.height })}>`;
  }
  const name = ctx.text(ctx.site.name);
  return html`<a class="${cx('logo', `logo--${style}`, `logo--${place}`)}" href="${ctx.pagePath('home')}" aria-label="${ctx.t('nav.homeLabel', { name: ctx.l(ctx.site.name) })}">
    ${mark}
    ${withText || style === 'wordmark' ? html`<span class="logo__text"><span class="logo__name">${name}</span><span class="logo__place">${ctx.text(ctx.site.location)}</span></span>` : ''}
  </a>`;
}
