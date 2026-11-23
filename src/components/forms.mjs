// Form markup shared by every request form. Submission is handled by
// site.js: it posts JSON to site.forms.endpoint, or, with no endpoint set,
// shows a clearly marked sample confirmation.
import { html, attrs, cx } from '../lib/html.mjs';
import { icon } from './primitives.mjs';

export function field(ctx, { id, label, type = 'text', required = false, hint, options, attrs: extra = {}, className, value, rows }) {
  const req = required ? html`<span class="field__req" aria-hidden="true">*</span>` : '';
  const describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  const common = { id, name: extra.name || id.split('--').pop(), required, 'aria-describedby': describedBy, ...extra };
  let control;
  if (type === 'select') {
    control = html`<select${attrs(common)}>${options.map((o) => html`<option${attrs({ value: o.value, selected: o.selected })}>${o.label}</option>`)}</select>`;
  } else if (type === 'textarea') {
    control = html`<textarea${attrs({ ...common, rows: rows || 4 })}></textarea>`;
  } else {
    control = html`<input${attrs({ ...common, type, value })}>`;
  }
  return html`<div class="${cx('field', className)}">
    <label class="field__label" for="${id}">${label}${req}</label>
    ${control}
    ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
    <p class="field__error" id="${id}-error" data-error hidden></p>
  </div>`;
}

export function choices(ctx, { name, legend, type = 'radio', options, required = false, className, hint }) {
  return html`<fieldset class="${cx('choices', className)}">
    <legend class="field__label">${legend}${required ? html`<span class="field__req" aria-hidden="true">*</span>` : ''}</legend>
    ${hint ? html`<p class="field__hint">${hint}</p>` : ''}
    <div class="choices__list">${options.map(
      (o, i) => html`<label class="${cx('choice', o.className)}"${attrs(o.data || {})}><input${attrs({ type, name, value: o.value, checked: o.checked, required: required && type === 'radio' && i === 0 ? true : null })}><span class="choice__box">${o.icon ? icon(o.icon) : ''}<span class="choice__text"><span class="choice__label">${o.label}</span>${o.note ? html`<span class="choice__note">${o.note}</span>` : ''}</span>${o.aside ? html`<span class="choice__aside">${o.aside}</span>` : ''}</span></label>`
    )}</div>
    <p class="field__error" data-error hidden></p>
  </fieldset>`;
}

export function contactFields(ctx, prefix, { phone = true } = {}) {
  return html`<div class="form__row">
    ${field(ctx, { id: `${prefix}--name`, label: ctx.t('form.name'), required: true, attrs: { autocomplete: 'name' } })}
    ${field(ctx, { id: `${prefix}--email`, label: ctx.t('form.email'), type: 'email', required: true, attrs: { autocomplete: 'email' } })}
    ${phone ? field(ctx, { id: `${prefix}--phone`, label: ctx.t('form.phone'), type: 'tel', hint: ctx.t('form.optional'), attrs: { autocomplete: 'tel' } }) : ''}
  </div>`;
}

export function formShell(ctx, { name, id, body, submit, aside, className }) {
  return html`<form class="${cx('form', className)}" data-form="${name}" id="${id}-form" novalidate>
    ${body}
    <div class="form__foot">
      <button type="submit" class="btn btn--primary">${submit}</button>
      ${aside || ''}
    </div>
    <div class="form__status" data-form-status tabindex="-1" hidden></div>
  </form>`;
}
