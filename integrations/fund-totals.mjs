// Provider-agnostic fund totals. The optional fund-progress section calls an
// endpoint that returns { raised, donors, updatedAt }. Totals always come from
// the payment provider (sum of payments tagged with the fund id), never from
// hand-edited content.
//
// Providers: none | mock | stripe | authorizenet | tithely
//
export function createFundTotalsAdapter({ provider = 'none', endpoint = '' } = {}) {
  return {
    provider,
    async fetch(fundId) {
      if (!provider || provider === 'none') return null;
      if (provider === 'mock') {
        return { raised: 41250, donors: 186, updatedAt: '2026-01-01T12:00:00Z', sample: true };
      }
      if (!endpoint) return null;
      // TODO(stripe|authorizenet|tithely): GET endpoint with {fundId}, sum
      // payments tagged for that fund via webhook or API sync, answer
      // { raised, donors, updatedAt }.
      const url = endpoint.replace('{fundId}', encodeURIComponent(fundId));
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data?.raised !== 'number') return null;
      return data;
    }
  };
}
