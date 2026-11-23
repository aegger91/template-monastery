// OrthodoxConnect links. Until site.integrations.orthodoxconnect.communityId
// is set, the links are placeholders: clicking explains that instead of
// opening a dead link. Once set, the app deep link is tried first and the
// web link (if any) is the fallback.

$$('[data-oc-link]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var oc = DATA.orthodoxconnect || {};
    var deep = a.getAttribute('data-oc-link');
    var web = a.getAttribute('data-oc-web');
    if (!oc.communityId) {
      e.preventDefault();
      toast(str('client.ocPlaceholder'));
      return;
    }
    if (!web) return;
    e.preventDefault();
    var left = false;
    var onHide = function () { left = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });
    location.href = deep;
    setTimeout(function () {
      document.removeEventListener('visibilitychange', onHide);
      if (!left && !document.hidden) location.href = web;
    }, 1200);
  });
});
