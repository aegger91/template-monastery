// Gallery lightbox, using the native <dialog>.

$$('[data-gallery]').forEach(function (list) {
  var dialog = list.parentNode.querySelector('[data-lightbox]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var links = $$('.gallery__link', list);
  var img = $('[data-lightbox-img]', dialog);
  var caption = $('[data-lightbox-caption]', dialog);
  var index = 0;

  function show(i) {
    index = (i + links.length) % links.length;
    var a = links[index];
    var thumb = $('img', a);
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    caption.textContent = a.getAttribute('data-caption') || '';
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(i);
      dialog.showModal();
      document.body.classList.add('drawer-open');
    });
  });
  $$('[data-lightbox-step]', dialog).forEach(function (b) {
    b.addEventListener('click', function () { show(index + Number(b.getAttribute('data-lightbox-step'))); });
  });
  $('[data-lightbox-close]', dialog).addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { document.body.classList.remove('drawer-open'); links[index].focus(); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (e) {
    var rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') show(index + (rtl ? -1 : 1));
    if (e.key === 'ArrowLeft') show(index + (rtl ? 1 : -1));
  });
  if (links.length < 2) $$('[data-lightbox-step]', dialog).forEach(function (b) { b.hidden = true; });
});
