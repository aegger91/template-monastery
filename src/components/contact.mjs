// Contact details, map and the contact form. With site.contact.mapEmbedUrl
// set (for example an OpenStreetMap embed URL) a live map is shown;
// otherwise a drawn placeholder map links to directions.
import { html } from '../lib/html.mjs';
import { sectionHead, icon, art } from './primitives.mjs';
import { field, contactFields, formShell } from './forms.mjs';

export function contactSection(p, ctx) {
  const { contact } = ctx.site;
  const id = p.id;
  return html`<div class="contact">
    <div class="contact__info">
      ${sectionHead(p, ctx)}
      <ul class="contact__list">
        <li>${icon('pin')}<span>${ctx.text(contact.address)}</span></li>
        ${contact.phone ? html`<li>${icon('phone')}<a href="tel:${contact.phone.e164}">${contact.phone.display}</a>${contact.phoneHours ? html`<small>${ctx.text(contact.phoneHours)}</small>` : ''}</li>` : ''}
        ${contact.email ? html`<li>${icon('mail')}<a href="mailto:${contact.email}">${contact.email}</a></li>` : ''}
      </ul>
      <div class="contact__map">
        ${contact.mapEmbedUrl
          ? html`<iframe src="${contact.mapEmbedUrl}" title="${ctx.t('contact.map')}" loading="lazy"></iframe>`
          : html`<a class="contact__map-art" href="${contact.directionsUrl}" target="_blank" rel="noopener">${art('map', { label: ctx.t('contact.map') })}<span class="contact__map-label">${ctx.t('contact.mapPlaceholder')}</span></a>`}
      </div>
      ${contact.directionsUrl ? html`<a class="btn btn--secondary" href="${contact.directionsUrl}" target="_blank" rel="noopener">${icon('pin', 'btn__icon')}<span>${ctx.t('visit.directions')}</span></a>` : ''}
    </div>
    ${formShell(ctx, {
      name: 'contact',
      id,
      className: 'form--card',
      submit: ctx.t('contact.send'),
      body: html`<h3 class="form__title">${ctx.text(p.formTitle)}</h3>
        ${contactFields(ctx, id)}
        ${field(ctx, { id: `${id}--subject`, label: ctx.t('contact.subject'), type: 'select', options: p.subjects.map((s) => ({ value: s.id, label: ctx.l(s.label) })) })}
        ${field(ctx, { id: `${id}--message`, label: ctx.t('visit.message'), type: 'textarea', required: true, rows: 5 })}`
    })}
  </div>`;
}

export const metas = { contact: {} };
