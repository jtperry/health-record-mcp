// Extracted from the page so the Content-Security-Policy can drop
// script-src 'unsafe-inline'. Same-origin, same behaviour.

/*
 * Consent gate.
 *
 * Reimplemented from the design prototype, which expressed this through the
 * Claude Design canvas runtime (support.js) and gated the button with
 * aria-disabled plus pointer-events. That is not enforcement: keyboard users and
 * assistive technology can still activate such a control. Here the platform
 * `disabled` attribute does the gating, and the visual state only reflects it.
 *
 * Three conditions, all required:
 *   1. the warning has been scrolled to the end   -> unlocks the checkbox
 *   2. the checkbox is ticked                     -> unlocks the button
 *   3. a client id is configured on the Worker    -> the flow exists at all
 *
 * Consent is deliberately not persisted; it must be given on every visit.
 */
(function () {
  var cb = document.getElementById('consent');
  var btn = document.getElementById('connect-btn');
  var status = document.querySelector('#connect [role="status"]');
  var warning = document.getElementById('warning');
  var consentBox = cb ? cb.parentElement : null;
  if (!cb || !btn) return;

  var connectEnabled = document.documentElement.dataset.connectEnabled === 'true';
  var warningRead = false;

  cb.checked = false;

  function paint() {
    cb.disabled = !warningRead;
    if (consentBox) consentBox.style.opacity = warningRead ? '1' : '0.55';
    btn.disabled = !(warningRead && cb.checked && connectEnabled);

    if (!status) return;
    if (!warningRead) {
      status.textContent = 'Locked: read the warning section above, then confirm you have read it.';
    } else if (!cb.checked) {
      status.textContent = 'Warning read. Now check the consent statement below to unlock the connect button.';
    } else if (!connectEnabled) {
      status.textContent = 'Not yet available: this tool is pending application registration with the EHR vendor. The connect flow will be enabled once that is approved.';
    } else {
      status.textContent = 'Ready. Connecting will send you to your health system to sign in.';
    }
  }

  if (warning) {
    var sentinel = warning.lastElementChild || warning;

    // Position, not intersection.
    //
    // This previously waited for the sentinel to *intersect* the viewport, which only
    // happens if the reader scrolls through it. Jumping straight past it - End, a
    // scrollbar drag, or any in-page link - left the checkbox permanently disabled with
    // no way to proceed. That hit reduced-motion users hardest: `scroll-behavior` is
    // `auto` for them, so End jumps instantly rather than animating through the warning,
    // and the page became unusable for exactly the audience the warning exists to serve.
    //
    // Reaching or passing the end of the warning both satisfy it now. This is still not
    // proof anyone read anything - nothing in a browser is - but it is the same bar as
    // before, without the dead end.
    var checkWarning = function () {
      if (warningRead) return;
      if (sentinel.getBoundingClientRect().top <= window.innerHeight * 0.8) {
        warningRead = true;
        window.removeEventListener('scroll', onWarningScroll);
        paint();
      }
    };
    var warnQueued = false;
    var onWarningScroll = function () {
      if (warnQueued) return;
      warnQueued = true;
      window.requestAnimationFrame(function () { warnQueued = false; checkWarning(); });
    };
    window.addEventListener('scroll', onWarningScroll, { passive: true });
    window.addEventListener('resize', onWarningScroll, { passive: true });
    checkWarning(); // a short viewport may already show the end of it
  } else {
    // No warning section to gate on; fall back to the checkbox alone rather than
    // locking the user out of their own record.
    warningRead = true;
  }

  cb.addEventListener('change', paint);
  btn.addEventListener('click', function () {
    if (btn.disabled) return;
    window.location.href = '/ehr-connect';
  });

  // Table-of-contents highlighting.
  var toc = document.querySelectorAll('[data-toc]');
  if (toc.length) {
    var ids = ['law','warning','architecture','steps','connect','disclaimer','references'];
    // Choose by position rather than by intersection order. Sorting intersecting
    // entries by top picks the section just scrolled *past* - its top is the most
    // negative - so the rail lagged one entry behind the heading on screen.
    function refreshSpy() {
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
      toc.forEach(function (a) {
        var on = a.dataset.toc === active;
        var isWarning = a.dataset.toc === 'warning';
        a.style.borderLeftColor = on ? '#0b4f8a' : 'transparent';
        a.style.color = (on || isWarning) ? '#0b4f8a' : '#33465b';
        a.style.fontWeight = (on || isWarning) ? '700' : '400';
        if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
    }
    // Scroll-driven, not IntersectionObserver: with scroll-behavior: smooth the
    // observer's last callback lands mid-animation, so the resting position was
    // never evaluated and clicking a rail link could leave the wrong entry marked.
    var spyQueued = false;
    function onSpyScroll() {
      if (spyQueued) return;
      spyQueued = true;
      window.requestAnimationFrame(function () { spyQueued = false; refreshSpy(); });
    }
    window.addEventListener('scroll', onSpyScroll, { passive: true });
    window.addEventListener('resize', onSpyScroll, { passive: true });
    refreshSpy();
  }

  paint();
})();
