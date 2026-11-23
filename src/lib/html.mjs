// Tagged-template HTML: every interpolated value is escaped unless it was
// marked safe with raw(). Arrays are joined; null, undefined and false
// render as nothing.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const raw = (value) => (value instanceof SafeHtml ? value : new SafeHtml(String(value ?? '')));

const renderValue = (value) => {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (value instanceof SafeHtml) return value.value;
  return esc(value);
};

export function html(strings, ...values) {
  let out = '';
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i < values.length) out += renderValue(values[i]);
  });
  return new SafeHtml(out);
}

// attrs({ class: ['a', on && 'b'], hidden: true, href }) -> ' class="a b" hidden href="..."'
export function attrs(map) {
  const parts = [];
  for (const [key, value] of Object.entries(map)) {
    if (value === null || value === undefined || value === false) continue;
    if (value === true) {
      parts.push(key);
      continue;
    }
    const v = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
    if (v === '' && key !== 'alt' && key !== 'value') continue;
    parts.push(`${key}="${esc(v)}"`);
  }
  return raw(parts.length ? ' ' + parts.join(' ') : '');
}

export const cx = (...names) => names.flat().filter(Boolean).join(' ');

export const toString = (value) => renderValue(value);

// JSON for <script type="application/json">: "<" is escaped so the payload
// can never close the script element.
export const jsonScript = (id, data) =>
  raw(`<script type="application/json" id="${esc(id)}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
