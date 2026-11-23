// General-purpose sections: page header, prose, split, quote, cards, facts,
// notices, link lists and call-to-action bands.
import { html, attrs, cx } from '../lib/html.mjs';
import { sectionHead, actions, figure, image, icon, eyebrow, cross } from './primitives.mjs';

export function pageHeader(p, ctx) {
  return html`<section class="${cx('page-header', p.image && 'page-header--image')}" id="${p.id}" data-section-type="page-header">
    <div class="container page-header__inner">
      ${eyebrow(ctx.l(p.eyebrow))}
      <h1 class="page-header__title">${ctx.text(p.title || ctx.page.title)}</h1>
      ${p.lead ? html`<div class="page-header__lead">${ctx.md(p.lead)}</div>` : ''}
      ${actions(p.actions, ctx, 'page-header__actions')}
    </div>
    ${p.image ? html`<div class="page-header__media">${figure(p.image, ctx, { shape: 'band', priority: true, className: 'page-header__figure' })}</div>` : ''}
  </section>`;
}

export function prose(p, ctx) {
  return html`${sectionHead(p, ctx)}<div class="prose prose--body">${ctx.md(p.body)}</div>${actions(p.actions, ctx)}`;
}

export function split(p, ctx) {
  return html`<div class="${cx('split', `split--media-${p.imageSide || 'end'}`)}">
    <div class="split__text">${sectionHead(p, ctx)}<div class="prose">${ctx.md(p.body)}</div>${actions(p.actions, ctx)}</div>
    <div class="split__media reveal">${figure(p.image, ctx, { shape: p.imageShape || 'arch', sizes: '(min-width: 900px) 40vw, 100vw' })}</div>
  </div>`;
}

export function quote(p, ctx) {
  return html`<figure class="quote reveal">
    ${cross('quote__cross')}
    <blockquote class="quote__text">${ctx.text(p.text)}</blockquote>
    ${p.source ? html`<figcaption class="quote__source">${ctx.text(p.source)}</figcaption>` : ''}
  </figure>`;
}

export function cardGrid(p, ctx) {
  return html`${sectionHead(p, ctx)}<ul class="${cx('cards', `cards--${p.columns || 'auto'}`)}">${p.cards.map((c) => {
    const url = c.link ? ctx.href(c.link) : null;
    const inner = html`${c.image ? html`<div class="card__media">${image(c.image, ctx)}</div>` : ''}${c.icon ? html`<span class="card__icon">${icon(c.icon)}</span>` : ''}<h3 class="card__title">${ctx.text(c.title)}</h3><div class="card__text">${ctx.md(c.text)}</div>${c.link ? html`<span class="card__more">${ctx.text(c.link.label)}${icon('arrow', 'icon flip-rtl')}</span>` : ''}`;
    return html`<li class="card reveal">${url ? html`<a class="card__link" href="${url}">${inner}</a>` : html`<div class="card__link">${inner}</div>`}</li>`;
  })}</ul>`;
}

export function facts(p, ctx) {
  return html`${sectionHead(p, ctx)}<dl class="facts">${p.items.map((f) => html`<div class="facts__item reveal"><dt class="facts__value">${ctx.text(f.value)}</dt><dd class="facts__label">${ctx.text(f.label)}</dd></div>`)}</dl>`;
}

export function notice(p, ctx) {
  return html`<aside class="${cx('notice', `notice--${p.tone || 'quiet'}`)}">${icon(p.icon || 'bell', 'icon notice__icon')}<div>${p.title ? html`<h2 class="notice__title">${ctx.text(p.title)}</h2>` : ''}<div class="prose">${ctx.md(p.body)}</div></div></aside>`;
}

export function linkList(p, ctx) {
  return html`${sectionHead(p, ctx)}<ul class="link-list">${p.links.map((l) => html`<li><a href="${ctx.href(l)}"><span>${ctx.text(l.label)}</span>${icon('arrow', 'icon flip-rtl')}</a></li>`)}</ul>`;
}

export function ctaBand(p, ctx) {
  return html`<div class="${cx('cta-band', p.image && 'cta-band--image')}">
    ${p.image ? html`<div class="cta-band__media">${image(p.image, ctx)}</div>` : ''}
    <div class="cta-band__body reveal">${sectionHead(p, ctx, { align: 'center' })}${p.body ? html`<div class="prose">${ctx.md(p.body)}</div>` : ''}${actions(p.actions, ctx, 'actions--center')}</div>
  </div>`;
}

export function sources(p, ctx) {
  const list = ctx.content.imageSources;
  return html`${sectionHead(p, ctx)}<ol class="sources">${list.images.map(
    (s) => html`<li class="sources__item">
      ${image({ src: s.src, alt: s.caption }, ctx, { className: 'sources__thumb' })}
      <div><p class="sources__title">${ctx.text(s.caption)}</p>
      <p class="sources__meta">${s.author} · ${s.date} · ${s.license}</p>
      <p class="sources__meta"><a href="${s.sourceUrl}" target="_blank" rel="noopener">${ctx.t('sources.viewOnCommons')}</a></p></div>
    </li>`
  )}</ol><div class="prose sources__note">${ctx.md(list.note)}</div>`;
}

export const metas = {
  'page-header': { bare: true },
  prose: {},
  split: {},
  quote: {},
  'card-grid': {},
  facts: {},
  notice: {},
  'link-list': {},
  'cta-band': {},
  sources: {}
};

export { attrs };
