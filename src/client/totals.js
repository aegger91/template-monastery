// Optional "fund-progress" section. The raised total always comes from the
// connected payment provider, never from content: the fund-totals endpoint
// (see integrations/fund-totals.mjs) sums payments tagged with the fund id
// and answers { raised, donors, updatedAt }.
//
// site.integrations.fundTotals.provider:
//   "none"                            the section stays hidden
//   "mock"                            clearly marked sample figures, for demos
//   "stripe" | "authorizenet" | "tithely"   GET endpoint (with {fundId})
// Any failure or an invalid answer keeps the section hidden.

var MOCK_TOTALS = { raised: 41250, donors: 186, updatedAt: '2026-01-01T12:00:00Z', sample: true };

function fundTotals(fundId) {
  var cfg = DATA.fundTotals || {};
  if (!cfg.provider || cfg.provider === 'none') return Promise.resolve(null);
  if (cfg.provider === 'mock') return Promise.resolve(MOCK_TOTALS);
  if (!cfg.endpoint) return Promise.resolve(null);
  return fetch(cfg.endpoint.replace('{fundId}', encodeURIComponent(fundId)), { headers: { Accept: 'application/json' } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .catch(function () { return null; });
}

$$('[data-fund-progress]').forEach(function (el) {
  var fund = el.getAttribute('data-fund');
  var goal = Number(el.getAttribute('data-goal')) || 0;
  fundTotals(fund).then(function (t) {
    if (!t || typeof t.raised !== 'number' || !isFinite(t.raised) || t.raised < 0) return;
    var pct = goal ? Math.min(100, Math.round((t.raised / goal) * 100)) : 0;
    $('[data-fund-raised]', el).textContent = str('client.fundRaised', { amount: money(t.raised) });
    $('[data-fund-goal]', el).textContent = goal ? str('client.fundGoal', { amount: money(goal) }) : '';
    $('[data-fund-donors]', el).textContent = typeof t.donors === 'number' ? str('client.fundDonors', { n: t.donors }) : '';
    var updated = t.updatedAt ? new Intl.DateTimeFormat(DATA.locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(t.updatedAt)) : '';
    $('[data-fund-updated]', el).textContent = (t.sample ? str('client.fundSample') + ' ' : '') + (updated ? str('client.fundUpdated', { date: updated }) : '');
    var bar = $('[role="progressbar"]', el);
    bar.hidden = !goal;
    bar.setAttribute('aria-valuenow', String(pct));
    el.hidden = false;
    requestAnimationFrame(function () { $('[data-fund-fill]', el).style.inlineSize = pct + '%'; });
  });
});
