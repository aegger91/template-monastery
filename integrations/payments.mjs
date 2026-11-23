// Server-side checkout stubs for Stripe and Authorize.net. The browser posts
// the order to site.payments.checkoutEndpoint; that handler should create a
// hosted session and return the shape below. Every order carries "fund" so
// payments can be summed per fund later (see fund-totals.mjs).
//
// Stripe response:       { url }
// Authorize.net response:{ token, formUrl }
//
export async function createCheckoutSession({ provider, order /*, secrets */ }) {
  if (!provider || provider === 'none') {
    return { sample: true, total: order.total, fund: order.fund };
  }
  if (provider === 'stripe') {
    // TODO: stripe.checkout.sessions.create({ mode, line_items, success_url,
    // cancel_url, metadata: { fund: order.fund, kind: order.kind } })
    // return { url: session.url };
    throw new Error('Stripe checkout is not wired yet. Set payments.provider to "none" for the sample site.');
  }
  if (provider === 'authorizenet') {
    // TODO: getHostedPaymentPageRequest with order total and fund metadata.
    // return { token, formUrl: 'https://accept.authorize.net/payment/payment' };
    throw new Error('Authorize.net checkout is not wired yet. Set payments.provider to "none" for the sample site.');
  }
  throw new Error(`Unknown payments provider "${provider}"`);
}
