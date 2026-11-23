// Commemoration requests (zapiski and sorokoust), laid out like the paper
// slips handed in at the candle desk, with a live preview of the slip.
import { html, jsonScript } from '../lib/html.mjs';
import { sectionHead, cross, art } from './primitives.mjs';
import { field, choices, contactFields, formShell } from './forms.mjs';

export function commemoration(p, ctx) {
  const id = p.id;
  const money = (n) => ctx.money(n);
  const config = {
    maxNames: p.maxNames,
    types: Object.fromEntries(p.slipTypes.map((t) => [t.id, { heading: ctx.l(t.heading) }])),
    offerings: Object.fromEntries(p.offerings.map((o) => [o.id, { amount: o.amount, label: ctx.l(o.label) }])),
    lights: Object.fromEntries(p.lights.map((o) => [o.id, { amount: o.amount, label: ctx.l(o.label) }]))
  };
  const nameInputs = Array.from({ length: p.maxNames }, (_, i) =>
    html`<li class="names__row"${i >= p.startNames ? ' hidden' : ''}><label class="visually-hidden" for="${id}--name-${i}">${ctx.t('commemoration.nameN', { n: i + 1 })}</label><input id="${id}--name-${i}" name="names" type="text" autocomplete="off" spellcheck="false" placeholder="${i === 0 ? ctx.l(p.namePlaceholder) : ''}" data-name-input></li>`
  );
  return html`${sectionHead(p, ctx)}
  <div class="commemoration">
    ${formShell(ctx, {
      name: 'commemoration',
      id,
      className: 'form--card commemoration__form',
      submit: ctx.t('commemoration.continue'),
      aside: html`<p class="form__aside">${ctx.t('client.paymentNote')}</p>`,
      body: html`${jsonScript(`${id}-config`, config)}
        ${choices(ctx, { name: 'slip', legend: ctx.t('commemoration.slipType'), required: true, className: 'choices--cards choices--two', options: p.slipTypes.map((t, i) => ({ value: t.id, label: ctx.l(t.label), note: ctx.l(t.note), checked: i === 0, className: `choice--${t.id}` })) })}
        ${choices(ctx, { name: 'offering', legend: ctx.t('commemoration.offering'), required: true, className: 'choices--list', options: p.offerings.map((o, i) => ({ value: o.id, label: ctx.l(o.label), note: ctx.l(o.note), aside: money(o.amount), checked: i === 0 })) })}
        <fieldset class="names">
          <legend class="field__label">${ctx.t('commemoration.names')}<span class="field__req" aria-hidden="true">*</span></legend>
          <p class="field__hint">${ctx.t('commemoration.namesHint', { max: p.maxNames })}</p>
          <ol class="names__list">${nameInputs}</ol>
          <button type="button" class="btn btn--quiet btn--small" data-add-name>${ctx.t('commemoration.addName')}</button>
          <p class="field__error" data-error hidden></p>
        </fieldset>
        ${choices(ctx, { name: 'light', legend: ctx.t('commemoration.light'), className: 'choices--list', hint: ctx.l(p.lightHint), options: p.lights.map((o, i) => ({ value: o.id, label: ctx.l(o.label), note: ctx.l(o.note), aside: o.amount ? money(o.amount) : '', checked: i === 0 })) })}
        ${contactFields(ctx, id, { phone: false })}
        <p class="commemoration__total" aria-live="polite">${ctx.t('commemoration.total')} <strong data-total>${money(p.offerings[0].amount)}</strong></p>`
    })}
    <aside class="commemoration__aside">
      <div class="slip slip--${p.slipTypes[0].id}" data-slip aria-label="${ctx.t('commemoration.preview')}">
        ${cross('slip__cross')}
        <p class="slip__heading" data-slip-heading>${ctx.text(p.slipTypes[0].heading)}</p>
        <ol class="slip__names" data-slip-names><li class="slip__empty">${ctx.t('commemoration.previewEmpty')}</li></ol>
        <p class="slip__offering" data-slip-offering>${ctx.text(p.offerings[0].label)}</p>
      </div>
      <div class="commemoration__guide">
        ${art('prosphora-seal', { className: 'commemoration__seal', label: ctx.l(p.sealAlt) })}
        <div class="prose">${ctx.md(p.guidance)}</div>
      </div>
    </aside>
  </div>`;
}

export const metas = { commemoration: {} };
