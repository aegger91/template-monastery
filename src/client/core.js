// Shared helpers, the condensing header, dropdowns, the mobile drawer,
// language memory, gentle reveal on scroll and the toast.
var DATA = (function () {
  var el = document.getElementById('site-data');
  try { return el ? JSON.parse(el.textContent) : {}; } catch (e) { return {}; }
})();
var CAL = DATA.calendar;

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function str(key, vars) {
  var s = (DATA.strings && DATA.strings[key]) || key;
  return vars ? s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] !== undefined ? vars[k] : ''; }) : s;
}

function money(n) {
  var cents = Math.round(n * 100) % 100 !== 0;
  return new Intl.NumberFormat(DATA.locale, { style: 'currency', currency: DATA.currency || 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }).format(n);
}

var store = {
  get: function (key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  set: function (key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }
};

function readJsonScript(id) {
  var el = document.getElementById(id);
  try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; }
}

var toastTimer;
function toast(message) {
  var el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  requestAnimationFrame(function () { el.classList.add('is-visible'); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.classList.remove('is-visible');
    setTimeout(function () { el.hidden = true; }, 600);
  }, 5200);
}

var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- header ---------------------------------------------------------------

(function header() {
  var el = $('[data-header]');
  if (!el) return;
  var ticking = false;
  function update() {
    el.classList.toggle('is-condensed', window.scrollY > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  var toggles = $$('.nav__toggle', el);
  function closeAll(except) {
    toggles.forEach(function (t) { if (t !== except) t.setAttribute('aria-expanded', 'false'); });
    el.classList.toggle('is-open', !!except && except.getAttribute('aria-expanded') === 'true');
  }
  toggles.forEach(function (t) {
    t.addEventListener('click', function () {
      t.setAttribute('aria-expanded', t.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      closeAll(t);
    });
    var item = t.parentNode;
    var hoverTimer;
    if (window.matchMedia('(hover: hover)').matches) {
      item.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); t.setAttribute('aria-expanded', 'true'); closeAll(t); });
      item.addEventListener('mouseleave', function () { hoverTimer = setTimeout(function () { t.setAttribute('aria-expanded', 'false'); closeAll(null); }, 220); });
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav__item--parent')) closeAll(null);
    var lang = $('details.lang[open]');
    if (lang && !e.target.closest('details.lang')) lang.removeAttribute('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = toggles.filter(function (t) { return t.getAttribute('aria-expanded') === 'true'; })[0];
    if (open) { closeAll(null); open.focus(); }
    var lang = $('details.lang[open]');
    if (lang) { lang.removeAttribute('open'); $('summary', lang).focus(); }
  });
})();

// ---- drawer ---------------------------------------------------------------

(function drawer() {
  var el = $('[data-drawer]');
  var opener = $('[data-drawer-open]');
  if (!el || !opener) return;
  var panel = $('.drawer__panel', el);
  var closeTimer;
  function open() {
    clearTimeout(closeTimer);
    el.hidden = false;
    document.body.classList.add('drawer-open');
    opener.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-open'); }); });
    setTimeout(function () { var c = $('.drawer__close', el); if (c) c.focus(); }, 60);
  }
  function close() {
    el.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    opener.setAttribute('aria-expanded', 'false');
    closeTimer = setTimeout(function () { el.hidden = true; }, reduceMotion ? 0 : 520);
    opener.focus();
  }
  opener.addEventListener('click', open);
  $$('[data-drawer-close]', el).forEach(function (b) { b.addEventListener('click', close); });
  $$('a', el).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') close(); }); });
  document.addEventListener('keydown', function (e) {
    if (el.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var focusable = $$('a[href], button:not([disabled]), input, select, textarea', panel).filter(function (n) { return n.offsetParent !== null; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $$('.drawer__toggle', el).forEach(function (t) {
    t.addEventListener('click', function () {
      var sub = document.getElementById(t.getAttribute('aria-controls'));
      var expanded = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!expanded));
      if (sub) sub.hidden = expanded;
    });
  });
  window.addEventListener('resize', function () { if (!el.hidden && window.innerWidth >= 1240) close(); });
})();

// ---- language memory ------------------------------------------------------

$$('[data-lang]').forEach(function (a) {
  a.addEventListener('click', function () {
    try { localStorage.setItem('site-lang', a.getAttribute('data-lang')); } catch (e) { /* ignore */ }
  });
});

// ---- reveal ---------------------------------------------------------------

(function reveal() {
  var items = $$('.reveal');
  if (!items.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (n) { n.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (n) { io.observe(n); });
})();
