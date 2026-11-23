// Visiting and pilgrimage: the guest house stay request and the request to
// speak with the spiritual father.
import { html, attrs, jsonScript } from '../lib/html.mjs';
import { sectionHead, icon } from './primitives.mjs';
import { field, choices, contactFields, formShell } from './forms.mjs';

export function stayRequest(p, ctx) {
  const id = p.id;
  const groups = p.groups.map((g, i) => ({ value: g.id, label: ctx.l(g.label), note: ctx.l(g.note), icon: g.icon, checked: i === 0 }));
  const rules = p.houses.map((h) => ({ id: h.id, accepts: h.accepts, maxNights: h.maxNights, maxGuests: h.maxGuests, name: ctx.l(h.name) }));
  return html`<div class="stay">
    <div class="stay__intro">
      ${sectionHead(p, ctx)}
      <h3 class="stay__subhead">${ctx.text(p.housesTitle)}</h3>
      <ul class="houses">${p.houses.map(
        (h) => html`<li class="houses__item" data-house="${h.id}">${icon('house')}<div><p class="houses__name">${ctx.text(h.name)}</p><p class="houses__note">${ctx.text(h.note)}</p></div></li>`
      )}</ul>
      <div class="prose stay__rules">${ctx.md(p.rules)}</div>
    </div>
    ${formShell(ctx, {
      name: 'stay',
      id,
      className: 'form--card',
      submit: ctx.t('visit.sendRequest'),
      aside: html`<p class="form__aside">${ctx.t('visit.replyNote')}</p>`,
      body: html`${jsonScript(`${id}-rules`, rules)}
        ${choices(ctx, { name: 'group', legend: ctx.t('visit.who'), options: groups, required: true, className: 'choices--cards' })}
        <p class="stay__house" data-stay-house aria-live="polite"></p>
        <div class="form__row">
          ${field(ctx, { id: `${id}--guests`, label: ctx.t('visit.guests'), type: 'number', required: true, value: '1', attrs: { min: 1, max: Math.max(...p.houses.map((h) => h.maxGuests)), inputmode: 'numeric' } })}
          ${field(ctx, { id: `${id}--arrival`, label: ctx.t('visit.arrival'), type: 'date', required: true })}
          ${field(ctx, { id: `${id}--departure`, label: ctx.t('visit.departure'), type: 'date', required: true })}
        </div>
        <p class="stay__nights" data-stay-nights aria-live="polite"></p>
        ${field(ctx, {
          id: `${id}--arrivalTime`,
          label: ctx.t('visit.arrivalTime'),
          type: 'select',
          required: true,
          hint: ctx.l(p.arrivalHint),
          options: [{ value: '', label: ctx.t('form.choose') }, ...p.arrivalWindows.map((w) => ({ value: w.id, label: ctx.l(w.label) }))]
        })}
        ${contactFields(ctx, id)}
        ${field(ctx, { id: `${id}--message`, label: ctx.t('visit.message'), type: 'textarea', hint: ctx.l(p.messageHint) })}
        ${choices(ctx, { name: 'agree', type: 'checkbox', legend: ctx.t('visit.guidelinesLegend'), required: true, options: [{ value: 'yes', label: ctx.l(p.agreeLabel) }] })}`
    })}
  </div>`;
}

export function confessionRequest(p, ctx) {
  const id = p.id;
  return html`<div class="split split--form">
    <div class="split__text">${sectionHead(p, ctx)}<div class="prose">${ctx.md(p.body)}</div></div>
    ${formShell(ctx, {
      name: 'spiritual-father',
      id,
      className: 'form--card',
      submit: ctx.t('visit.sendRequest'),
      body: html`${choices(ctx, { name: 'reason', legend: ctx.t('visit.reason'), required: true, options: p.reasons.map((r, i) => ({ value: r.id, label: ctx.l(r.label), checked: i === 0 })) })}
        ${contactFields(ctx, id)}
        <div class="form__row">
          ${field(ctx, { id: `${id}--date`, label: ctx.t('visit.preferredDate'), type: 'date', hint: ctx.t('form.optional') })}
          ${field(ctx, { id: `${id}--language`, label: ctx.t('visit.language'), type: 'select', options: ctx.site.locales.map((l) => ({ value: l.code, label: l.name, selected: l.code === ctx.locale })) })}
        </div>
        ${field(ctx, { id: `${id}--message`, label: ctx.t('visit.message'), type: 'textarea', hint: ctx.l(p.messageHint) })}`
    })}
  </div>`;
}

export const metas = { 'stay-request': {}, 'confession-request': {} };
export { attrs };
