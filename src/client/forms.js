// Request forms. Every form[data-form] is validated here, then either
// handed to a handler (commemoration and donation go on to checkout) or
// posted as JSON to site.forms.endpoint. With no endpoint set, a clearly
// marked sample confirmation is shown and nothing leaves the browser.

var FORM_HANDLERS = {};
var FORM_VALIDATORS = {};

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function showStatus(form, opts) {
  var el = $('[data-form-status]', form);
  if (!el) return;
  el.classList.toggle('is-error', !!opts.error);
  el.innerHTML = (opts.title ? '<strong>' + escHtml(opts.title) + '</strong>' : '') + (opts.text ? '<span>' + escHtml(opts.text) + '</span>' : '') +
    (opts.items && opts.items.length ? '<ul>' + opts.items.map(function (i) { return '<li>' + escHtml(i) + '</li>'; }).join('') + '</ul>' : '');
  el.hidden = false;
  if (opts.focus !== false) el.focus({ preventScroll: true });
  if (opts.scroll !== false) el.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}

function clearErrors(form) {
  $$('[data-error]', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
  $$('.is-invalid', form).forEach(function (e) { e.classList.remove('is-invalid'); });
  $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); });
}

function setError(target, message) {
  var box = target.closest('.field, .choices, .names, .amounts, .newsletter') || target;
  var err = $('[data-error]', box);
  box.classList.add('is-invalid');
  if (target.matches && target.matches('input, select, textarea')) target.setAttribute('aria-invalid', 'true');
  if (err && !err.textContent) { err.textContent = message; err.hidden = false; }
}

function isShown(el) { return !el.closest('[hidden]') && !el.disabled; }

function validateForm(form, name) {
  clearErrors(form);
  var errors = [];
  $$('input, select, textarea', form).forEach(function (el) {
    if (!isShown(el) || el.type === 'radio' || el.type === 'checkbox') return;
    var v = el.value.trim();
    if (el.required && !v) errors.push({ el: el, message: str('form.required') });
    else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors.push({ el: el, message: str('form.invalidEmail') });
    else if (v && el.type === 'number' && ((el.min !== '' && Number(v) < Number(el.min)) || (el.max !== '' && Number(v) > Number(el.max)) || isNaN(Number(v)))) {
      errors.push({ el: el, message: el.max !== '' ? str('form.range', { min: el.min || 0, max: el.max }) : str('form.min', { min: el.min || 0 }) });
    }
  });
  $$('fieldset.choices', form).forEach(function (fs) {
    if (!isShown(fs) || !$('legend .field__req', fs)) return;
    if (!$('input:checked', fs)) errors.push({ el: fs, message: str('form.required') });
  });
  if (FORM_VALIDATORS[name]) errors = errors.concat(FORM_VALIDATORS[name](form) || []);
  errors.forEach(function (e) { setError(e.el, e.message); });
  if (errors.length) {
    var first = errors[0].el;
    var focusEl = first.matches('input, select, textarea') ? first : $('input, button', first);
    if (focusEl) focusEl.focus();
    first.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  return errors.length === 0;
}

function formValues(form) {
  var out = {};
  new FormData(form).forEach(function (value, key) {
    value = typeof value === 'string' ? value.trim() : value;
    if (key === 'names') { (out.names = out.names || []); if (value) out.names.push(value); return; }
    if (key in out) out[key] = [].concat(out[key], value);
    else out[key] = value;
  });
  return out;
}

function sendForm(form, name, values, endpoint) {
  var url = endpoint === undefined ? DATA.forms && DATA.forms.endpoint : endpoint;
  var button = $('[type="submit"]', form);
  if (!url) {
    showStatus(form, { title: str('form.sampleTitle'), text: str('form.sampleText') });
    form.classList.add('is-sent');
    return Promise.resolve({ sample: true });
  }
  if (button) button.disabled = true;
  showStatus(form, { text: str('form.sending'), focus: false, scroll: false });
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ form: name, locale: DATA.locale, page: location.pathname, submittedAt: new Date().toISOString(), data: values })
  }).then(function (res) {
    if (!res.ok) throw new Error(res.status);
    showStatus(form, { title: str('form.sentTitle'), text: str('form.sentText') });
    form.reset();
    form.dispatchEvent(new Event('change', { bubbles: true }));
  }).catch(function () {
    showStatus(form, { error: true, title: str('form.failedTitle'), text: str('form.failedText') });
  }).then(function () { if (button) button.disabled = false; });
}

$$('form[data-form]').forEach(function (form) {
  var name = form.getAttribute('data-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm(form, name)) {
      if (name !== 'newsletter') showStatus(form, { error: true, title: str('form.fixTitle'), text: str('form.fixText'), focus: false, scroll: false });
      return;
    }
    var values = formValues(form);
    if (FORM_HANDLERS[name]) FORM_HANDLERS[name](form, values);
    else if (name === 'newsletter') sendForm(form, name, values, DATA.orthodoxconnect && DATA.orthodoxconnect.newsletterEndpoint);
    else sendForm(form, name, values);
  });
  form.addEventListener('input', function (e) {
    var box = e.target.closest('.is-invalid');
    if (box) {
      box.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
      var err = $('[data-error]', box);
      if (err) { err.hidden = true; err.textContent = ''; }
    }
  });
});

// ---- guest house stay request --------------------------------------------

(function stay() {
  var form = $('form[data-form="stay"]');
  if (!form) return;
  var rules = readJsonScript(form.id.replace(/-form$/, '-rules')) || [];
  var houseLine = $('[data-stay-house]', form);
  var nightsLine = $('[data-stay-nights]', form);
  var guests = form.elements.guests;
  var arrival = form.elements.arrival;
  var departure = form.elements.departure;
  var section = form.closest('.stay') || document;
  var todayIso = CAL ? isoDate(nowAt(CAL.tz).dt) : new Date().toISOString().slice(0, 10);
  arrival.min = todayIso;
  departure.min = todayIso;

  function house() {
    var g = form.querySelector('input[name="group"]:checked');
    return g ? rules.filter(function (h) { return h.accepts.indexOf(g.value) >= 0; })[0] : null;
  }
  function nights() {
    if (!arrival.value || !departure.value) return null;
    return Math.round((fromIso(departure.value) - fromIso(arrival.value)) / 86400000);
  }
  function update() {
    var h = house();
    $$('.houses__item', section).forEach(function (li) { li.classList.toggle('is-match', !!h && li.getAttribute('data-house') === h.id); });
    houseLine.textContent = h ? str('client.stayHouse', { house: h.name, guests: h.maxGuests, nights: h.maxNights }) : '';
    if (h) guests.max = h.maxGuests;
    if (arrival.value) {
      var next = isoDate(addDays(fromIso(arrival.value), 1));
      departure.min = next;
    }
    var n = nights();
    nightsLine.textContent = n && n > 0 ? str('client.nights', { n: n }) : '';
  }
  form.addEventListener('change', update);
  form.addEventListener('input', function (e) { if (e.target === arrival || e.target === departure) update(); });
  update();

  FORM_VALIDATORS.stay = function () {
    var errors = [];
    var h = house();
    var n = nights();
    if (arrival.value && arrival.value < todayIso) errors.push({ el: arrival, message: str('client.datePast') });
    if (n !== null && n < 1) errors.push({ el: departure, message: str('client.departureAfter') });
    else if (h && n !== null && n > h.maxNights) errors.push({ el: departure, message: str('client.tooManyNights', { house: h.name, max: h.maxNights }) });
    if (h && Number(guests.value) > h.maxGuests) errors.push({ el: guests, message: str('client.tooManyGuests', { house: h.name, max: h.maxGuests }) });
    return errors;
  };
})();
