// Commemoration slips: add names, preview the slip as it will be read at
// the Proskomedia, total a freewill offering (chips + Other amount, no
// minimum — including none) plus optional light, then go to checkout.

$$('form[data-form="commemoration"]').forEach(function (form) {
  var config = readJsonScript(form.id.replace(/-form$/, '-config'));
  if (!config) return;
  var wrap = form.closest('.commemoration');
  var slip = $('[data-slip]', wrap);
  var heading = $('[data-slip-heading]', wrap);
  var list = $('[data-slip-names]', wrap);
  var offeringLine = $('[data-slip-offering]', wrap);
  var totalEl = $('[data-total]', form);
  var addBtn = $('[data-add-name]', form);
  var rows = $$('.names__row', form);
  var amount = form.elements.amount;
  var presets = $$('input[name="amountPreset"]', form);

  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function names() { return $$('[data-name-input]', form).map(function (i) { return i.value.trim(); }).filter(Boolean); }
  function giftAmount() {
    var raw = amount && amount.value != null ? String(amount.value).trim() : '';
    if (raw === '') return 0;
    var n = Number(raw);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }
  function total() {
    var l = config.lights[checked('light')];
    return giftAmount() + (l ? l.amount : 0);
  }

  function syncPresets() {
    if (!amount) return;
    var v = giftAmount();
    var raw = String(amount.value).trim();
    presets.forEach(function (p) { p.checked = raw !== '' && Number(p.value) === v; });
  }

  function update() {
    var type = checked('slip');
    Object.keys(config.types).forEach(function (t) { slip.classList.toggle('slip--' + t, t === type); });
    if (config.types[type]) heading.textContent = config.types[type].heading;
    var list_ = names();
    list.innerHTML = list_.length
      ? list_.map(function (n) { return '<li>' + escHtml(n) + '</li>'; }).join('')
      : '<li class="slip__empty">' + escHtml(str('commemoration.previewEmpty')) + '</li>';
    var o = config.offerings[checked('offering')];
    var l = config.lights[checked('light')];
    offeringLine.textContent = [o && o.label, l && l.amount ? l.label : ''].filter(Boolean).join(' · ');
    totalEl.textContent = money(total());
    var hidden = rows.filter(function (r) { return r.hidden; });
    addBtn.hidden = hidden.length === 0;
    syncPresets();
  }

  presets.forEach(function (p) {
    p.addEventListener('change', function () {
      if (p.checked && amount) {
        amount.value = p.value;
        amount.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
  $$('input[name="offering"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      var label = r.closest('[data-amount]');
      if (r.checked && label && amount) {
        amount.value = label.getAttribute('data-amount');
        amount.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  addBtn.addEventListener('click', function () {
    var next = rows.filter(function (r) { return r.hidden; })[0];
    if (!next) return;
    next.hidden = false;
    $('input', next).focus();
    update();
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.hasAttribute('data-name-input')) return;
    e.preventDefault();
    var row = e.target.closest('.names__row');
    var next = row.nextElementSibling;
    if (next && next.hidden && e.target.value.trim()) addBtn.click();
    else if (next) $('input', next).focus();
  });
  update();

  FORM_VALIDATORS.commemoration = function () {
    if (names().length) return [];
    return [{ el: $('[data-name-input]', form), message: str('commemoration.namesRequired') }];
  };

  FORM_HANDLERS.commemoration = function (f, values) {
    var type = values.slip;
    var o = config.offerings[values.offering];
    var l = config.lights[values.light];
    var gift = giftAmount();
    var lines = [{ id: 'commemoration-' + values.offering, name: config.types[type].heading + ': ' + o.label, quantity: 1, amount: gift }];
    if (l && l.amount) lines.push({ id: 'light-' + values.light, name: l.label, quantity: 1, amount: l.amount });
    startCheckout(f, {
      kind: 'commemoration',
      fund: 'commemorations',
      lines: lines,
      total: total(),
      customer: { name: values.name, email: values.email },
      details: { slip: type, names: values.names, offering: values.offering, light: values.light, amount: gift }
    });
  };
});
