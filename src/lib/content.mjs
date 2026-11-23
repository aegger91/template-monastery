// Loads every content file and applies content/layout.json (section order
// and on/off switches) to the pages.
//
// CONTENT_DIR and PUBLIC_DIR (env) point the build at another client's
// content folder and static files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CONTENT_DIR = path.resolve(ROOT, process.env.CONTENT_DIR || 'content');
export const PUBLIC_DIR = path.resolve(ROOT, process.env.PUBLIC_DIR || 'public');

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const contentFile = (name) => path.join(CONTENT_DIR, name);

// Pages live anywhere under content/pages/, one JSON file per page.
export function pageFiles(dir = path.join(CONTENT_DIR, 'pages')) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? pageFiles(path.join(dir, d.name)) : d.name.endsWith('.json') ? [path.join(dir, d.name)] : []))
    .sort();
}

export const CONTENT_FILES = ['site', 'navigation', 'layout', 'ui', 'services', 'menaion', 'shop', 'donate', 'news', 'gallery', 'image-sources'];

function applyLayout(page, layout) {
  const rule = layout.pages?.[page.id];
  if (!rule) return page;
  const byId = new Map(page.sections.map((s) => [s.id, s]));
  const ordered = (rule.order || []).map((id) => byId.get(id)).filter(Boolean);
  const rest = page.sections.filter((s) => !(rule.order || []).includes(s.id));
  const off = new Set(rule.disabled || []);
  return { ...page, sections: [...ordered, ...rest].filter((s) => !off.has(s.id)) };
}

export function loadContent() {
  const data = Object.fromEntries(CONTENT_FILES.map((n) => [n.replace(/-(\w)/g, (_, c) => c.toUpperCase()), readJson(contentFile(`${n}.json`))]));
  const oc = data.site.integrations?.orthodoxconnect || {};
  data.feed = oc.sampleFeed ? readJson(contentFile(oc.sampleFeed)) : { items: [] };
  data.pages = pageFiles().map((f) => applyLayout(readJson(f), data.layout));
  data.index = {
    pages: Object.fromEntries(data.pages.map((p) => [p.id, p])),
    products: Object.fromEntries(data.shop.products.map((p) => [p.id, p])),
    images: Object.fromEntries(data.imageSources.images.map((i) => [i.src, i]))
  };
  return data;
}
