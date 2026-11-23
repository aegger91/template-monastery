// Shop cart, kept in localStorage. Shipping or pickup, then checkout
// through the payments adapter (payments.js).

var CART_KEY = 'monastery-cart';

function cartRead() {
  var raw = store.get(CART_KEY, {});
  var out = {};
  Object.keys(raw || {}).forEach(function (id) {
    var q = Math.floor(Number(raw[id]));
    if (DATA.products && DATA.products[id] && q > 0) out[id] = Math.min(q, 99);
  });
  return out;
}
function cartWrite(cart) { store.set(CART_KEY, cart); cartBadges(); }
function cartCount(cart) { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
function cartSubtotal(cart) { return Object.keys(cart).reduce(function (s, id) { return s + DATA.products[id].price * cart[id]; }, 0); }
function cartLines(cart) {
  return Object.keys(cart).map(function (id) { var p = DATA.products[id]; return { id: id, name: p.name, quantity: cart[id], amount: p.price, shipping: p.shipping }; });
}

function cartBadges() {
  var cart = cartRead();
  var n = cartCount(cart);
  $$('[data-cart-link]').forEach(function (a) { a.hidden = n === 0; });
  $$('[data-cart-count]').forEach(function (c) { c.textContent = n; });
  $$('[data-cart-bar]').forEach(function (bar) {
    bar.hidden = n === 0;
    var s = $('[data-cart-summary]', bar);
    if (s) s.textContent = str('cart.barSummary', { n: n, total: money(cartSubtotal(cart)) });
  });
}
cartBadges();
window.addEventListener('storage', function (e) { if (e.key === CART_KEY) cartBadges(); });

// ---- product grid ---------------------------------------------------------

$$('[data-shop]').forEach(function (shop) {
  var chips = $$('[data-filter]', shop);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      $$('.product', shop).forEach(function (p) {
        var match = f === 'all' || p.getAttribute('data-category') === f;
        p.classList.toggle('is-filtered', !match);
        if (match) p.classList.add('is-visible');
      });
    });
  });
  $$('[data-add-to-cart]', shop).forEach(function (btn) {
    var label = $('span', btn);
    var original = label.textContent;
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-add-to-cart');
      var cart = cartRead();
      cart[id] = Math.min((cart[id] || 0) + 1, 99);
      cartWrite(cart);
      label.textContent = btn.getAttribute('data-added-label');
      btn.classList.add('is-added');
      setTimeout(function () { label.textContent = original; btn.classList.remove('is-added'); }, 1800);
      toast(str('cart.addedToast', { name: DATA.products[id].name }));
    });
  });
});

// ---- cart page ------------------------------------------------------------

(function cartPage() {
  var root = $('[data-cart]');
  if (!root) return;
  var form = $('[data-cart-form]', root);
  var empty = $('[data-cart-empty]', root);
  var itemsEl = $('[data-cart-items]', root);
  var shipFields = $('[data-ship-fields]', form);
  var pickupOnly = $('[data-pickup-only]', form);
  var freeNote = $('[data-free-note]', form);
  var cfg = DATA.shipping || {};

  function fulfillment() { var el = form.querySelector('input[name="fulfillment"]:checked'); return el ? el.value : 'shipping'; }
  function shippingCost(cart, mode) {
    if (mode !== 'shipping') return 0;
    var sub = cartSubtotal(cart);
    if (cfg.freeOver && sub >= cfg.freeOver) return 0;
    return (cfg.flatRate || 0) + Math.max(0, cartCount(cart) - 1) * (cfg.perExtraItem || 0);
  }

  function render() {
    var cart = cartRead();
    var lines = cartLines(cart);
    empty.hidden = lines.length > 0;
    form.hidden = lines.length === 0;
    if (!lines.length) return;
    itemsEl.innerHTML = lines.map(function (l) {
      return '<li class="cart-item" data-id="' + escHtml(l.id) + '">' +
        '<p class="cart-item__name">' + escHtml(l.name) + (l.shipping ? '' : '<span class="cart-item__note">' + escHtml(str('cart.pickupOnlyItem')) + '</span>') + '</p>' +
        '<p class="cart-item__price">' + escHtml(money(l.amount * l.quantity)) + '</p>' +
        '<div class="cart-item__controls"><div class="qty">' +
        '<button type="button" data-qty="-1" aria-label="' + escHtml(str('cart.decrease', { name: l.name })) + '"><svg class="icon" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
        '<output aria-live="polite">' + l.quantity + '</output>' +
        '<button type="button" data-qty="1" aria-label="' + escHtml(str('cart.increase', { name: l.name })) + '"><svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
        '</div><button type="button" class="cart-item__remove" data-remove>' + escHtml(str('cart.remove')) + '</button></div></li>';
    }).join('');
    totals();
  }

  function totals() {
    var cart = cartRead();
    var lines = cartLines(cart);
    var hasPickupOnly = lines.some(function (l) { return !l.shipping; });
    var shipRadio = form.querySelector('input[name="fulfillment"][value="shipping"]');
    var pickRadio = form.querySelector('input[name="fulfillment"][value="pickup"]');
    if (hasPickupOnly && shipRadio.checked) { pickRadio.checked = true; }
    shipRadio.disabled = hasPickupOnly;
    shipRadio.closest('.choice').classList.toggle('is-disabled', hasPickupOnly);
    pickupOnly.hidden = !hasPickupOnly;
    var mode = fulfillment();
    shipFields.hidden = mode !== 'shipping';
    var sub = cartSubtotal(cart);
    var ship = shippingCost(cart, mode);
    $('[data-subtotal]', form).textContent = money(sub);
    $('[data-shipping-cost]', form).textContent = mode === 'shipping' ? (ship ? money(ship) : str('cart.free')) : str('cart.pickupFree');
    $('[data-grand-total]', form).textContent = money(sub + ship);
    freeNote.hidden = mode !== 'shipping' || !cfg.freeOver || sub >= cfg.freeOver;
  }

  itemsEl.addEventListener('click', function (e) {
    var li = e.target.closest('.cart-item');
    if (!li) return;
    var id = li.getAttribute('data-id');
    var cart = cartRead();
    var step = e.target.closest('[data-qty]');
    if (step) cart[id] = Math.max(0, Math.min(99, (cart[id] || 0) + Number(step.getAttribute('data-qty'))));
    else if (e.target.closest('[data-remove]')) cart[id] = 0;
    else return;
    if (!cart[id]) delete cart[id];
    cartWrite(cart);
    render();
    var again = $('.cart-item[data-id="' + id + '"] [data-qty="' + (step ? step.getAttribute('data-qty') : '1') + '"]', itemsEl);
    if (again) again.focus();
    else if (!form.hidden) form.querySelector('input').focus();
  });
  form.addEventListener('change', totals);
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) render(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm(form, 'cart')) return;
    var values = formValues(form);
    var cart = cartRead();
    var mode = fulfillment();
    var ship = shippingCost(cart, mode);
    var lines = cartLines(cart).map(function (l) { return { id: l.id, name: l.name, quantity: l.quantity, amount: l.amount }; });
    if (ship) lines.push({ id: 'shipping', name: str('cart.shippingCost'), quantity: 1, amount: ship });
    startCheckout(form, {
      kind: 'order',
      fund: 'shop',
      lines: lines,
      total: cartSubtotal(cart) + ship,
      customer: { name: values.name, email: values.email },
      details: { fulfillment: mode, address: mode === 'shipping' ? { street: values.street, city: values.city, region: values.region, postal: values.postal } : null }
    });
  });

  render();
})();
