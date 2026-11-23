// Monastery shop: product grid with category filter, and the cart page with
// shipping or pickup. Checkout goes through the provider-agnostic payments
// adapter in site.js (see integrations/payments.mjs).
import { html, attrs, cx } from '../lib/html.mjs';
import { sectionHead, image, icon } from './primitives.mjs';
import { field, choices } from './forms.mjs';

export function productGrid(p, ctx) {
  const { shop } = ctx.content;
  const cats = shop.categories.filter((c) => shop.products.some((pr) => pr.category === c.id));
  return html`${sectionHead(p, ctx)}
  <div class="shop" data-shop>
    <div class="filters" role="group" aria-label="${ctx.t('shop.filter')}">
      <button type="button" class="filters__chip" aria-pressed="true" data-filter="all">${ctx.t('shop.all')}</button>
      ${cats.map((c) => html`<button type="button" class="filters__chip" aria-pressed="false" data-filter="${c.id}">${ctx.text(c.label)}</button>`)}
    </div>
    <ul class="products">${shop.products.map((pr) => {
      const cat = shop.categories.find((c) => c.id === pr.category);
      return html`<li class="product reveal" data-category="${pr.category}">
        <div class="product__media">${image(pr.image, ctx, { className: 'product__img' })}</div>
        <div class="product__body">
          <p class="product__cat">${ctx.text(cat.label)}</p>
          <h3 class="product__name">${ctx.text(pr.name)}</h3>
          <p class="product__text">${ctx.text(pr.description)}</p>
          <div class="product__foot">
            <span class="product__price">${ctx.money(pr.price, { cents: pr.price % 1 !== 0 })}</span>
            <button type="button" class="btn btn--secondary btn--small" data-add-to-cart="${pr.id}" data-added-label="${ctx.t('shop.added')}">${icon('plus', 'btn__icon')}<span>${ctx.t('shop.add')}</span></button>
          </div>
          ${pr.shipping === false ? html`<p class="product__note">${icon('house')}${ctx.t('shop.pickupOnly')}</p>` : ''}
        </div>
      </li>`;
    })}</ul>
    <a class="shop__cart-bar" href="${ctx.content.index.pages.cart ? ctx.pagePath('cart') : '#'}" data-cart-bar hidden>${icon('cart')}<span data-cart-summary></span><span class="shop__cart-go">${ctx.t('shop.viewCart')}${icon('arrow', 'icon flip-rtl')}</span></a>
  </div>`;
}

export function cart(p, ctx) {
  const { shipping } = ctx.content.shop;
  const id = p.id;
  return html`${sectionHead(p, ctx)}
  <div class="cart" data-cart>
    <div class="cart__empty" data-cart-empty>
      ${icon('cart', 'icon cart__empty-icon')}
      <p>${ctx.t('cart.empty')}</p>
      <a class="btn btn--secondary" href="${ctx.pagePath('shop')}">${ctx.t('cart.browse')}</a>
    </div>
    <form class="cart__form" data-cart-form novalidate hidden>
      <div class="cart__main">
        <ul class="cart__items" data-cart-items></ul>
        ${choices(ctx, {
          name: 'fulfillment',
          legend: ctx.t('cart.fulfillment'),
          required: true,
          className: 'choices--cards choices--two',
          options: [
            { value: 'shipping', label: ctx.t('cart.shipping'), note: ctx.l(shipping.note), icon: 'mail', checked: true },
            { value: 'pickup', label: ctx.t('cart.pickup'), note: ctx.l(shipping.pickupNote), icon: 'house' }
          ]
        })}
        <p class="cart__warning" data-pickup-only hidden>${icon('house')}${ctx.t('cart.pickupOnlyWarning')}</p>
        <div class="cart__address" data-address>
          <div class="form__row">
            ${field(ctx, { id: `${id}--name`, label: ctx.t('form.name'), required: true, attrs: { autocomplete: 'name' } })}
            ${field(ctx, { id: `${id}--email`, label: ctx.t('form.email'), type: 'email', required: true, attrs: { autocomplete: 'email' } })}
          </div>
          <div data-ship-fields>
            ${field(ctx, { id: `${id}--street`, label: ctx.t('cart.street'), required: true, attrs: { autocomplete: 'street-address', 'data-ship': '' } })}
            <div class="form__row">
              ${field(ctx, { id: `${id}--city`, label: ctx.t('cart.city'), required: true, attrs: { autocomplete: 'address-level2', 'data-ship': '' } })}
              ${field(ctx, { id: `${id}--region`, label: ctx.t('cart.region'), attrs: { autocomplete: 'address-level1' } })}
              ${field(ctx, { id: `${id}--postal`, label: ctx.t('cart.postal'), required: true, attrs: { autocomplete: 'postal-code', 'data-ship': '' } })}
            </div>
          </div>
        </div>
      </div>
      <aside class="cart__summary">
        <h3 class="cart__summary-title">${ctx.t('cart.summary')}</h3>
        <dl class="cart__totals">
          <div><dt>${ctx.t('cart.subtotal')}</dt><dd data-subtotal></dd></div>
          <div><dt>${ctx.t('cart.shippingCost')}</dt><dd data-shipping-cost></dd></div>
          <div class="cart__grand"><dt>${ctx.t('cart.total')}</dt><dd data-grand-total></dd></div>
        </dl>
        <p class="cart__free" data-free-note>${ctx.t('cart.freeOver', { amount: ctx.money(shipping.freeOver) })}</p>
        <button type="submit" class="btn btn--primary btn--block">${ctx.t('cart.checkout')}</button>
        <p class="form__aside">${ctx.t('client.paymentNote')}</p>
        <div class="form__status" data-form-status tabindex="-1" hidden></div>
      </aside>
    </form>
  </div>`;
}

export const metas = { 'product-grid': {}, cart: {} };
export { attrs, cx };
