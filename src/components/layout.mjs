// Page shell: <head>, the sticky header, the mobile drawer and the footer.
import { html, raw, attrs, cx, jsonScript } from '../lib/html.mjs';
import { calendarData } from '../lib/context.mjs';
import { SPRITE, icon, cross, button } from './primitives.mjs';
import { logo } from './logo.mjs';
import { renderSection } from './registry.mjs';
import { newsletterForm } from './connect.mjs';

const linkFor = (item, ctx) => ctx.href(item);
const isCurrent = (item, ctx) => item.page && item.page === ctx.page.id && !item.anchor;
const inSection = (item, ctx) => isCurrent(item, ctx) || (item.children || []).some((c) => c.page === ctx.page.id);

function navItem(item, ctx, i) {
  if (!item.children?.length) {
    return html`<li class="nav__item"><a class="nav__link"${attrs({ href: linkFor(item, ctx), 'aria-current': isCurrent(item, ctx) ? 'page' : null })}>${ctx.text(item.label)}</a></li>`;
  }
  const id = `nav-panel-${i}`;
  return html`<li class="${cx('nav__item', 'nav__item--parent', inSection(item, ctx) && 'is-active')}">
    <button type="button" class="nav__link nav__toggle" aria-expanded="false" aria-controls="${id}">${ctx.text(item.label)}${icon('chevron', 'icon nav__chevron')}</button>
    <div class="nav__panel" id="${id}">
      <ul class="nav__sub">${item.children.map(
        (c) => html`<li><a class="nav__sublink"${attrs({ href: linkFor(c, ctx), 'aria-current': isCurrent(c, ctx) ? 'page' : null })}><span>${ctx.text(c.label)}</span>${c.note ? html`<small>${ctx.text(c.note)}</small>` : ''}</a></li>`
      )}</ul>
    </div>
  </li>`;
}

function languageSwitch(ctx, place) {
  if (ctx.site.locales.length < 2) return '';
  const links = ctx.site.locales.map(
    (l) =>
      html`<li><a${attrs({ href: ctx.pagePath(ctx.page.id, { locale: l.code }), hreflang: l.code, lang: l.code, 'data-lang': l.code, 'aria-current': l.code === ctx.locale ? 'true' : null })}>${l.name}</a></li>`
  );
  if (place === 'drawer') return html`<ul class="lang-list" aria-label="${ctx.t('nav.language')}">${links}</ul>`;
  return html`<details class="lang">
    <summary class="lang__summary" aria-label="${ctx.t('nav.language')}">${icon('globe')}<span>${ctx.localeInfo.label}</span></summary>
    <ul class="lang__menu">${links}</ul>
  </details>`;
}

function cartLink(ctx) {
  if (!ctx.content.index.pages.cart) return '';
  return html`<a class="cart-link" href="${ctx.pagePath('cart')}" data-cart-link hidden>${icon('cart')}<span class="visually-hidden">${ctx.t('cart.title')}</span><span class="cart-link__count" data-cart-count>0</span></a>`;
}

function header(ctx) {
  const { header: nav } = ctx.content.navigation;
  return html`<header class="site-header" data-header>
    <div class="site-header__bar">
      ${logo(ctx)}
      <nav class="nav" aria-label="${ctx.t('nav.main')}">
        <ul class="nav__list">${nav.items.map((item, i) => navItem(item, ctx, i))}</ul>
      </nav>
      <div class="site-header__tools">
        ${languageSwitch(ctx)}
        ${cartLink(ctx)}
        ${nav.actions.map((a) => button(a, ctx, { className: 'site-header__action' }))}
        <button type="button" class="menu-button" aria-expanded="false" aria-controls="drawer" data-drawer-open>${icon('menu')}<span class="visually-hidden">${ctx.t('nav.openMenu')}</span></button>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    <div class="drawer__scrim" data-drawer-close></div>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="${ctx.t('nav.menu')}">
      <div class="drawer__head">
        ${logo(ctx, { place: 'drawer' })}
        <button type="button" class="drawer__close" data-drawer-close>${icon('close')}<span class="visually-hidden">${ctx.t('nav.closeMenu')}</span></button>
      </div>
      <nav aria-label="${ctx.t('nav.main')}">
        <ul class="drawer__list">${nav.items.map((item, i) =>
          item.children?.length
            ? html`<li class="drawer__group"><button type="button" class="drawer__toggle" aria-expanded="${inSection(item, ctx)}" aria-controls="drawer-group-${i}">${ctx.text(item.label)}${icon('chevron', 'icon nav__chevron')}</button>
                <ul class="drawer__sub" id="drawer-group-${i}"${attrs({ hidden: !inSection(item, ctx) })}>${item.children.map((c) => html`<li><a${attrs({ href: linkFor(c, ctx), 'aria-current': isCurrent(c, ctx) ? 'page' : null })}>${ctx.text(c.label)}</a></li>`)}</ul></li>`
            : html`<li><a class="drawer__link"${attrs({ href: linkFor(item, ctx), 'aria-current': isCurrent(item, ctx) ? 'page' : null })}>${ctx.text(item.label)}</a></li>`
        )}</ul>
      </nav>
      <div class="drawer__foot">
        ${nav.actions.map((a) => button(a, ctx, { className: 'btn--block' }))}
        ${languageSwitch(ctx, 'drawer')}
      </div>
    </div>
  </div>`;
}

function footer(ctx) {
  const { footer: f } = ctx.content.navigation;
  const { contact } = ctx.site;
  return html`<footer class="site-footer">
    <div class="container site-footer__grid" style="--footer-cols:${f.columns.length}">
      <div class="site-footer__about">
        ${logo(ctx, { place: 'footer' })}
        <p>${ctx.text(f.about)}</p>
        <address class="site-footer__contact">
          <span>${icon('pin')}${ctx.text(contact.address)}</span>
          ${contact.phone ? html`<a href="tel:${contact.phone.e164}">${icon('phone')}${contact.phone.display}</a>` : ''}
          ${contact.email ? html`<a href="mailto:${contact.email}">${icon('mail')}${contact.email}</a>` : ''}
        </address>
      </div>
      ${f.columns.map(
        (col) => html`<nav class="site-footer__col" aria-label="${ctx.l(col.title)}"><h2 class="site-footer__title">${ctx.text(col.title)}</h2><ul>${col.links.map((l) => html`<li><a href="${ctx.href(l)}">${ctx.text(l.label)}</a></li>`)}</ul></nav>`
      )}
      ${newsletterForm(ctx)}
    </div>
    <div class="container site-footer__base">
      ${cross('site-footer__cross')}
      <p>${ctx.text(f.note)}</p>
      <p class="site-footer__links"><a href="${ctx.pagePath('image-sources')}">${ctx.t('footer.imageSources')}</a>${ctx.site.locales.map((l) =>
        l.code === ctx.locale ? '' : html` · <a href="${ctx.pagePath(ctx.page.id, { locale: l.code })}" hreflang="${l.code}" lang="${l.code}" data-lang="${l.code}">${l.name}</a>`
      )}</p>
    </div>
  </footer>`;
}

function clientData(ctx) {
  const { site, content } = ctx;
  const strings = {};
  for (const [key, value] of Object.entries(content.ui.strings)) if (/^(client|cart|form|commemoration)\./.test(key)) strings[key] = ctx.l(value);
  const oc = site.integrations.orthodoxconnect;
  return {
    locale: ctx.locale,
    currency: site.currency,
    pages: { cart: content.index.pages.cart ? ctx.pagePath('cart') : null, shop: content.index.pages.shop ? ctx.pagePath('shop') : null },
    forms: { endpoint: site.forms.endpoint || '' },
    payments: { provider: site.payments.provider, checkoutEndpoint: site.payments.checkoutEndpoint || '' },
    shipping: content.shop.shipping,
    orthodoxconnect: { enabled: !!oc.enabled, communityId: oc.communityId, deepLink: oc.deepLink, webLink: oc.webLink, newsletterEndpoint: oc.newsletterEndpoint || '' },
    fundTotals: site.integrations.fundTotals,
    products: Object.fromEntries(content.shop.products.map((p) => [p.id, { name: ctx.l(p.name), price: p.price, shipping: p.shipping !== false }])),
    calendar: calendarData(ctx),
    strings
  };
}

export function renderPage(ctx, assets) {
  const { site, page } = ctx;
  const title = page.id === 'home' ? ctx.l(site.seo.title) : `${ctx.l(page.title)} · ${ctx.l(site.shortName)}`;
  const description = ctx.l(page.description) || ctx.l(site.seo.description);
  const path = ctx.pagePath(page.id);
  const hasHero = page.sections[0]?.type === 'hero-today' || page.sections[0]?.type === 'page-header';
  const body = page.sections.map((s) => renderSection(s, ctx)).join('');
  const ogImage = site.seo.image ? ctx.absoluteUrl(ctx.asset(site.seo.image)) : null;

  return `<!doctype html>
${html`<html lang="${ctx.locale}" dir="${ctx.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${ctx.absoluteUrl(path)}">
${site.locales.map((l) => html`<link rel="alternate" hreflang="${l.code}" href="${ctx.absoluteUrl(ctx.pagePath(page.id, { locale: l.code }))}">\n`)}<link rel="alternate" hreflang="x-default" href="${ctx.absoluteUrl(ctx.pagePath(page.id, { locale: site.sourceLocale }))}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${ctx.absoluteUrl(path)}">
<meta property="og:locale" content="${ctx.localeInfo.ogLocale || ctx.locale}">
${ogImage ? html`<meta property="og:image" content="${ogImage}">` : ''}
${page.noindex || site.isSample ? raw('<meta name="robots" content="noindex">') : ''}
<meta name="theme-color" content="${site.themeColor}">
<link rel="icon" href="${ctx.asset('/favicon.svg')}" type="image/svg+xml">
${assets.preloadFonts.map((f) => html`<link rel="preload" href="${ctx.asset(f)}" as="font" type="font/woff2" crossorigin>\n`)}<link rel="stylesheet" href="${assets.cssHref}">
<script>document.documentElement.classList.add('js')</script>
</head>
<body class="${cx(`page-${page.id}`, hasHero && 'has-hero', page.sections[0]?.type === 'hero-today' && 'has-hero-photo')}">
<a class="skip-link" href="#main">${ctx.t('nav.skip')}</a>
${SPRITE}
${raw(header(ctx))}
<main id="main" tabindex="-1">${raw(body)}</main>
${raw(footer(ctx))}
<div class="toast" role="status" aria-live="polite" data-toast hidden></div>
${jsonScript('site-data', clientData(ctx))}
<script src="${assets.jsHref}" defer></script>
</body>
</html>`}
`;
}
