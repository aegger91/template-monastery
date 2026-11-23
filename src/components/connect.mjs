// OrthodoxConnect: the feed of work days and pilgrimages, the app call to
// action, and the footer newsletter. Links are deep-link placeholders built
// from site.integrations.orthodoxconnect until the community is connected.
import { html, attrs } from '../lib/html.mjs';
import { interpolate } from '../lib/i18n.mjs';
import { sectionHead, icon, cross } from './primitives.mjs';

const ocLinks = (ctx, itemId = '') => {
  const oc = ctx.site.integrations.orthodoxconnect;
  const vars = { communityId: oc.communityId || 'sample-community', itemId };
  return { deep: interpolate(itemId ? oc.deepLink : oc.deepLinkHome, vars), web: oc.webLink ? interpolate(oc.webLink, vars) : '' };
};

function ocButton(ctx, label, itemId, style = 'secondary') {
  const { deep, web } = ocLinks(ctx, itemId);
  return html`<a class="btn btn--${style} btn--small"${attrs({ href: web || deep, 'data-oc-link': deep, 'data-oc-web': web || null })}><span>${label}</span>${icon('external', 'btn__icon btn__icon--end')}</a>`;
}

export function ocFeed(p, ctx) {
  const oc = ctx.site.integrations.orthodoxconnect;
  if (!oc.enabled) return '';
  const kinds = p.kinds || null;
  const items = ctx.content.feed.items.filter((i) => !kinds || kinds.includes(i.kind)).slice(0, p.limit || 99);
  const kindLabel = (k) => ctx.t(`connect.kind.${k}`);
  return html`${sectionHead(p, ctx)}
  ${ctx.content.feed.isSample ? html`<p class="sample-flag">${ctx.t('connect.sampleFeed')}</p>` : ''}
  <ul class="oc-feed" data-oc-feed>${items.map((item) => {
    const left = item.slots ? Math.max(0, item.slots.needed - item.slots.filled) : null;
    return html`<li class="oc-item oc-item--${item.kind} reveal" data-ends="${item.endsAt || item.startsAt}">
      <p class="oc-item__kind">${icon(item.kind === 'pilgrimage' ? 'pin' : item.kind === 'workday' ? 'hands' : 'calendar')}${kindLabel(item.kind)}</p>
      <h3 class="oc-item__title">${ctx.text(item.title)}</h3>
      <p class="oc-item__when">${icon('clock')}${ctx.formatDateTime(item.startsAt)}</p>
      ${item.location ? html`<p class="oc-item__where">${icon('pin')}${ctx.text(item.location)}</p>` : ''}
      <p class="oc-item__text">${ctx.text(item.summary)}</p>
      <div class="oc-item__foot">
        ${left !== null ? html`<span class="oc-item__slots">${left > 0 ? ctx.t('connect.spotsLeft', { n: left }) : ctx.t('connect.full')}</span>` : ''}
        ${ocButton(ctx, ctx.t('connect.signUp'), item.id)}
      </div>
    </li>`;
  })}</ul>
  ${p.actions ? html`<div class="actions">${p.actions.map((a) => html`<a class="btn btn--link" href="${ctx.href(a)}"><span>${ctx.text(a.label)}</span>${icon('arrow', 'btn__icon btn__icon--end flip-rtl')}</a>`)}</div>` : ''}`;
}

export function ocCta(p, ctx) {
  const oc = ctx.site.integrations.orthodoxconnect;
  if (!oc.enabled) return '';
  return html`<div class="oc-cta reveal">
    ${cross('oc-cta__cross')}
    <div class="oc-cta__text">${sectionHead(p, ctx)}<div class="prose">${ctx.md(p.body)}</div></div>
    <div class="oc-cta__actions">${ocButton(ctx, ctx.t('connect.open'), '', 'light')}<p class="oc-cta__note">${ctx.t('connect.placeholderNote')}</p></div>
  </div>`;
}

export function newsletterForm(ctx) {
  const oc = ctx.site.integrations.orthodoxconnect;
  if (!oc.enabled || !oc.newsletter) return '';
  return html`<div class="site-footer__col site-footer__newsletter">
    <h2 class="site-footer__title">${ctx.t('newsletter.title')}</h2>
    <p>${ctx.t('newsletter.text')}</p>
    <form class="newsletter" data-form="newsletter" novalidate>
      <label class="visually-hidden" for="newsletter-email">${ctx.t('form.email')}</label>
      <input id="newsletter-email" name="email" type="email" required autocomplete="email" placeholder="${ctx.t('newsletter.placeholder')}">
      <button type="submit" class="btn btn--light btn--small">${ctx.t('newsletter.join')}</button>
      <p class="field__error" data-error hidden></p>
      <div class="form__status" data-form-status tabindex="-1" hidden></div>
    </form>
    <p class="site-footer__fine">${ctx.t('newsletter.via')}</p>
  </div>`;
}

export const metas = { 'oc-feed': {}, 'oc-cta': {} };
