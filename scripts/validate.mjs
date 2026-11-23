// Validates content/*.json before a build: JSON parse, optional JSON Schema,
// cross-references, and a ban on em dashes (—) in copy.
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ROOT, CONTENT_DIR, CONTENT_FILES, pageFiles, readJson, loadContent } from '../src/lib/content.mjs';
import { ART_KINDS, CROSSES } from '../src/components/primitives.mjs';
import { registry } from '../src/components/registry.mjs';

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
addFormats(ajv);
const errors = [];
const fail = (msg) => errors.push(msg);

function walk(value, visit, trail = '$') {
  visit(value, trail);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, visit, `${trail}[${i}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => walk(v, visit, `${trail}.${k}`));
}

function checkEmDash(file, data) {
  walk(data, (v, trail) => {
    if (typeof v === 'string' && v.includes('\u2014')) fail(`${file}${trail}: em dash (—) is not allowed`);
  });
}

function loadSchema(name) {
  const file = path.join(ROOT, 'schemas', name);
  if (!fs.existsSync(file)) return null;
  const schema = readJson(file);
  delete schema.$schema;
  return ajv.compile(schema);
}

for (const name of CONTENT_FILES) {
  const file = path.join(CONTENT_DIR, `${name}.json`);
  let data;
  try { data = readJson(file); } catch (e) { fail(`${name}.json: ${e.message}`); continue; }
  checkEmDash(name + '.json', data);
  const validate = loadSchema(`${name}.schema.json`);
  if (validate && !validate(data)) validate.errors.forEach((e) => fail(`${name}.json ${e.instancePath || '/'} ${e.message}`));
}

for (const file of pageFiles()) {
  const rel = path.relative(CONTENT_DIR, file);
  let data;
  try { data = readJson(file); } catch (e) { fail(`${rel}: ${e.message}`); continue; }
  checkEmDash(rel, data);
  const validate = loadSchema('page.schema.json');
  if (validate && !validate(data)) validate.errors.forEach((e) => fail(`${rel} ${e.instancePath || '/'} ${e.message}`));
  for (const s of data.sections || []) {
    if (!registry[s.type]) fail(`${rel}: unknown section type "${s.type}"`);
  }
}

const feedPath = path.join(CONTENT_DIR, 'integrations/orthodoxconnect.sample.json');
if (fs.existsSync(feedPath)) {
  const feed = readJson(feedPath);
  checkEmDash('integrations/orthodoxconnect.sample.json', feed);
  const validate = loadSchema('orthodoxconnect-feed.schema.json');
  if (validate && !validate(feed)) validate.errors.forEach((e) => fail(`orthodoxconnect.sample.json ${e.instancePath || '/'} ${e.message}`));
}

const content = loadContent();
const { site, shop, donate, navigation, pages, index } = content;
const localeCodes = new Set(site.locales.map((l) => l.code));
if (!localeCodes.has(site.sourceLocale)) fail('site.sourceLocale is not in locales');
if (!['kiot', 'seal', 'square', 'wordmark'].includes(site.logo?.style || 'kiot')) fail('site.logo.style must be kiot, seal, square or wordmark');

const pageIds = new Set(pages.map((p) => p.id));
const productIds = new Set(shop.products.map((p) => p.id));
const catIds = new Set(shop.categories.map((c) => c.id));
const fundIds = new Set(donate.funds.map((f) => f.id));

for (const p of shop.products) {
  if (!catIds.has(p.category)) fail(`shop: product ${p.id} has unknown category ${p.category}`);
  if (p.image?.art && !ART_KINDS.includes(p.image.art)) fail(`shop: product ${p.id} has unknown art ${p.image.art}`);
}
for (const n of donate.needs || []) if (!n.amount) fail(`donate: need ${n.id} needs an amount`);

function checkLink(link, where) {
  if (!link) return;
  if (link.page && !pageIds.has(link.page)) fail(`${where}: unknown page "${link.page}"`);
}

for (const item of navigation.header.items) {
  checkLink(item, 'nav');
  (item.children || []).forEach((c) => checkLink(c, 'nav'));
}
navigation.header.actions.forEach((a) => checkLink(a, 'nav.actions'));
navigation.footer.columns.forEach((col) => col.links.forEach((l) => checkLink(l, 'footer')));

for (const page of pages) {
  walk(page, (v, trail) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && v.page) checkLink(v, `${page.id}${trail}`);
  });
  for (const s of page.sections) {
    if (s.type === 'fund-progress' && s.fund && !fundIds.has(s.fund)) fail(`${page.id}: fund-progress unknown fund ${s.fund}`);
    if (s.type === 'daily-cycle') (s.services || []).forEach((id) => {
      if (!content.services.services[id]) fail(`${page.id}: unknown service ${id}`);
    });
  }
}

if (!index.pages.home) fail('missing home page');
if (!index.pages['not-found']) fail('missing not-found page');

// Slavic cross geometry: viewer's left end of the footrest must be higher.
const slavic = CROSSES.slavic.path;
if (!/M4 22l16 8/.test(slavic) && !/M\s*4\s+22\s*l\s*16\s+8/.test(slavic)) {
  // Accept either the known path or a path whose first footrest y is less than the right.
  const m = slavic.match(/M\s*([\d.]+)\s+([\d.]+)\s*l\s*([\d.]+)\s+([\d.]+)/g);
  // Soft check: path must include the slanted footrest segment from the known design.
  if (!slavic.includes('M4 22l16 8')) fail('Slavic cross path must keep the left end of the footrest higher (viewer left)');
}

if (errors.length) {
  console.error(`Validation failed (${errors.length}):\n` + errors.map((e) => '  · ' + e).join('\n'));
  process.exit(1);
}
console.log(`Validated ${CONTENT_FILES.length} content files and ${pages.length} pages.`);
