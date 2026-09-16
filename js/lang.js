/**
 * lang.js — language switcher (EN / HI / BN)
 * Must load before main.js so applyLang is available globally.
 */
const LANGS = ['en', 'hi', 'bn'];
let curL = 'en';

function applyLang(l) {
  curL = l;
  LANGS.forEach(x =>
    document.querySelectorAll('[data-lang="' + x + '"]').forEach(el =>
      el.classList.toggle('lv', x === l)
    )
  );
  document.querySelectorAll('[data-l]').forEach(b => {
    const a = b.dataset.l === l;
    b.classList.toggle('active', a);
    b.setAttribute('aria-pressed', a);
  });
  document.documentElement.lang = l === 'bn' ? 'bn' : l === 'hi' ? 'hi' : 'en';
  try { localStorage.setItem('skf-lang', l); } catch (e) {}
}

// Wire up any [data-l] buttons already in DOM, and re-wire after partials load
function wireLangButtons() {
  document.querySelectorAll('[data-l]').forEach(b =>
    b.addEventListener('click', () => applyLang(b.dataset.l))
  );
}

wireLangButtons();

// Restore saved preference
(function () {
  let s = 'en';
  try { s = localStorage.getItem('skf-lang') || 'en'; } catch (e) {}
  if (!LANGS.includes(s)) s = 'en';
  applyLang(s);
})();

// Re-wire after partial loads (topbar contains lang switcher)
document.addEventListener('DOMContentLoaded', wireLangButtons);
