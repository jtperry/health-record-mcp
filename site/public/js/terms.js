// Extracted from the page so the Content-Security-Policy can drop
// script-src 'unsafe-inline'. Same-origin, same behaviour.

/*
 * Table-of-contents scroll spy.
 *
 * aria-current is the only state written; the stylesheet keys off it, so what a
 * screen reader announces and what a sighted reader sees cannot drift apart.
 * Progressive enhancement: with JS off, the links still work as anchors.
 */
(function () {
  var toc = document.getElementById('toc');
  if (!toc) return;

  var links = {};
  Array.prototype.forEach.call(toc.querySelectorAll('[data-toc]'), function (a) {
    links[a.dataset.toc] = a;
  });

  function setActive(id) {
    Object.keys(links).forEach(function (key) {
      if (key === id) links[key].setAttribute('aria-current', 'true');
      else links[key].removeAttribute('aria-current');
    });
  }

  var ids = Object.keys(links);

  // Choose by position rather than by intersection order. Sorting intersecting
  // entries by top picks the section you have just scrolled *past* - its top is the
  // most negative - so the rail lagged one entry behind the heading on screen.
  function refresh() {
    var active = ids[0];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.getBoundingClientRect().top <= 120) active = ids[i];
    }
    // At the foot of the document the final sections can never reach the top, so
    // without this the last entry is never markable however far you scroll.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      active = ids[ids.length - 1];
    }
    setActive(active);
  }

  // Driven by scroll rather than IntersectionObserver. With scroll-behavior: smooth
  // the observer's last callback lands mid-animation, so the resting position was
  // never evaluated and clicking a rail link could leave the wrong entry marked.
  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; refresh(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  refresh(); // so the rail is never blank before the first scroll
})();
