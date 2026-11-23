// Today's services, the week/month schedule and the upcoming feasts.
// The build renders all of these for the build date; here they are
// refreshed for the visitor's "now" at the monastery and kept current.

(function today() {
  if (!CAL) return;
  var panels = $$('[data-today-body]');
  var lastKey = '';
  function refresh() {
    var now = nowAt(CAL.tz);
    var key = isoDate(now.dt) + ' ' + now.hm;
    if (key === lastKey) return;
    lastKey = key;
    panels.forEach(function (p) { p.innerHTML = todayHtml(CAL, now); });
    var dayKey = DAY_KEYS[now.dt.getUTCDay()];
    $$('.hours-table tr[data-day]').forEach(function (tr) { tr.classList.toggle('is-today', tr.getAttribute('data-day') === dayKey); });
  }
  refresh();
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();

(function feasts() {
  if (!CAL) return;
  $$('[data-feasts]').forEach(function (el) {
    var limit = Number(el.getAttribute('data-limit')) || 6;
    el.innerHTML = feastListHtml(CAL, upcomingFeasts(CAL, nowAt(CAL.tz).dt, limit));
  });
})();

(function tabs() {
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var rtl = document.documentElement.dir === 'rtl';
        var step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
        if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
      });
    });
    if (location.hash === '#month') {
      var month = tabs.filter(function (t) { return t.id === 'tab-month'; })[0];
      if (month) select(month);
    }
  });
})();

(function month() {
  if (!CAL) return;
  var el = $('[data-month]');
  if (!el) return;
  var grid = $('[data-month-grid]', el);
  var title = $('[data-month-title]', el);
  var details = $('[data-day-details]', el);
  var now = nowAt(CAL.tz);
  var todayIso = isoDate(now.dt);
  var y = now.dt.getUTCFullYear();
  var m = now.dt.getUTCMonth() + 1;
  var selected = todayIso;

  function render() {
    grid.innerHTML = monthHtml(CAL, y, m, selected, todayIso);
    title.textContent = fmtDate(CAL, civilDate(y, m, 1), { month: 'long', year: 'numeric' });
  }
  function show(iso) {
    selected = iso;
    details.innerHTML = dayDetailsHtml(CAL, fromIso(iso));
    $$('.month__day', grid).forEach(function (b) {
      var on = b.getAttribute('data-date') === iso;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  render();
  show(selected);

  $$('[data-month-step]', el).forEach(function (b) {
    b.addEventListener('click', function () {
      m += Number(b.getAttribute('data-month-step'));
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      var first = isoDate(civilDate(y, m, 1));
      selected = todayIso.slice(0, 7) === first.slice(0, 7) ? todayIso : first;
      render();
      show(selected);
    });
  });
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.month__day');
    if (b) show(b.getAttribute('data-date'));
  });
})();
