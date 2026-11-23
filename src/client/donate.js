// Donate: fund picker, preset amounts and the amount field. Picking a
// sponsor-a-need item fills in its amount.

$$('form[data-form="donation"]').forEach(function (form) {
  var amount = form.elements.amount;
  var presets = $$('input[name="amountPreset"]', form);

  function syncPresets() {
    var v = Number(amount.value);
    presets.forEach(function (p) { p.checked = Number(p.value) === v; });
  }
  presets.forEach(function (p) {
    p.addEventListener('change', function () { if (p.checked) { amount.value = p.value; amount.dispatchEvent(new Event('input', { bubbles: true })); } });
  });
  amount.addEventListener('input', syncPresets);
  $$('input[name="fund"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      var label = r.closest('[data-amount]');
      if (r.checked && label) { amount.value = label.getAttribute('data-amount'); syncPresets(); }
    });
  });

  FORM_HANDLERS.donation = function (f, values) {
    var chosen = form.querySelector('input[name="fund"]:checked');
    var fundName = chosen ? $('.choice__label', chosen.closest('.choice')).textContent : values.fund;
    var total = Math.round(Number(values.amount) * 100) / 100;
    startCheckout(f, {
      kind: 'donation',
      fund: values.fund,
      recurring: values.frequency === 'monthly' ? 'month' : null,
      lines: [{ id: 'gift-' + values.fund, name: fundName, quantity: 1, amount: total }],
      total: total,
      customer: { name: values.name, email: values.email },
      details: { dedication: values.dedication || '' }
    });
  };
});
