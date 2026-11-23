// Section registry: section "type" (content/pages/*.json) -> component.
// To add a section type, add it here and in schemas/page.schema.json.
import { html, attrs, cx } from '../lib/html.mjs';
import * as basic from './basic.mjs';
import * as monastery from './monastery.mjs';
import * as visit from './visit.mjs';
import * as commemoration from './commemoration.mjs';
import * as shop from './shop.mjs';
import * as donate from './donate.mjs';
import * as connect from './connect.mjs';
import * as media from './media.mjs';
import * as contact from './contact.mjs';

export const registry = {
  'page-header': basic.pageHeader,
  prose: basic.prose,
  split: basic.split,
  quote: basic.quote,
  'card-grid': basic.cardGrid,
  facts: basic.facts,
  notice: basic.notice,
  'link-list': basic.linkList,
  'cta-band': basic.ctaBand,
  sources: basic.sources,
  'hero-today': monastery.heroToday,
  today: monastery.today,
  person: monastery.person,
  patron: monastery.patron,
  'daily-cycle': monastery.dailyCycle,
  schedule: monastery.schedule,
  'feast-list': monastery.feastList,
  livestream: monastery.livestream,
  'visiting-hours': monastery.visitingHours,
  guidelines: visit.guidelines,
  'stay-request': visit.stayRequest,
  'confession-request': visit.confessionRequest,
  commemoration: commemoration.commemoration,
  'product-grid': shop.productGrid,
  cart: shop.cart,
  'donate-form': donate.donateForm,
  'fund-progress': donate.fundProgress,
  'oc-feed': connect.ocFeed,
  'oc-cta': connect.ocCta,
  gallery: media.gallery,
  'news-list': media.newsList,
  contact: contact.contactSection
};

const BARE = new Set(['page-header', 'hero-today']);

export function renderSection(section, ctx) {
  if (section.hidden || (section.locales && !section.locales.includes(ctx.locale))) return '';
  const render = registry[section.type];
  if (!render) throw new Error(`Unknown section type "${section.type}"`);
  const inner = render(section, ctx);
  if (BARE.has(section.type) || !String(inner).trim()) return inner;
  return html`<section${attrs({
    id: section.id,
    class: cx('section', `section--${section.type}`, `section--bg-${section.background || 'stone'}`, section.spacing && `section--space-${section.spacing}`),
    'data-section-type': section.type
  })}><div class="${cx('container', section.width && section.width !== 'default' && `container--${section.width}`)}">${inner}</div></section>`;
}
