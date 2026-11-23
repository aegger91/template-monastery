// Desktop (1440) and mobile (390) screenshots of the key pages in every
// language. Needs the site served (npm run serve) at BASE_URL.
//
//   node scripts/screenshots.mjs [outDir] [--pages home,visit] [--locales en]
import fs from 'node:fs';
import path from 'node:path';
import { launch, settle, BASE } from './browser.mjs';
import { loadContent } from '../src/lib/content.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const OUT = path.resolve(args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) || '/opt/cursor/artifacts/screenshots');
const content = loadContent();
const KEY = ['home', 'monastery', 'services', 'visit', 'commemorations', 'shop', 'donate', 'get-involved', 'contact'];
const pages = (opt('--pages')?.split(',') || KEY).map((id) => content.index.pages[id]).filter(Boolean);
const locales = opt('--locales')?.split(',') || content.site.locales.map((l) => l.code);
const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await launch();
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('monastery-cart', JSON.stringify({ 'beeswax-tapers': 2, 'prayer-rope-50': 1 })); } catch (e) {}
});
for (const size of sizes) {
  await page.setViewport({ width: size.width, height: size.height, isMobile: !!size.isMobile, hasTouch: !!size.hasTouch, deviceScaleFactor: size.deviceScaleFactor || 1 });
  for (const code of locales) {
    for (const p of pages) {
      const url = `${BASE}/${code}/${p.slug ? `${p.slug}/` : ''}`;
      await page.goto(url, { waitUntil: 'networkidle0' });
      await settle(page);
      const file = path.join(OUT, `${p.id}-${code}-${size.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(path.relative(process.cwd(), file));
    }
  }
}
await browser.close();
