// Gallery (with a lightbox in site.js) and the news list.
import { html, attrs, cx } from '../lib/html.mjs';
import { sectionHead, image, actions, icon } from './primitives.mjs';

export function gallery(p, ctx) {
  const all = ctx.content.gallery.images;
  const list = (p.images ? p.images.map((src) => all.find((i) => i.src === src)).filter(Boolean) : all).slice(0, p.limit || 99);
  return html`${sectionHead(p, ctx)}
  <ul class="${cx('gallery', p.layout === 'strip' && 'gallery--strip')}" data-gallery>${list.map((img) => {
    const credit = ctx.credit(img.src);
    const caption = ctx.l(img.caption) || (credit ? ctx.l(credit.caption) : '');
    return html`<li class="gallery__item reveal"><a class="gallery__link" href="${ctx.asset(img.src)}" data-caption="${caption}">${image({ src: img.src, alt: img.alt || img.caption }, ctx, { className: 'gallery__img', sizes: '(min-width: 900px) 33vw, 50vw' })}<span class="gallery__caption">${caption}</span></a></li>`;
  })}</ul>
  ${actions(p.actions, ctx)}
  <dialog class="lightbox" data-lightbox aria-label="${ctx.t('gallery.viewer')}">
    <button type="button" class="lightbox__close" data-lightbox-close>${icon('close')}<span class="visually-hidden">${ctx.t('nav.close')}</span></button>
    <button type="button" class="lightbox__step lightbox__prev" data-lightbox-step="-1">${icon('chevron', 'icon')}<span class="visually-hidden">${ctx.t('gallery.prev')}</span></button>
    <figure class="lightbox__figure"><img data-lightbox-img alt=""><figcaption data-lightbox-caption></figcaption></figure>
    <button type="button" class="lightbox__step lightbox__next" data-lightbox-step="1">${icon('chevron', 'icon')}<span class="visually-hidden">${ctx.t('gallery.next')}</span></button>
  </dialog>`;
}

export function newsList(p, ctx) {
  const items = ctx.content.news.items.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, p.limit || 99);
  if (!items.length) return html`${sectionHead(p, ctx)}<p class="muted">${ctx.t('news.empty')}</p>`;
  return html`${sectionHead(p, ctx)}
  <ul class="${cx('news', p.full && 'news--full')}">${items.map(
    (n) => html`<li class="news__item reveal" id="${p.full ? n.id : null}">
      ${n.image ? html`<div class="news__media">${image(n.image, ctx, { className: 'news__img' })}</div>` : ''}
      <div class="news__body">
        <p class="news__date"><time datetime="${n.date}">${ctx.formatDate(n.date)}</time></p>
        <h3 class="news__title">${p.full ? ctx.text(n.title) : html`<a href="${ctx.pagePath('news', { anchor: n.id })}">${ctx.text(n.title)}</a>`}</h3>
        ${p.full ? html`<div class="prose">${ctx.md(n.body)}</div>` : html`<p class="news__summary">${ctx.text(n.summary)}</p>`}
      </div>
    </li>`
  )}</ul>${actions(p.actions, ctx)}`;
}

export const metas = { gallery: {}, 'news-list': {} };
export { attrs };
