/* Site language switch (EN / RU), shared by every page.
 *
 * - The choice is kept in localStorage ("site-lang"), so it follows the visitor across pages and
 *   reloads; English is the default and the fallback when storage is unavailable.
 * - <html lang> and data-site-lang are updated; the switch's active state is pure CSS (lang.css).
 * - Pages render their texts with siteLang.texts(page) — i18n/site-texts.js (shared parts, home,
 *   Privacy, NDA gate) and i18n/case-texts.js (cases) — and re-render on the "site-langchange" event.
 * - Switching EN → RU shows a small note under the switch (not on page loads). It does not take
 *   clicks or move the layout, fades out after TIP_MS, and also closes on Esc or a click elsewhere.
 */
(function () {
  var KEY = 'site-lang';
  var TIP_TEXT = 'Пока переведены только тексты сайта. Интерфейсы внутри макетов и изображений остаются на английском.';
  var TIP_MS = 10000;
  var EDGE = 16; // the note keeps this distance from the viewport edges

  function read(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }

  var lang = read(KEY) === 'ru' ? 'ru' : 'en';

  // Texts of one page in the given language: shared texts, then the page's own; missing keys fall back to EN.
  function texts(page, l) {
    l = l || lang;
    var out = {};
    var sources = [(window.SITE_TEXTS || {}).common, (window.SITE_TEXTS || {})[page], (window.CASE_TEXTS || {})[page]];
    for (var i = 0; i < sources.length; i++) {
      var src = sources[i];
      if (!src) continue;
      var en = src.en || {}, cur = src[l] || {}, k;
      for (k in en) out[k] = en[k];
      for (k in cur) out[k] = cur[k];
    }
    return out;
  }

  function syncButtons() {
    var opts = document.querySelectorAll('[data-lang-option]');
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute('data-lang-option') === lang;
      if (opts[i].getAttribute('aria-pressed') !== String(on)) opts[i].setAttribute('aria-pressed', String(on));
    }
  }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-site-lang', lang);
    syncButtons();
  }

  var tip = null, tipTimer = 0;
  function onKey(e) { if (e.key === 'Escape') hideTip(); }
  function onOutside(e) {
    if (tip && !(e.target.closest && e.target.closest('[data-lang-switch]'))) hideTip();
  }
  function hideTip() {
    if (!tip) return;
    var el = tip;
    tip = null;
    clearTimeout(tipTimer);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onOutside, true);
    el.classList.remove('is-shown');
    setTimeout(function () { el.remove(); }, 250); // after the fade-out
  }
  // The note lives inside the switch (positioned under it), so it moves with the header.
  function showTip(from) {
    hideTip();
    var sw = (from && from.closest && from.closest('[data-lang-switch]')) || document.querySelector('[data-lang-switch]');
    if (!sw) return;
    tip = document.createElement('div');
    tip.className = 'lang-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('lang', 'ru');
    tip.textContent = TIP_TEXT;
    sw.appendChild(tip);
    // keep it inside the viewport when the switch is not at the right edge (Privacy, NDA gate)
    var r = tip.getBoundingClientRect();
    if (r.left < EDGE) tip.style.right = -(EDGE - r.left) + 'px';
    var el = tip;
    requestAnimationFrame(function () { el.classList.add('is-shown'); });
    tipTimer = setTimeout(hideTip, TIP_MS);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside, true);
  }

  function set(next, from) {
    next = next === 'ru' ? 'ru' : 'en';
    if (next === lang) return;
    lang = next;
    write(KEY, lang);
    apply();
    try { window.dispatchEvent(new CustomEvent('site-langchange', { detail: { lang: lang } })); } catch (e) {}
    if (lang === 'ru') showTip(from); else hideTip();
  }

  // The switch is plain markup in each page; clicks are handled here.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang-option]');
    if (b) { e.preventDefault(); set(b.getAttribute('data-lang-option'), b); }
  });

  // Page title in the current language. The runtime mounts <title> from <helmet> after the page has
  // rendered, so the wanted title is re-applied whenever <head> changes it.
  var wantTitle = null, titleWatch = null;
  function title(v) {
    if (!v) return;
    wantTitle = v;
    if (document.title !== v) document.title = v;
    if (!titleWatch && 'MutationObserver' in window) {
      titleWatch = new MutationObserver(function () { if (wantTitle && document.title !== wantTitle) document.title = wantTitle; });
      titleWatch.observe(document.head, { childList: true, subtree: true, characterData: true });
    }
  }

  window.siteLang = { get: function () { return lang; }, set: set, texts: texts, title: title };
  apply();

  // Pages render their markup after this script runs (the home page swaps desktop/mobile markup
  // on resize, and re-renders may reset attributes), so keep aria-pressed in sync.
  function start() {
    syncButtons();
    if ('MutationObserver' in window) new MutationObserver(syncButtons).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.addEventListener('load', syncButtons);
})();
