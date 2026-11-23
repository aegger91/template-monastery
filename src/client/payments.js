// Provider-agnostic checkout for the shop, commemorations and gifts.
//
// site.payments.provider:
//   "none"         no provider yet: a sample confirmation, no payment taken
//   "stripe"       POST the order to checkoutEndpoint, which creates a Stripe
//                  Checkout Session and answers { url }; the visitor is sent there
//   "authorizenet" POST the order to checkoutEndpoint, which calls
//                  getHostedPaymentPageRequest and answers { token, formUrl }
//
// The server side for both is stubbed in integrations/payments.mjs. Every
// order carries "fund" so payments can be summed per fund later
// (integrations/fund-totals.mjs).

function startCheckout(form, order) {
  var cfg = DATA.payments || { provider: 'none' };
  order.currency = DATA.currency;
  order.locale = DATA.locale;
  order.returnUrl = location.href.split('#')[0];

  if (!cfg.provider || cfg.provider === 'none' || !cfg.checkoutEndpoint) {
    showStatus(form, {
      title: str('client.checkoutSampleTitle'),
      text: str('client.checkoutSampleText', { total: money(order.total) }),
      items: order.lines.map(function (l) { return (l.quantity > 1 ? l.quantity + ' × ' : '') + l.name + ': ' + money(l.amount * l.quantity); })
    });
    form.classList.add('is-sent');
    return;
  }

  var button = $('[type="submit"]', form);
  if (button) button.disabled = true;
  showStatus(form, { text: str('client.checkoutStarting'), focus: false, scroll: false });

  fetch(cfg.checkoutEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ provider: cfg.provider, order: order })
  })
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(function (session) {
      if (cfg.provider === 'stripe' && session.url) {
        location.assign(session.url);
        return;
      }
      if (cfg.provider === 'authorizenet' && session.token) {
        // Authorize.net Accept Hosted expects a form POST carrying the token.
        var f = document.createElement('form');
        f.method = 'POST';
        f.action = session.formUrl || 'https://accept.authorize.net/payment/payment';
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token';
        input.value = session.token;
        f.appendChild(input);
        document.body.appendChild(f);
        f.submit();
        return;
      }
      throw new Error('Unexpected checkout response');
    })
    .catch(function () {
      showStatus(form, { error: true, title: str('form.failedTitle'), text: str('client.checkoutFailed') });
      if (button) button.disabled = false;
    });
}
