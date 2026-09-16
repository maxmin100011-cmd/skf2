/**
 * includes.js
 * Fetches and injects shared partials (topbar, header, footer) into every page.
 * After injection, re-initialises nav active state based on data-page on <body>.
 */
(function () {
  const BASE = (function () {
    // Works whether served from root or a subdirectory
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src.includes('includes.js')) {
        return s.src.replace(/js\/includes\.js.*$/, '');
      }
    }
    return './';
  })();

  function load(id, url, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    fetch(BASE + url)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(html => {
        el.innerHTML = html;
        if (callback) callback();
      })
      .catch(() => {
        el.innerHTML = '<!-- partial failed to load: ' + url + ' -->';
      });
  }

  function initNav() {
    // Mobile hamburger
    const ham = document.getElementById('ham');
    const mob = document.getElementById('mobnav');
    if (ham && mob) {
      ham.addEventListener('click', () => {
        const o = mob.classList.toggle('open');
        ham.classList.toggle('open', o);
        ham.setAttribute('aria-expanded', o);
      });
      mob.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
          mob.classList.remove('open');
          ham.classList.remove('open');
          ham.setAttribute('aria-expanded', false);
        })
      );
    }

    // More dropdown keyboard
    const moreBtn = document.querySelector('.nav-more-btn');
    const moreWrap = document.querySelector('.nav-more-wrap');
    if (moreBtn && moreWrap) {
      moreBtn.addEventListener('click', () => {
        const isOpen = moreWrap.classList.toggle('open');
        moreBtn.setAttribute('aria-expanded', isOpen);
        const drop = moreWrap.querySelector('.nav-dropdown');
        if (drop) {
          drop.style.opacity = isOpen ? '1' : '0';
          drop.style.visibility = isOpen ? 'visible' : 'hidden';
          drop.style.transform = isOpen ? 'translateY(0)' : 'translateY(-6px)';
        }
      });
      document.addEventListener('click', e => {
        if (!moreWrap.contains(e.target)) {
          moreWrap.classList.remove('open');
          moreBtn.setAttribute('aria-expanded', false);
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') moreWrap.classList.remove('open');
      });
    }

    // Active nav link from data-page attribute
    const page = document.body.dataset.page || '';
    document.querySelectorAll('.nav-links a, .nav-dropdown a').forEach(a => {
      const href = a.getAttribute('href') || '';
      // Match by filename (e.g. courses.html) or hash (e.g. #courses)
      const match =
        href.replace('.html', '').replace(/^.*\//, '').replace('#', '');
      if (match && match === page) {
        a.classList.add('active');
      }
    });

    // Header scroll shadow
    const hdr = document.getElementById('hdr');
    if (hdr) {
      window.addEventListener(
        'scroll',
        () => hdr.classList.toggle('scrolled', window.scrollY > 20),
        { passive: true }
      );
    }

    // Language switcher (re-init after partial loads)
    if (typeof applyLang === 'function') {
      document.querySelectorAll('[data-l]').forEach(b =>
        b.addEventListener('click', () => applyLang(b.dataset.l))
      );
    }

    // "Enroll Now" nav CTA opens student enrollment modal on every page
    document.querySelectorAll('a.ncta[href*="enroll"], a.mcta[href*="enroll"]').forEach(a => {
      // Only intercept if we're NOT on enroll.html (where the section exists)
      if (document.body.dataset.page !== 'enroll') {
        const modal = document.getElementById('enrollAppModal');
        if (modal) {
          a.addEventListener('click', e => {
            e.preventDefault();
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            const closeBtn = modal.querySelector('.app-modal-close');
            if (closeBtn) closeBtn.focus();
          });
        }
      }
    });
  }

  // Load all three partials in parallel; nav init fires after header loads
  load('topbar-root', 'partials/topbar.html');
  load('header-root', 'partials/header.html', initNav);
  load('footer-root', 'partials/footer.html');
})();
