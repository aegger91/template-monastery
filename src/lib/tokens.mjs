// theme/tokens.json -> CSS custom properties.
//
//   color.stone-50   -> --color-stone-50
//   semantic.accent  -> --accent        ("{color.beeswax-500}" becomes var(--color-beeswax-500))
//   font.display     -> --font-display
const UNPREFIXED = new Set(['semantic']);
const SKIP = new Set(['$schema', 'meta', 'fontFaces']);

const varName = (group, key) => (UNPREFIXED.has(group) ? `--${key}` : `--${group}-${key}`);

const resolve = (value) => String(value).replace(/\{([\w-]+)\.([\w-]+)\}/g, (_, g, k) => `var(${varName(g, k)})`);

export function tokensToCss(tokens) {
  const lines = [];
  for (const [group, values] of Object.entries(tokens)) {
    if (SKIP.has(group) || typeof values !== 'object') continue;
    for (const [key, value] of Object.entries(values)) lines.push(`  ${varName(group, key)}: ${resolve(value)};`);
  }
  return `:root {\n${lines.join('\n')}\n}\n`;
}

export function fontsToCss(tokens) {
  return (tokens.fontFaces || [])
    .map((f) =>
      [
        '@font-face {',
        `  font-family: "${f.family}";`,
        `  font-style: ${f.style || 'normal'};`,
        `  font-weight: ${f.weight || 400};`,
        '  font-display: swap;',
        `  src: url("${f.src}") format("woff2");`,
        f.unicodeRange ? `  unicode-range: ${f.unicodeRange};` : null,
        '}'
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');
}

export const preloadFonts = (tokens) => (tokens.fontFaces || []).filter((f) => f.preload).map((f) => f.src);
