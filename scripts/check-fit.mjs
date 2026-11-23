// Language-fit test: every page × every locale at 360, 768 and 1280.
// Flags page overflow, text that is clipped (scrollWidth/Height past the
// client box under a clipping overflow), overlapping visible text, and
// sticky-header jitter on scroll.
//
// Needs the site served: npm run serve (or BASE_URL pointing at a live build).
import { launch, settle, BASE } from './browser.mjs';
import { loadContent } from '../src/lib/content.mjs';

const WIDTHS = [360, 768, 1280];
const content = loadContent();
const pages = content.pages.filter((p) => p.id !== 'not-found');
const locales = content.site.locales.map((l) => l.code);
const errors = [];
const counts = { pages: 0, overflow: 0, textClip: 0, overlap: 0, header: 0, pageOverflow: 0 };

const browser = await launch();
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

for (const width of WIDTHS) {
  await page.setViewport({ width, height: width < 768 ? 740 : 900, deviceScaleFactor: 1 });
  for (const code of locales) {
    for (const p of pages) {
      counts.pages += 1;
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
        await new Promise((r) => setTimeout(r, 40));
        window.scrollTo(0, 0);
        await document.fonts.ready.catch(() => {});
      });
      await settle(page);
      // Ensure language/details menus are closed so absolute panels do not pollute geometry.
      await page.evaluate(() => {
        document.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'));
        document.querySelectorAll('.nav__toggle[aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
      });

      const report = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const pageOverflow = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;

        const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'USE', 'DEFS', 'CLIPPATH', 'MASK', 'SYMBOL', 'BR', 'HR', 'IMG', 'VIDEO', 'IFRAME', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'UL', 'OL', 'NAV', 'HEADER', 'FOOTER', 'SECTION', 'MAIN', 'ARTICLE', 'FORM', 'FIELDSET', 'DIV', 'TABLE', 'TBODY', 'THEAD', 'TR']);
        const textClip = [];
        const overlap = [];
        const boxes = [];

        const tagOf = (el) => {
          const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          return el.tagName.toLowerCase() + cls;
        };

        const visible = (el) => {
          if (!el || el.closest('[hidden], .visually-hidden, .sprite')) return false;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
          // Closed <details> content is not shown.
          const details = el.closest('details');
          if (details && !details.open && !el.matches('summary') && !el.closest('summary')) return false;
          // Collapsed nav panels.
          const panel = el.closest('.nav__panel');
          if (panel) {
            const toggle = panel.parentElement && panel.parentElement.querySelector('.nav__toggle');
            if (toggle && toggle.getAttribute('aria-expanded') !== 'true') return false;
            if (getComputedStyle(panel).visibility === 'hidden' || Number(getComputedStyle(panel).opacity) === 0) return false;
          }
          const r = el.getBoundingClientRect();
          return r.width > 1 && r.height > 1;
        };

        const clips = (style) => {
          const ox = style.overflowX, oy = style.overflowY, o = style.overflow;
          return o === 'hidden' || o === 'clip' || o === 'scroll' || o === 'auto' ||
            ox === 'hidden' || ox === 'clip' || ox === 'scroll' || ox === 'auto' ||
            oy === 'hidden' || oy === 'clip' || oy === 'scroll' || oy === 'auto' ||
            (style.webkitLineClamp && style.webkitLineClamp !== 'none');
        };

        for (const el of document.querySelectorAll('body *')) {
          if (SKIP_TAGS.has(el.tagName)) continue;
          if (!visible(el)) continue;
          const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
          if (!text) continue;
          // Prefer leaf text carriers.
          if ([...el.children].some((c) => (c.innerText || '').trim()) &&
              !['A', 'BUTTON', 'LABEL', 'SUMMARY', 'H1', 'H2', 'H3', 'H4', 'P', 'LI', 'SPAN', 'STRONG', 'EM', 'SMALL', 'TIME', 'FIGCAPTION', 'LEGEND', 'TD', 'TH'].includes(el.tagName)) {
            continue;
          }

          const style = getComputedStyle(el);
          const sw = el.scrollWidth - el.clientWidth;
          const sh = el.scrollHeight - el.clientHeight;
          const lh = parseFloat(style.lineHeight) || 0;
          const fs = parseFloat(style.fontSize) || 0;
          const nowrap = style.whiteSpace === 'nowrap' || style.whiteSpace === 'pre';
          const isClipping = clips(style);
          // Real clip: content exceeds the box AND overflow clips it, or nowrap overflows its box.
          const badW = sw > 1 && (isClipping || nowrap);
          const badH = sh > 1 && isClipping;
          // Descenders/letter-spacing vs tight line-height under uppercase.
          const tightLine = style.textTransform === 'uppercase' && lh && fs && lh + 0.01 < fs * 1.05 && isClipping;
          if (badW || badH || tightLine) {
            textClip.push({
              tag: tagOf(el),
              sw: Math.round(sw),
              sh: Math.round(sh),
              sample: text.slice(0, 48)
            });
          }

          const r = el.getBoundingClientRect();
          boxes.push({ el, tag: tagOf(el), r, sample: text.slice(0, 32), style });
        }

        for (let i = 0; i < boxes.length && overlap.length < 10; i++) {
          for (let j = i + 1; j < boxes.length && overlap.length < 10; j++) {
            const a = boxes[i], b = boxes[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            // Skip pairs that share a stacking context where one is a closed overlay.
            if (!visible(a.el) || !visible(b.el)) continue;
            const ar = a.r, br = b.r;
            const w = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
            const h = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
            // Require a meaningful intersection (not just adjacent line boxes).
            if (w > 6 && h > 6) {
              overlap.push(`${a.tag}×${b.tag}`);
            }
          }
        }

        return {
          pageOverflow,
          textClip: textClip.slice(0, 10),
          overlap: [...new Set(overlap)].slice(0, 6),
          headerReady: !!document.querySelector('[data-header]')
        };
      });

      if (report.pageOverflow > 1) {
        counts.pageOverflow += 1;
        errors.push(`${width} ${code}/${p.id}: page overflow ${report.pageOverflow}px`);
      }
      if (report.textClip.length) {
        counts.textClip += report.textClip.length;
        for (const t of report.textClip.slice(0, 4)) {
          errors.push(`${width} ${code}/${p.id}: text clip ${t.tag} sw=${t.sw} sh=${t.sh} "${t.sample}"`);
        }
      }
      if (report.overlap.length) {
        counts.overlap += report.overlap.length;
        errors.push(`${width} ${code}/${p.id}: overlap ${report.overlap.join(', ')}`);
      }

      if (report.headerReady) {
        const headerCheck = await page.evaluate(async () => {
          const header = document.querySelector('[data-header]');
          if (!header) return null;
          const tallEnough = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) > window.innerHeight + 80;
          if (!tallEnough) return { skip: true };

          async function settleAt(y) {
            window.scrollTo(0, y);
            // Wait for the scroll listener's rAF update and layout.
            for (let i = 0; i < 12; i++) {
              await new Promise((r) => requestAnimationFrame(r));
              await new Promise((r) => setTimeout(r, 16));
              if (Math.abs(window.scrollY - y) <= 1) break;
            }
            await new Promise((r) => setTimeout(r, 32));
            return {
              condensed: header.classList.contains('is-condensed'),
              h: Math.round(header.getBoundingClientRect().height)
            };
          }

          const at100 = await settleAt(100);
          const at108 = await settleAt(108);
          const atTop = await settleAt(0);
          return {
            condensed: at100.condensed,
            still: at108.condensed,
            hCond: at100.h,
            hStill: at108.h,
            expanded: !atTop.condensed
          };
        });
        if (headerCheck && !headerCheck.skip) {
          if (!headerCheck.condensed) {
            counts.header += 1;
            errors.push(`${width} ${code}/${p.id}: header did not condense on scroll`);
          } else if (!headerCheck.still || headerCheck.hCond !== headerCheck.hStill) {
            counts.header += 1;
            errors.push(`${width} ${code}/${p.id}: header jitter on scroll (height ${headerCheck.hCond}→${headerCheck.hStill}, condensed ${headerCheck.still})`);
          } else if (!headerCheck.expanded) {
            counts.header += 1;
            errors.push(`${width} ${code}/${p.id}: header did not expand at top`);
          }
        }
      }

      const flipped = await page.evaluate(() => {
        const doc = document.documentElement;
        if ((doc.getAttribute('dir') || 'ltr') !== 'rtl') return [];
        const out = [];
        for (const el of document.querySelectorAll('svg, .cross, .icon, img, .kiot, .logo__mark')) {
          const t = getComputedStyle(el).transform;
          if (t && t !== 'none' && /matrix\(-1/.test(t) && !el.classList.contains('flip-rtl') && !el.closest('.flip-rtl')) {
            out.push(el.className || el.tagName);
            if (out.length >= 4) break;
          }
        }
        return out;
      });
      if (flipped.length) errors.push(`${width} ${code}/${p.id}: mirrored icons/crosses in RTL: ${flipped.join(', ')}`);
    }
  }
  console.log(`Checked ${width}px (${locales.length} locales × ${pages.length} pages)`);
}

await browser.close();

const summary = `Fit counts: pages=${counts.pages} pageOverflow=${counts.pageOverflow} textClip=${counts.textClip} overlap=${counts.overlap} header=${counts.header} errors=${errors.length}`;
if (errors.length) {
  console.error(`Fit check failed (${errors.length}):\n` + errors.map((e) => '  · ' + e).join('\n'));
  console.error(summary);
  process.exit(1);
}
console.log(`Fit check passed at ${WIDTHS.join('/')} for ${locales.join(', ')}.`);
console.log(summary);
