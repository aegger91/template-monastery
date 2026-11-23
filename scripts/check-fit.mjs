// Layout fit test at 360, 390, 768, 1280 and 1440 for every page and locale.
// Checks horizontal overflow, that the sticky header condenses on scroll, and
// that RTL pages do not flip icons or crosses (only .flip-rtl arrows).
//
// Needs the site served: npm run serve (or BASE_URL pointing at a live build).
import { launch, settle, BASE } from './browser.mjs';
import { loadContent } from '../src/lib/content.mjs';

const WIDTHS = [360, 390, 768, 1280, 1440];
const content = loadContent();
const pages = content.pages.filter((p) => p.id !== 'not-found');
const locales = content.site.locales.map((l) => l.code);
const errors = [];

const browser = await launch();
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

for (const width of WIDTHS) {
  await page.setViewport({ width, height: width < 768 ? 740 : 900, deviceScaleFactor: 1 });
  for (const code of locales) {
    for (const p of pages) {
      const url = `${BASE}/${code}/${p.slug ? `${p.slug}/` : ''}`;
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!res || !res.ok()) { errors.push(`${width} ${code}/${p.id}: HTTP ${res && res.status()}`); continue; }
      } catch (e) {
        errors.push(`${width} ${code}/${p.id}: ${e.message}`);
        continue;
      }
      await page.evaluate(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => setTimeout(r, 50));
        window.scrollTo(0, 0);
        await document.fonts.ready.catch(() => {});
      });
      const report = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const overflow = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
        const offenders = [];
        if (overflow > 1) {
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width > 2 && (r.right > doc.clientWidth + 1 || r.left < -1)) {
              const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
              offenders.push(tag);
              if (offenders.length >= 6) break;
            }
          }
        }
        const header = document.querySelector('[data-header]');
        let condensed = null;
        const tallEnough = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) > window.innerHeight + 80;
        if (header && tallEnough) {
          window.scrollTo(0, 0);
          window.scrollTo(0, 480);
          // core.js toggles .is-condensed on the next animation frame.
          condensed = false;
        }
        const flipped = [];
        const dir = doc.getAttribute('dir') || 'ltr';
        if (dir === 'rtl') {
          for (const el of document.querySelectorAll('svg, .cross, .icon, img, .kiot, .logo__mark')) {
            const t = getComputedStyle(el).transform;
            if (t && t !== 'none' && /matrix\(-1/.test(t) && !el.classList.contains('flip-rtl') && !el.closest('.flip-rtl')) {
              flipped.push(el.className || el.tagName);
              if (flipped.length >= 4) break;
            }
          }
        }
        return { overflow, offenders, condensed, flipped, dir };
      });
      if (report.overflow > 1) errors.push(`${width} ${code}/${p.id}: overflow ${report.overflow}px (${report.offenders.join(', ') || 'unknown'})`);
      if (report.condensed === false) {
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const ok = await page.evaluate(() => {
          const header = document.querySelector('[data-header]');
          return !header || header.classList.contains('is-condensed');
        });
        if (!ok) errors.push(`${width} ${code}/${p.id}: header did not condense on scroll`);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      if (report.flipped.length) errors.push(`${width} ${code}/${p.id}: mirrored icons/crosses in RTL: ${report.flipped.join(', ')}`);
    }
  }
  console.log(`Checked ${width}px (${locales.length} locales × ${pages.length} pages)`);
}

await browser.close();
if (errors.length) {
  console.error(`Fit check failed (${errors.length}):\n` + errors.map((e) => '  · ' + e).join('\n'));
  process.exit(1);
}
console.log(`Fit check passed at ${WIDTHS.join('/')} for ${locales.join(', ')}.`);
