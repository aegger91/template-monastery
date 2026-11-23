// Orthodox imagery checks. Fail the build on Latin crosses, the U+2626 glyph,
// mirrored icons/crosses (anything other than .flip-rtl arrows), or a
// Slavic footrest whose left end is not higher.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../src/lib/content.mjs';
import { CROSSES } from '../src/components/primitives.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);
const GLYPH = '\u2626';
const SELF = fileURLToPath(import.meta.url);

function walkFiles(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(p, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

const files = walkFiles(ROOT, ['.mjs', '.js', '.css', '.json', '.html', '.svg', '.md']);
for (const file of files) {
  if (file === SELF) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(GLYPH)) fail(`${path.relative(ROOT, file)}: Orthodox cross glyph U+2626 is banned; use the SVG cross component`);
}

const slavic = CROSSES.slavic;
if (slavic.viewBox !== '0 0 24 40') fail(`Slavic cross viewBox should be "0 0 24 40", got "${slavic.viewBox}"`);
// Footrest: M4 22 l16 8 → left at (4,22), right at (20,30). Left y is smaller = higher on screen.
const foot = slavic.path.match(/M\s*([\d.]+)\s+([\d.]+)\s*l\s*([\d.]+)\s+([\d.]+)\s*v/);
if (!foot) fail('Slavic cross path is missing the slanted footrest segment');
else {
  const x1 = +foot[1], y1 = +foot[2], x2 = x1 + +foot[3], y2 = y1 + +foot[4];
  if (x1 >= x2) fail('Slavic footrest must run left to right');
  if (!(y1 < y2)) fail(`Slavic footrest left end must be higher (viewer left). Got left y=${y1}, right y=${y2}`);
}

const css = fs.readFileSync(path.join(ROOT, 'src/styles/base.css'), 'utf8');
if (!/\[dir=["']rtl["']\]\s*\.flip-rtl\s*\{\s*transform:\s*scaleX\(-1\)/.test(css.replace(/\s+/g, ' '))) {
  fail('RTL mirroring must be limited to .flip-rtl (arrows), never icons or crosses');
}
const mirrorRules = [...css.matchAll(/\[dir=["']rtl["']\][^{]*\{[^}]+\}/g)].map((m) => m[0]);
for (const rule of mirrorRules) {
  if (/scaleX\(-1\)/.test(rule) && !/\.flip-rtl/.test(rule)) fail(`Unexpected RTL mirror rule: ${rule.slice(0, 80)}`);
}

const primitives = fs.readFileSync(path.join(ROOT, 'src/components/primitives.mjs'), 'utf8');
if (!primitives.includes('CROSSES') || !primitives.includes('export const cross')) fail('Missing shared cross() helper in primitives.mjs');
if (/NI\s*KA|NIKA/.test(primitives) && !/IC XC/.test(primitives)) fail('Prosphora seal must read IC XC above and NI KA below');
if (!/IC[\s\S]*XC[\s\S]*NI[\s\S]*KA/.test(primitives)) fail('Prosphora seal (IC XC / NI KA) positions look wrong');

const dist = path.join(ROOT, 'dist');
if (fs.existsSync(dist)) {
  for (const file of walkFiles(dist, ['.html', '.js', '.css', '.svg'])) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes(GLYPH)) fail(`dist ${path.relative(dist, file)}: U+2626 glyph`);
  }
}

if (errors.length) {
  console.error(`Orthodox imagery check failed (${errors.length}):\n` + errors.map((e) => '  · ' + e).join('\n'));
  process.exit(1);
}
console.log('Orthodox imagery check passed.');
