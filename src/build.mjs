// Static build: content/*.json + components -> dist/
//
//   node src/build.mjs
//
// Environment (all optional):
//   SITE_URL     absolute origin for canonical, hreflang and sitemap URLs (default: site.url)
//   BASE_PATH    serve from a sub-path, e.g. "/monastery" (default "")
//   OUT_DIR      output folder (default "dist")
//   CONTENT_DIR, PUBLIC_DIR   build another client's content and static files
//   BUILD_DATE   pretend "now" for the no-JavaScript fallback (ISO date)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadContent, readJson, ROOT, PUBLIC_DIR } from './lib/content.mjs';
import { createContext } from './lib/context.mjs';
import { renderPage } from './components/layout.mjs';
import { tokensToCss, fontsToCss, preloadFonts } from './lib/tokens.mjs';
import { CROSSES } from './components/primitives.mjs';

const OUT = path.resolve(ROOT, process.env.OUT_DIR || 'dist');
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');
const STYLES = ['base.css', 'layout.css', 'components.css', 'sections.css', 'forms.css'];
const CLIENT = ['core.js', 'today.js', 'forms.js', 'commemoration.js', 'cart.js', 'donate.js', 'payments.js', 'totals.js', 'connect.js', 'gallery.js'];

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);

function writeFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function buildAssets(site) {
  const tokens = readJson(path.join(ROOT, site.theme.tokens));
  const styles = STYLES.map((n) => fs.readFileSync(path.join(ROOT, 'src/styles', n), 'utf8'));
  const css = [`/* Generated from ${site.theme.tokens} */\n${fontsToCss(tokens)}\n\n${tokensToCss(tokens)}`, ...styles]
    .join('\n\n')
    .replace(/url\((["']?)\/(?!\/)/g, `url($1${BASE_PATH}/`);
  // The calendar module is shared with the build; inline it without "export".
  const calendar = fs.readFileSync(path.join(ROOT, 'src/lib/calendar.mjs'), 'utf8').replace(/^export /gm, '');
  const js = `(function () {\n'use strict';\n${calendar}\n${CLIENT.map((n) => `// ---- ${n}\n${fs.readFileSync(path.join(ROOT, 'src/client', n), 'utf8')}`).join('\n')}\n})();\n`;
  writeFile(path.join(OUT, 'assets/site.css'), css);
  writeFile(path.join(OUT, 'assets/site.js'), js);
  return {
    cssHref: `${BASE_PATH}/assets/site.css?v=${hash(css)}`,
    jsHref: `${BASE_PATH}/assets/site.js?v=${hash(js)}`,
    tokens,
    preloadFontsFor: (locale) => preloadFonts(tokens, locale)
  };
}

function favicon(site) {
  const c = CROSSES.slavic;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1f1e1c"/><path d="M14 58V27c0-9 8-15 18-15s18 6 18 15v31z" fill="none" stroke="#c8a24f" stroke-width="3"/><svg x="24" y="20" width="16" height="30" viewBox="${c.viewBox}"><path d="${c.path}" fill="#c8a24f"/></svg></svg>\n`;
}

function redirectPage(content, siteUrl) {
  const { site } = content;
  const codes = site.locales.map((l) => l.code);
  return `<!doctype html>
<html lang="${site.sourceLocale}">
<head>
<meta charset="utf-8">
<title>${site.name[site.sourceLocale]}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${siteUrl}${BASE_PATH}/${site.sourceLocale}/">
${site.locales.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${siteUrl}${BASE_PATH}/${l.code}/">`).join('\n')}
<script>
(function () {
  var codes = ${JSON.stringify(codes)}, pick = null;
  try { pick = localStorage.getItem('site-lang'); } catch (e) {}
  if (codes.indexOf(pick) < 0) {
    pick = null;
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length && !pick; i++) {
      var c = String(langs[i]).slice(0, 2).toLowerCase();
      if (codes.indexOf(c) >= 0) pick = c;
    }
  }
  location.replace(${JSON.stringify(BASE_PATH)} + '/' + (pick || ${JSON.stringify(site.sourceLocale)}) + '/');
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=${BASE_PATH}/${site.sourceLocale}/"></noscript>
</head>
<body><p>${site.locales.map((l) => `<a href="${BASE_PATH}/${l.code}/" hreflang="${l.code}">${l.name}</a>`).join(' · ')}</p></body>
</html>
`;
}

function sitemap(content, siteUrl) {
  const { site, pages } = content;
  const loc = (code, page) => `${siteUrl}${BASE_PATH}/${code}/${page.slug ? `${page.slug}/` : ''}`;
  const urls = pages
    .filter((p) => !p.noindex)
    .flatMap((page) =>
      site.locales.map(
        (l) => `  <url>\n    <loc>${loc(l.code, page)}</loc>\n${site.locales.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.code}" href="${loc(a.code, page)}"/>`).join('\n')}\n  </url>`
      )
    );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

export async function build() {
  const started = Date.now();
  const content = loadContent();
  const siteUrl = (process.env.SITE_URL || content.site.url).replace(/\/$/, '');

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(PUBLIC_DIR, OUT, { recursive: true });
  const assets = buildAssets(content.site);
  writeFile(path.join(OUT, 'favicon.svg'), favicon(content.site));

  let count = 0;
  for (const page of content.pages) {
    for (const { code } of content.site.locales) {
      const ctx = createContext({ content, locale: code, page, basePath: BASE_PATH, siteUrl });
      try {
        const pageAssets = { ...assets, preloadFonts: assets.preloadFontsFor(code) };
        writeFile(path.join(OUT, code, page.slug || '', 'index.html'), renderPage(ctx, pageAssets));
      } catch (err) {
        err.message = `[${code}/${page.id}] ${err.message}`;
        throw err;
      }
      count++;
    }
  }

  const notFound = content.index.pages['not-found'];
  if (notFound) fs.copyFileSync(path.join(OUT, content.site.sourceLocale, notFound.slug, 'index.html'), path.join(OUT, '404.html'));
  writeFile(path.join(OUT, 'index.html'), redirectPage(content, siteUrl));
  writeFile(path.join(OUT, 'sitemap.xml'), sitemap(content, siteUrl));
  writeFile(path.join(OUT, 'robots.txt'), content.site.isSample ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}${BASE_PATH}/sitemap.xml\n`);
  console.log(`Built ${count} pages (${content.site.locales.map((l) => l.code).join(', ')}) into ${path.relative(ROOT, OUT)}/ in ${Date.now() - started} ms`);
  return { content, out: OUT };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch((err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}
