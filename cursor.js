/* Cursor label over case covers (desktop with a mouse or trackpad only).
 * Any element with data-cursor="Text" hides the system cursor and shows a small pill with that text, which
 * follows the pointer. The look is in cursor.css. The label is re-checked while the page scrolls, because the
 * home gallery moves under a still pointer. */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pill = null, x = 0, y = 0, cx = 0, cy = 0, shown = false, raf = 0, has = false;

  function make() {
    pill = document.createElement('div');
    pill.className = 'cursor-pill';
    pill.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pill);
  }
  function target() {
    var el = has ? document.elementFromPoint(x, y) : null;
    return el && el.closest ? el.closest('[data-cursor]') : null;
  }
  function update() {
    var t = target();
    var text = t ? t.getAttribute('data-cursor') : '';
    if (text) {
      if (!pill) make();
      if (pill.textContent !== text) pill.textContent = text;
      if (!shown) { cx = x; cy = y; shown = true; pill.classList.add('is-shown'); }
    } else if (shown) {
      shown = false; if (pill) pill.classList.remove('is-shown');
    }
  }
  function frame() {
    raf = 0;
    if (!pill) return;
    var k = still.matches ? 1 : 0.35; // eases after the pointer, like a light spring
    cx += (x - cx) * k; cy += (y - cy) * k;
    pill.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
    if (Math.abs(x - cx) > 0.2 || Math.abs(y - cy) > 0.2) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY; has = true;
    update(); kick();
  }, { passive: true });
  window.addEventListener('scroll', function () { if (has) update(); }, { passive: true });
  document.addEventListener('pointerleave', function () { has = false; update(); });
  window.addEventListener('blur', function () { has = false; update(); });
})();
