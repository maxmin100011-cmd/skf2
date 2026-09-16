/**
 * main.js — shared behaviours across all pages
 * Guards every feature with getElementById so it's safe on pages missing that element.
 */

const ENROLL_EMAIL = 'samajkatha.india@gmail.com';
const EJS_SVC = 'YOUR_SERVICE_ID', EJS_TPL = 'YOUR_TEMPLATE_ID';

/* ── Progress bar ── */
window.addEventListener('scroll', () => {
  const pb = document.getElementById('progress');
  if (!pb) return;
  const t = document.documentElement.scrollHeight - window.innerHeight;
  pb.style.width = (t > 0 ? window.scrollY / t * 100 : 0) + '%';
}, { passive: true });

/* ── Smooth scroll ── */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  const hdr = document.getElementById('hdr');
  window.scrollTo({ top: el.offsetTop - (hdr ? hdr.offsetHeight : 0) - 8, behavior: 'smooth' });
});

/* ── Scroll reveal ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('up'); io.unobserve(e.target); }
  });
}, { threshold: 0.10 });
document.querySelectorAll('.rev').forEach(el => io.observe(el));

/* ── Course tabs (courses.html only) ── */
document.querySelectorAll('.ctab').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.ctab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.cpane').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const p = document.getElementById('tab-' + b.dataset.tab);
    if (p) p.classList.add('active');
  });
});

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-q').forEach(b => {
  b.addEventListener('click', () => {
    const item = b.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq-q').setAttribute('aria-expanded', false);
    });
    item.classList.toggle('open', !isOpen);
    b.setAttribute('aria-expanded', !isOpen);
  });
});

/* ── Toast ── */
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Scroll-reveal re-observe after partial load (for elements added dynamically) ── */
function observeReveal() {
  document.querySelectorAll('.rev:not(.up)').forEach(el => io.observe(el));
}

/* ── Application form: shared wiring function ── */
function wireApplicationForm(cfg) {
  const form = document.getElementById(cfg.formId);
  const preview = document.getElementById(cfg.previewId);
  const submitBtn = document.getElementById(cfg.submitBtnId);
  const editBtn = document.getElementById(cfg.editBtnId);
  const sendBtn = document.getElementById(cfg.sendBtnId);
  const success = preview ? preview.querySelector('.epSuccess') : null;
  if (!submitBtn || !form || !preview) return;

  submitBtn.addEventListener('click', () => {
    const values = {};
    cfg.fields.forEach(f => { values[f.key] = (document.getElementById(f.id).value || '').trim(); });
    let valid = true;
    cfg.required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = '#D94F4F'; el.style.background = '#FFF5F5';
        if (valid) el.focus();
        valid = false;
      } else { el.style.borderColor = ''; el.style.background = ''; }
    });
    if (!valid) { toast('Please fill in all required fields.'); return; }

    cfg.fields.forEach(f => {
      const td = document.getElementById(f.previewId);
      if (!td) return;
      if (f.badge) {
        td.innerHTML = '';
        const b = document.createElement('span');
        b.className = 'ep-badge ' + (values[f.key].indexOf('Yes') !== -1 ? 'ep-green' : 'ep-saff');
        b.textContent = values[f.key];
        td.appendChild(b);
      } else {
        td.textContent = values[f.key] || (f.optional ? 'Not specified' : '—');
      }
    });

    if (cfg.messageRowId && cfg.messageKey) {
      const row = document.getElementById(cfg.messageRowId);
      if (values[cfg.messageKey]) {
        const mp = document.getElementById(cfg.messagePreviewId);
        if (mp) mp.textContent = values[cfg.messageKey];
        if (row) row.style.display = '';
      } else if (row) { row.style.display = 'none'; }
    }

    form.style.display = 'none';
    preview.classList.add('vis');
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    preview.dataset.values = JSON.stringify(values);
  });

  if (editBtn) editBtn.addEventListener('click', () => {
    preview.classList.remove('vis');
    form.style.display = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  if (sendBtn) sendBtn.addEventListener('click', () => {
    const values = JSON.parse(preview.dataset.values || '{}');
    const ico = sendBtn.querySelector('.epSendIco');
    const spin = sendBtn.querySelector('.epSpinner');
    sendBtn.disabled = true; sendBtn.style.opacity = '0.75';
    if (ico) ico.style.display = 'none';
    if (spin) spin.style.display = 'block';

    function showSuccess() {
      const acts = sendBtn.closest('.ep-acts');
      if (acts) acts.style.display = 'none';
      const note = preview.querySelector('.ep-note');
      if (note) note.style.display = 'none';
      const tbl = preview.querySelector('table');
      if (tbl) tbl.style.display = 'none';
      const hd = preview.querySelector('.ep-hd');
      if (hd) hd.style.display = 'none';
      preview.querySelectorAll('.spPhone').forEach(el => el.textContent = values.phone || '');
      if (success) { success.style.display = 'block'; success.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      toast(cfg.successToast);
    }

    function fallback() {
      sendBtn.disabled = false; sendBtn.style.opacity = '1';
      if (ico) ico.style.display = '';
      if (spin) spin.style.display = 'none';
      const subj = cfg.subjectPrefix + ': ' + (values.name || '') + (values.course ? ' | ' + values.course : '');
      let body = cfg.bodyTitle + '\n' + '='.repeat(cfg.bodyTitle.length) + '\n\n';
      cfg.fields.forEach(f => { body += f.label + (f.label.length < 12 ? '\t\t' : '\t') + ': ' + (values[f.key] || 'Not specified') + '\n'; });
      body += '\n-------------------------------------------\n';
      body += 'Submitted from Samaj Katha Foundation website\n';
      body += 'samajkatha.india@gmail.com | +91 99033 46052';
      window.location.href = 'mailto:' + ENROLL_EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      toast('Your email app is opening — tap Send once.');
    }

    const params = { to_email: ENROLL_EMAIL, reply_to: ENROLL_EMAIL };
    cfg.fields.forEach(f => { params[f.key] = values[f.key] || 'Not specified'; });

    if (typeof emailjs !== 'undefined' && EJS_SVC !== 'YOUR_SERVICE_ID' && EJS_TPL !== 'YOUR_TEMPLATE_ID') {
      emailjs.send(EJS_SVC, EJS_TPL, params).then(showSuccess).catch(fallback);
    } else { fallback(); }
  });

  cfg.required.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { this.style.borderColor = ''; this.style.background = ''; });
  });
}

/* ── Wire enrollment form (available on index, enroll, courses pages via modal) ── */
if (document.getElementById('enrollAppForm')) {
  wireApplicationForm({
    formId: 'enrollAppForm', previewId: 'enrollAppPreview',
    submitBtnId: 'enrollAppBtn', editBtnId: 'enrollAppEdit', sendBtnId: 'enrollAppSend',
    required: ['ea-name', 'ea-phone', 'ea-course'],
    messageRowId: 'ea-pm-row', messageKey: 'message', messagePreviewId: 'ea-pm',
    subjectPrefix: 'Enrollment', bodyTitle: 'SAMAJ KATHA FOUNDATION — ENROLLMENT REQUEST',
    successToast: 'Enrollment submitted successfully!',
    fields: [
      { key: 'name', id: 'ea-name', previewId: 'ea-pn', label: 'Name' },
      { key: 'phone', id: 'ea-phone', previewId: 'ea-pp', label: 'Phone' },
      { key: 'school', id: 'ea-school', previewId: 'ea-psc', label: 'School', optional: true },
      { key: 'course', id: 'ea-course', previewId: 'ea-pc', label: 'Course' },
      { key: 'scholarship', id: 'ea-scholar', previewId: 'ea-psl', label: 'Scholarship', badge: true },
      { key: 'message', id: 'ea-msg', previewId: 'ea-pm', label: 'Message', optional: true }
    ]
  });
}

/* ── Wire volunteer form (enroll.html only) ── */
if (document.getElementById('volAppForm')) {
  wireApplicationForm({
    formId: 'volAppForm', previewId: 'volAppPreview',
    submitBtnId: 'volAppBtn', editBtnId: 'volAppEdit', sendBtnId: 'volAppSend',
    required: ['va-name', 'va-phone', 'va-role'],
    messageRowId: 'va-pm-row', messageKey: 'message', messagePreviewId: 'va-pm',
    subjectPrefix: 'Volunteer Application', bodyTitle: 'SAMAJ KATHA FOUNDATION — VOLUNTEER APPLICATION',
    successToast: 'Volunteer application submitted successfully!',
    fields: [
      { key: 'name', id: 'va-name', previewId: 'va-pn', label: 'Name' },
      { key: 'phone', id: 'va-phone', previewId: 'va-pp', label: 'Phone' },
      { key: 'occupation', id: 'va-occ', previewId: 'va-poc', label: 'Occupation', optional: true },
      { key: 'role', id: 'va-role', previewId: 'va-pr', label: 'Help With' },
      { key: 'availability', id: 'va-avail', previewId: 'va-pav', label: 'Availability', optional: true },
      { key: 'message', id: 'va-msg', previewId: 'va-pm', label: 'Message', optional: true }
    ]
  });
}

/* ── Wire parent form (enroll.html only) ── */
if (document.getElementById('parentAppForm')) {
  wireApplicationForm({
    formId: 'parentAppForm', previewId: 'parentAppPreview',
    submitBtnId: 'parentAppBtn', editBtnId: 'parentAppEdit', sendBtnId: 'parentAppSend',
    required: ['pa-name', 'pa-phone', 'pa-msg'],
    messageRowId: 'pa-pm-row', messageKey: 'message', messagePreviewId: 'pa-pm',
    subjectPrefix: 'Parent Concern', bodyTitle: 'SAMAJ KATHA FOUNDATION — PARENT CONCERN',
    successToast: 'Your message has been submitted successfully!',
    fields: [
      { key: 'name', id: 'pa-name', previewId: 'pa-pn', label: 'Name' },
      { key: 'phone', id: 'pa-phone', previewId: 'pa-pp', label: 'Phone' },
      { key: 'message', id: 'pa-msg', previewId: 'pa-pm', label: 'Concern' }
    ]
  });
}

/* ── Application popup modals ── */
(function () {
  const appPairs = [
    { btn: document.getElementById('enrollAppToggle'), overlay: document.getElementById('enrollAppModal') },
    { btn: document.getElementById('volAppToggle'), overlay: document.getElementById('volAppModal') },
    { btn: document.getElementById('schoolAppToggle'), overlay: document.getElementById('schoolAppModal') },
    { btn: document.getElementById('parentAppToggle'), overlay: document.getElementById('parentAppModal') }
  ];

  function openAppModal(overlay) {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const closeBtn = overlay.querySelector('.app-modal-close');
    if (closeBtn) closeBtn.focus();
  }
  function closeAppModal(overlay, btn) {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (btn) btn.focus();
  }

  appPairs.forEach(({ btn, overlay }) => {
    if (!overlay) return;
    const closeBtn = overlay.querySelector('.app-modal-close');
    if (btn) btn.addEventListener('click', () => openAppModal(overlay));
    if (closeBtn) closeBtn.addEventListener('click', () => closeAppModal(overlay, btn));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAppModal(overlay, btn); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeAppModal(overlay, btn);
    });
  });

  // [data-open-app] triggers from anywhere
  document.querySelectorAll('[data-open-app]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      const targetId = trigger.dataset.openApp;
      const pair = appPairs.find(p => p.btn && p.btn.id === targetId);
      if (pair) openAppModal(pair.overlay);
      else {
        // Fallback: target is a modal id directly
        const overlay = document.getElementById(targetId);
        if (overlay) openAppModal(overlay);
      }
    });
  });

  // Expose openAppModal globally so includes.js nav CTA can use it
  window.openAppModal = openAppModal;
})();

/* ── Contact modals (team page) ── */
['dhrub', 'arup'].forEach(name => {
  const trigger = document.getElementById(name + 'Trigger');
  const overlay = document.getElementById(name + 'Modal');
  const closeBtn = document.getElementById(name + 'ModalClose');
  if (!trigger || !overlay) return;
  function openModal() { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; if (closeBtn) closeBtn.focus(); }
  function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = ''; trigger.focus(); }
  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); } });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
});

/* ── Donate / UPI modal ── */
(function () {
  const UPI_ID = '89002294@axl';
  const PAYEE = 'Samaj Katha Foundation';
  const NOTE = 'Donation to Samaj Katha Foundation';
  const upiUri = 'upi://pay?pa=' + encodeURIComponent(UPI_ID) + '&pn=' + encodeURIComponent(PAYEE) + '&cu=INR&tn=' + encodeURIComponent(NOTE);

  const overlay = document.getElementById('donateModal');
  if (!overlay) return;
  const closeBtn = document.getElementById('donateModalClose');
  const copyBtn = document.getElementById('donateCopyBtn');
  const qrImg = document.getElementById('donateQrImg');
  const payBtn = document.getElementById('donatePayBtn');

  if (qrImg) qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=336x336&data=' + encodeURIComponent(upiUri);
  if (payBtn) payBtn.setAttribute('href', upiUri);

  function openDonate() { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; if (closeBtn) closeBtn.focus(); }
  function closeDonate() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  // Float donate → support.html on other pages, donate modal on support.html
  const floatBtn = document.getElementById('floatDonate');
  if (floatBtn) {
    if (document.body.dataset.page === 'support') {
      floatBtn.addEventListener('click', e => { e.preventDefault(); openDonate(); });
    }
    // Otherwise floatDonate href="support.html" — no JS override needed
  }

  ['donateMainBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); openDonate(); });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDonate);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeDonate(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeDonate(); });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      function markCopied() { copyBtn.classList.add('copied'); toast('UPI ID copied!'); setTimeout(() => copyBtn.classList.remove('copied'), 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(UPI_ID).then(markCopied).catch(() => { fallbackCopy(UPI_ID); markCopied(); });
      } else { fallbackCopy(UPI_ID); markCopied(); }
    });
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
})();

/* ── Back to top ── */
const bttBtn = document.getElementById('btt');
if (bttBtn) bttBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── Float donate: hide when #support is visible ── */
(function () {
  const floatBtn = document.getElementById('floatDonate');
  const supSec = document.getElementById('support');
  if (!floatBtn || !supSec) return;
  const obs = new IntersectionObserver(entries => {
    floatBtn.classList.toggle('hide', entries[0].isIntersecting);
  }, { threshold: 0.15 });
  obs.observe(supSec);
})();

/* ── Footer accordion (Terms & Verify) ── */
(function () {
  const pairs = [
    { btn: document.getElementById('termsToggle'), panel: document.getElementById('termsPanel') },
    { btn: document.getElementById('verifyToggle'), panel: document.getElementById('verifyPanel') }
  ];

  function setState(btn, panel, open) {
    if (!btn || !panel) return;
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  pairs.forEach(({ btn, panel }) => {
    if (!btn || !panel) return;
    setState(btn, panel, false);
    btn.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      setState(btn, panel, !isOpen);
      if (!isOpen) setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    });
  });

  document.querySelectorAll('.fpanel-close').forEach(cb => {
    cb.addEventListener('click', () => {
      const targetBtn = document.getElementById(cb.dataset.close);
      const pair = pairs.find(p => p.btn === targetBtn);
      if (pair) setState(pair.btn, pair.panel, false);
    });
  });
})();

/* ── Photo slideshow (index.html only) ── */
(function () {
  const track = document.getElementById('ssTrack');
  const dotsWrap = document.getElementById('ssDots');
  const counter = document.getElementById('ssCounter');
  const stage = document.getElementById('ssStage');
  const nextBtn = document.getElementById('ssNext');
  const prevBtn = document.getElementById('ssPrev');
  if (!track || !stage) return;

  const slides = track.querySelectorAll('.ss-slide');
  const n = slides.length;
  let idx = 0, timer = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (let i = 0; i < n; i++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'ss-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.querySelectorAll('.ss-dot');

  function render() {
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (counter) counter.textContent = (idx + 1) + ' / ' + n;
  }
  function goTo(i, manual) { idx = (i + n) % n; render(); if (manual) restart(); }
  function next() { goTo(idx + 1); }
  function start() { if (reduceMotion) return; stop(); timer = setInterval(next, 4500); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  if (nextBtn) nextBtn.addEventListener('click', () => goTo(idx + 1, true));
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(idx - 1, true));
  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', start);
  let touchX = null;
  stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; stop(); }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { dx < 0 ? goTo(idx + 1, true) : goTo(idx - 1, true); }
    touchX = null; start();
  }, { passive: true });
  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goTo(idx + 1, true);
    if (e.key === 'ArrowLeft') goTo(idx - 1, true);
  });

  render(); start();
})();

/* ── Global focus trap for open modals ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const openOverlay = document.querySelector('.app-modal-overlay.open, .contact-modal-overlay.open');
  if (!openOverlay) return;
  const focusable = openOverlay.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ── Announce "opens in a new tab" on _blank links ── */
document.querySelectorAll('a[target="_blank"]').forEach(a => {
  const note = document.createElement('span');
  note.className = 'sr-only';
  note.textContent = ' (opens in a new tab)';
  a.appendChild(note);
});

/* ── Active nav sections highlight (single-page scroll, index.html) ── */
(function () {
  const sections = ['about', 'courses', 'mission', 'sectors', 'faq', 'support', 'recognition', 'team', 'enroll'];
  const links = document.querySelectorAll('.nav-links a[href^="#"], .nav-dropdown a[href^="#"]');
  if (!links.length) return;
  function setActive() {
    const scrollY = window.scrollY + 100;
    let current = '';
    sections.forEach(id => { const el = document.getElementById(id); if (el && el.offsetTop <= scrollY) current = id; });
    links.forEach(a => { const h = a.getAttribute('href').replace('#', ''); a.classList.toggle('active', h === current); });
  }
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();
