// A localized value is an object keyed by locale code:
//   { "en": "Vespers", "ru": "Вечерня", "el": "Εσπερινός" }
// Any key may be missing. Each field falls back on its own, through the
// locale's own "fallback" list (site.locales[].fallback) and then the
// source locale, so one untranslated field never blanks a page.

export function fallbackChain(locale, site) {
  const info = site.locales.find((l) => l.code === locale) || {};
  return [...new Set([locale, ...(info.fallback || []), site.sourceLocale])];
}

export function pickLocale(value, chain) {
  if (value === null || value === undefined) return { text: '', lang: null, fallback: false };
  if (typeof value === 'string' || typeof value === 'number') return { text: String(value), lang: null, fallback: false };
  if (typeof value === 'object' && !Array.isArray(value)) {
    for (let i = 0; i < chain.length; i++) {
      const v = value[chain[i]];
      if (typeof v === 'string' && v !== '') return { text: v, lang: chain[i], fallback: i > 0 };
    }
  }
  return { text: '', lang: null, fallback: false };
}

export function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}
