// The render context handed to every component: the current locale,
// content, and helpers for text, links, markdown, money and images.
import { Marked } from 'marked';
import { esc, raw } from './html.mjs';
import { fallbackChain, pickLocale, interpolate } from './i18n.mjs';
import { imageSize } from './images.mjs';
import { PUBLIC_DIR } from './content.mjs';

const ASSET_PREFIXES = ['/assets/'];

export function createContext({ content, locale, page, basePath = '', siteUrl }) {
  const { site } = content;
  const chain = fallbackChain(locale, site);
  const localeInfo = site.locales.find((l) => l.code === locale);
  const ctx = { content, site, page, locale, localeInfo, dir: localeInfo.dir || 'ltr', basePath, siteUrl, chain };

  ctx.lx = (value) => pickLocale(value, chain);
  ctx.l = (value) => ctx.lx(value).text;

  ctx.t = (key, vars) => {
    const entry = content.ui.strings[key];
    if (!entry) throw new Error(`Missing UI string "${key}"`);
    return interpolate(ctx.l(entry), vars);
  };

  ctx.asset = (p) => (!p || /^(https?:|mailto:|tel:|data:|#)/.test(p) ? p : `${basePath}${p.startsWith('/') ? p : `/${p}`}`);

  ctx.pagePath = (pageId, { anchor, locale: loc = locale } = {}) => {
    const target = content.index.pages[pageId];
    if (!target) throw new Error(`Unknown page id "${pageId}" (linked from page "${page?.id}")`);
    return `${basePath}/${loc}/${target.slug ? `${target.slug}/` : ''}${anchor ? `#${anchor}` : ''}`;
  };

  // Root-relative links typed by editors ("/visit/#stay") get the locale.
  ctx.localizePath = (href) => {
    if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
    if (ASSET_PREFIXES.some((p) => href.startsWith(p))) return ctx.asset(href);
    if (site.locales.some((l) => href === `/${l.code}` || href.startsWith(`/${l.code}/`))) return `${basePath}${href}`;
    return `${basePath}/${locale}${href}`;
  };

  // Link: { page, anchor } | { href } | { email } | { phone } | { anchor }
  ctx.href = (link) => {
    if (!link) return null;
    if (link.page) return ctx.pagePath(link.page, { anchor: link.anchor });
    if (link.email) return `mailto:${link.email}`;
    if (link.phone) return `tel:${link.phone}`;
    if (link.anchor && !link.href) return `#${link.anchor}`;
    return ctx.localizePath(ctx.l(link.href));
  };

  ctx.isExternal = (url) => typeof url === 'string' && /^https?:\/\//.test(url);

  ctx.money = (amount, { cents = false } = {}) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: site.currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(amount);

  ctx.formatDate = (iso, opts = { year: 'numeric', month: 'long', day: 'numeric' }) => {
    const s = new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
    return s.charAt(0).toLocaleUpperCase() + s.slice(1);
  };

  ctx.formatDateTime = (isoString) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: localeInfo.timeFormat === '12h', timeZone: site.timezone }).format(new Date(isoString));

  ctx.imageSize = (src) => imageSize(PUBLIC_DIR, src);
  ctx.credit = (src) => content.index.images[src];

  const marked = new Marked({
    gfm: true,
    renderer: {
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const url = ctx.localizePath(href);
        const external = ctx.isExternal(url);
        return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      }
    }
  });

  // Markdown in a localized value. Text that fell back to another language
  // is wrapped in that language's lang attribute.
  ctx.md = (value, { inline = false } = {}) => {
    const picked = typeof value === 'string' ? { text: value, fallback: false } : ctx.lx(value);
    if (!picked.text) return raw('');
    const out = inline ? marked.parseInline(picked.text) : marked.parse(picked.text);
    if (picked.fallback && picked.lang !== locale) return raw(inline ? `<span lang="${picked.lang}">${out}</span>` : `<div lang="${picked.lang}">${out}</div>`);
    return raw(out);
  };

  // Plain text with a lang attribute when it fell back.
  ctx.text = (value) => {
    const picked = ctx.lx(value);
    return picked.fallback && picked.lang !== locale ? raw(`<span lang="${picked.lang}">${esc(picked.text)}</span>`) : picked.text;
  };

  ctx.absoluteUrl = (p) => `${siteUrl.replace(/\/$/, '')}${p}`;

  return ctx;
}

// Data for the shared calendar module (src/lib/calendar.mjs), localized.
export function calendarData(ctx) {
  const { services, menaion } = ctx.content;
  const loc = (list) => (list || []).map((s) => ({ service: s.service, time: s.time, ...(s.note ? { note: ctx.l(s.note) } : {}) }));
  const strings = {};
  for (const key of ['churchDate', 'next', 'noServices', 'closedToday', 'range', 'noCommemoration', 'fullCalendar', 'commemorated', 'servicesToday', 'visitingToday', 'noFeasts', 'eve', 'feastDay']) {
    strings[key] = ctx.t(`calendar.${key}`);
  }
  return {
    tz: ctx.site.timezone,
    style: services.calendar.style,
    locale: ctx.locale,
    hour12: ctx.localeInfo.timeFormat === '12h',
    weekStart: ctx.localeInfo.weekStart ?? 1,
    fullCalendarUrl: ctx.l(services.calendar.fullCalendarUrl),
    services: Object.fromEntries(Object.entries(services.services).map(([id, s]) => [id, ctx.l(s.name)])),
    week: Object.fromEntries(Object.entries(services.week).map(([d, list]) => [d, loc(list)])),
    feastPattern: { eve: loc(services.feastPattern.eve), day: loc(services.feastPattern.day) },
    feasts: services.feasts.map((f) => ({
      id: f.id,
      ...(f.date ? { date: f.date } : { offset: f.fromPascha }),
      rank: f.rank,
      name: ctx.l(f.name),
      ...(f.short ? { short: ctx.l(f.short) } : {}),
      ...(f.eve ? { eve: loc(f.eve) } : {}),
      ...(f.services ? { services: loc(f.services) } : {}),
      ...(f.replaceDay ? { replaceDay: true } : {})
    })),
    menaion: Object.fromEntries(Object.entries(menaion.days).map(([k, v]) => [k, ctx.l(v)])),
    visiting: ctx.site.visiting.hours,
    s: strings
  };
}
