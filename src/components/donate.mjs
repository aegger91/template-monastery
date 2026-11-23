// Donate: a plain page with a fund picker. Gifts go through the payments
// adapter. The optional "fund-progress" section shows a raised total only
// when a payment provider reports it (see integrations/fund-totals.mjs);
// it is switched off in content/layout.json by default.
import { html } from '../lib/html.mjs';
import { sectionHead, icon } from './primitives.mjs';
import { field, choices, contactFields, formShell } from './forms.mjs';

export function donateForm(p, ctx) {
  const { donate } = ctx.content;
  const id = p.id;
  const fundOptions = donate.funds.map((f, i) => ({ value: f.id, label: ctx.l(f.name), note: ctx.l(f.description), icon: f.icon, checked: i === 0 }));
  const needOptions = donate.needs.map((n) => ({ value: n.id, label: ctx.l(n.name), note: ctx.l(n.description), aside: ctx.money(n.amount), icon: 'hands', data: { 'data-amount': n.amount } }));
  return html`<div class="donate">
    ${formShell(ctx, {
      name: 'donation',
      id,
      className: 'form--card donate__form',
      submit: ctx.t('donate.continue'),
      aside: html`<p class="form__aside">${ctx.t('client.paymentNote')}</p>`,
      body: html`
        ${choices(ctx, { name: 'fund', legend: ctx.t('donate.fund'), required: true, className: 'choices--cards', options: fundOptions })}
        ${needOptions.length ? choices(ctx, { name: 'fund', legend: ctx.t('donate.needs'), hint: ctx.l(donate.needsIntro), className: 'choices--list', options: needOptions }) : ''}
        ${choices(ctx, { name: 'frequency', legend: ctx.t('donate.frequency'), className: 'choices--inline', options: [{ value: 'once', label: ctx.t('donate.once'), checked: true }, { value: 'monthly', label: ctx.t('donate.monthly') }] })}
        <fieldset class="amounts">
          <legend class="field__label">${ctx.t('donate.amount')}<span class="field__req" aria-hidden="true">*</span></legend>
          <div class="amounts__list">${donate.amounts.map((a, i) => html`<label class="amounts__chip"><input type="radio" name="amountPreset" value="${a}"${i === 1 ? ' checked' : ''}><span>${ctx.money(a)}</span></label>`)}</div>
          ${field(ctx, { id: `${id}--amount`, label: ctx.t('donate.otherAmount'), type: 'number', required: true, value: String(donate.amounts[1]), attrs: { min: 1, step: 1, inputmode: 'decimal' }, className: 'amounts__other' })}
        </fieldset>
        ${field(ctx, { id: `${id}--dedication`, label: ctx.t('donate.dedication'), hint: ctx.t('form.optional') })}
        ${contactFields(ctx, id, { phone: false })}`
    })}
    <aside class="donate__aside">
      ${sectionHead(p, ctx)}
      <div class="prose">${ctx.md(donate.otherWays)}</div>
    </aside>
  </div>`;
}

export function fundProgress(p, ctx) {
  const fund = ctx.content.donate.funds.find((f) => f.id === p.fund);
  return html`<div class="fund-progress" data-fund-progress data-fund="${p.fund}" data-goal="${fund?.goal || ''}" hidden>
    ${sectionHead(p, ctx)}
    <div class="fund-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${ctx.l(p.title)}"><span data-fund-fill></span></div>
    <p class="fund-progress__numbers"><strong data-fund-raised></strong> <span data-fund-goal></span> · <span data-fund-donors></span></p>
    <p class="fund-progress__updated">${icon('clock')}<span data-fund-updated></span></p>
  </div>`;
}

export const metas = { 'donate-form': {}, 'fund-progress': {} };
