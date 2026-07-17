// ==========================================================================
// Content Lab: js/script.js
// ==========================================================================

function init() {
  loadComponents().then(() => {
    initHamburgerMenu();
    initActiveNavLink();
    initLangDropdown();
    initWhatsAppFooterProximity();
    // Pas NU observeren: header/footer staan inmiddels in de DOM.
    // Eerder liep dit synchroon vóór de fetch klaar was, waardoor footer-
    // elementen met .reveal nooit geobserveerd werden en permanent op
    // opacity:0 bleven staan (onzichtbare footer).
    initRevealAnimations();
  });
  initFaqAccordion();
  initContactForm();
  initFooterYear();
  initCookieConsent();
  initStatsCounters();
  initHscrollAndTscrub();
  initOrbit();
}

// ---------- Reveal-on-scroll animaties ----------
let revealObserver;
function initRevealAnimations() {
  const els = Array.from(document.querySelectorAll('.reveal'));

  // Fallback: geen IntersectionObserver → toon alles direct, geen begin-staat.
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('reveal-visible'));
    return;
  }

  // Zet de class die de begin-verborgen-staat activeert (progressive enhancement).
  document.documentElement.classList.add('reveal-ready');

  // Elementen die bij het laden AL (deels) in beeld staan: meteen tonen.
  // Dit voorkomt dat de hero-tekst ooit onzichtbaar blijft.
  const showIfInView = (el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      el.classList.add('reveal-visible');
      return true;
    }
    return false;
  };

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  els.forEach(el => {
    if (!showIfInView(el)) {
      revealObserver.observe(el);
    }
  });

  // Veiligheidsnet 1: kort na load nogmaals alles checken dat in beeld staat.
  requestAnimationFrame(() => els.forEach(showIfInView));

  // Veiligheidsnet 2: mocht er iets misgaan, toon na 1.5s alles wat zichtbaar hoort.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.reveal-visible)').forEach(showIfInView);
  }, 1500);
}

// Wordt aangeroepen door content-loader.js nadat dynamische content is ingevoegd
window.observeReveal = function (container) {
  const els = Array.from(container.querySelectorAll('.reveal'));
  if (!revealObserver) {
    els.forEach(el => el.classList.add('reveal-visible'));
    return;
  }
  const vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      el.classList.add('reveal-visible');
    } else {
      revealObserver.observe(el);
    }
  });
};

// ---------- Header + Footer laden via fetch() ----------
function loadComponents() {
  const isEnglish = window.location.pathname.includes('/en/');
  const headerFile = isEnglish ? '/components/header-en.html' : '/components/header.html';
  const footerFile = isEnglish ? '/components/footer-en.html' : '/components/footer.html';

  const headerPlaceholder = document.getElementById('header-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  const headerPromise = headerPlaceholder
    ? fetch(headerFile).then(r => r.text()).then(html => { headerPlaceholder.innerHTML = html; })
    : Promise.resolve();

  const footerPromise = footerPlaceholder
    ? fetch(footerFile).then(r => r.text()).then(html => { footerPlaceholder.innerHTML = html; })
    : Promise.resolve();

  return Promise.all([headerPromise, footerPromise]);
}

// ---------- Hamburgermenu (verplichte implementatie) ----------
function initHamburgerMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuLinks = document.querySelectorAll('.mobile-menu a');
  const whatsappFloat = document.querySelector('.whatsapp-float');

  if (!toggle || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    if (whatsappFloat) whatsappFloat.style.display = 'none';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    if (whatsappFloat) whatsappFloat.style.display = 'flex';
  }

  toggle.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  menuLinks.forEach(link => link.addEventListener('click', closeMenu));
}

// ---------- Taal-dropdown met vlaggetjes ----------
function initLangDropdown() {
  const dropdowns = document.querySelectorAll('.lang-dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.lang-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.lang-dropdown.open').forEach(d => d.classList.remove('open'));
      dropdown.classList.toggle('open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.lang-dropdown.open').forEach(d => d.classList.remove('open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.lang-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

// ---------- WhatsApp-knop verandert van kleur nabij de footer ----------
function initWhatsAppFooterProximity() {
  const whatsappFloat = document.querySelector('.whatsapp-float');
  const footer = document.querySelector('.site-footer');
  if (!whatsappFloat || !footer) return;

  function update() {
    const footerRect = footer.getBoundingClientRect();
    const waRect = whatsappFloat.getBoundingClientRect();
    const waCenterY = waRect.top + waRect.height / 2;
    whatsappFloat.classList.toggle('whatsapp-on-dark', footerRect.top <= waCenterY);
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }
  // Meerdere triggers zodat het onder alle omstandigheden werkt.
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(update, { threshold: [0, 0.01, 0.5, 1] }).observe(footer);
  }
  update();
}
function initActiveNavLink() {
  // Volledige pad-vergelijking, met een trailing slash altijd genormaliseerd
  // weggehaald aan beide kanten. De oude aanpak (alleen het laatste stukje na
  // de laatste "/" vergelijken) faalde bij mappagina's als /blog/ of
  // /portfolio/: dat laatste stukje is dan een lege string, wat per ongeluk
  // altijd op "Home" terugviel.
  let current = window.location.pathname;
  if (current.length > 1 && current.endsWith('/')) current = current.slice(0, -1);

  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    let href = link.getAttribute('href');
    if (!href) return;
    if (href.length > 1 && href.endsWith('/')) href = href.slice(0, -1);
    if (href === current) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

// ---------- FAQ Accordion ----------
function initFaqAccordion() {
  const questions = document.querySelectorAll('.faq-question');
  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.getAttribute('data-open') === 'true';

      // Sluit andere items binnen dezelfde categorie (optioneel gedrag: alleen 1 open per keer)
      item.parentElement.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) {
          other.setAttribute('data-open', 'false');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      item.setAttribute('data-open', isOpen ? 'false' : 'true');
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });
}

// ---------- Contactformulier (Web3Forms) ----------
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const resultEl = document.getElementById('form-result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const originalText = submitBtn.textContent;
    const isEnglish = window.location.pathname.includes('/en/');

    submitBtn.textContent = isEnglish ? 'Sending...' : 'Verzenden...';
    submitBtn.disabled = true;
    if (resultEl) resultEl.textContent = '';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Conversie-event naar Google Analytics (Deel 11): meet daadwerkelijke
        // aanvragen, niet alleen paginabezoeken.
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'contact',
            event_label: 'contactformulier'
          });
        }
        if (resultEl) {
          resultEl.textContent = isEnglish
            ? 'Thank you. Your message has been sent successfully.'
            : 'Bedankt. Je bericht is succesvol verzonden.';
        }
        form.reset();
      } else {
        if (resultEl) {
          resultEl.textContent = isEnglish
            ? 'Something went wrong. Please try again or contact us via WhatsApp.'
            : 'Er ging iets mis. Probeer het opnieuw of neem contact op via WhatsApp.';
        }
      }
    } catch (error) {
      if (resultEl) {
        resultEl.textContent = isEnglish
          ? 'Something went wrong. Please try again or contact us via WhatsApp.'
          : 'Er ging iets mis. Probeer het opnieuw of neem contact op via WhatsApp.';
      }
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ---------- Footer jaartal ----------
function initFooterYear() {
  const interval = setInterval(() => {
    const yearEl = document.getElementById('footer-year');
    const creditEls = document.querySelectorAll('.footer-credit-year');
    if (yearEl || creditEls.length) {
      const year = new Date().getFullYear();
      if (yearEl) yearEl.textContent = year;
      creditEls.forEach(el => { el.textContent = year; });
      clearInterval(interval);
    }
  }, 100);
  setTimeout(() => clearInterval(interval), 3000);
}

// ---------- Cookiemelding ----------
const COOKIE_CONSENT_KEY = 'cookie_consent';

function initCookieConsent() {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored !== 'accepted' && stored !== 'rejected') {
    showCookieBanner();
  }

  const settingsBtn = document.getElementById('cookie-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (!document.querySelector('.cookie-banner')) showCookieBanner();
    });
  }
}

function showCookieBanner() {
  const isEnglish = window.location.pathname.includes('/en/');
  const privacyHref = isEnglish ? '/en/privacy.html' : '/privacy.html';
  const text = isEnglish
    ? `We use cookies to improve our website and analyze traffic. Read more in our <a href="${privacyHref}">privacy policy</a>.`
    : `We gebruiken cookies om onze website te verbeteren en verkeer te analyseren. Lees meer in ons <a href="${privacyHref}">privacybeleid</a>.`;
  const rejectLabel = isEnglish ? 'Decline' : 'Weigeren';
  const acceptLabel = isEnglish ? 'Accept' : 'Accepteren';

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', isEnglish ? 'Cookie notice' : 'Cookiemelding');
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <p>${text}</p>
      <div class="cookie-banner-actions">
        <button type="button" class="btn btn-secondary cookie-reject">${rejectLabel}</button>
        <button type="button" class="btn btn-primary cookie-accept">${acceptLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  document.body.classList.add('cookie-banner-open');
  requestAnimationFrame(() => banner.classList.add('cookie-banner-visible'));

  function updateConsent(choice) {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: choice === 'accepted' ? 'granted' : 'denied'
      });
    }
    banner.classList.remove('cookie-banner-visible');
    document.body.classList.remove('cookie-banner-open');
    setTimeout(() => banner.remove(), 400);
  }

  banner.querySelector('.cookie-accept').addEventListener('click', () => updateConsent('accepted'));
  banner.querySelector('.cookie-reject').addEventListener('click', () => updateConsent('rejected'));
}

// ---------- Tellers (homepage) ----------
function initStatsCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => { el.textContent = el.dataset.count; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      if (reduced) {
        el.textContent = target;
      } else {
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ---------- Testimonial-slider (CMS-proof) ----------
// Wordt aangeroepen door content-loader.js nadat de testimonials uit het
// CMS zijn ingevoegd als <div class="quote-item"> in #clQuotes: dit script
// telt zelf hoeveel items er zijn en bouwt de dots, dus elk aantal CMS-
// items werkt zonder aanpassing hier.
window.initQuoteSlider = function () {
  const quotesWrap = document.getElementById('clQuotes');
  const dotsWrap = document.getElementById('clQuoteDots');
  if (!quotesWrap || !dotsWrap) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quotes = Array.from(quotesWrap.querySelectorAll('.quote-item'));
  dotsWrap.innerHTML = '';
  if (!quotes.length) return;

  quotes.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
    b.addEventListener('click', () => { show(i); restart(); });
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('button'));

  let index = 0, timer;
  function show(i) {
    index = i;
    quotes.forEach((q, j) => q.classList.toggle('active', j === i));
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
  }
  function restart() {
    clearInterval(timer);
    if (!reduced && quotes.length > 1) {
      timer = setInterval(() => show((index + 1) % quotes.length), 6000);
    }
  }
  show(0);
  restart();
};

// ---------- Horizontale pakketten-scroll + tekst-scrub (gedeelde rAF-loop) ----------
function initHscrollAndTscrub() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hscroll = document.querySelector('.hscroll-section');
  const htrack = document.querySelector('.hscroll-track');
  const tscrub = document.querySelector('.tscrub-section');
  const tscrubText = document.querySelector('.tscrub-pin p');

  let words = [];
  if (tscrubText) {
    const parts = [];
    tscrubText.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/\s+/).filter(Boolean).forEach(w => parts.push('<span class="tscrub-word">' + w + '</span>'));
      } else if (node.nodeType === 1) {
        node.textContent.split(/\s+/).filter(Boolean).forEach(w => parts.push('<span class="tscrub-word hl">' + w + '</span>'));
      }
    });
    tscrubText.innerHTML = parts.join(' ');
    words = Array.from(tscrubText.querySelectorAll('.tscrub-word'));
    if (reduced) words.forEach(w => w.classList.add('on'));
  }

  if (reduced || (!hscroll && !tscrub)) return;

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function sectionProgress(section) {
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return total > 0 ? clamp01(-rect.top / total) : 0;
  }

  let ticking = false;
  function renderAll() {
    if (hscroll && htrack) {
      const p = sectionProgress(hscroll);
      const max = Math.max(0, htrack.scrollWidth - window.innerWidth);
      htrack.style.transform = 'translateX(' + (-p * max) + 'px)';
    }
    if (tscrub && words.length) {
      const p = sectionProgress(tscrub);
      // Woorden zijn volledig gekleurd bij 30% scrollvoortgang (niet pas bij
      // 100%), zodat het effect eerder "klaar" is en er geen lege scrollruimte
      // overblijft waarin alle tekst al gekleurd is maar de sectie nog doorloopt.
      const active = Math.min(words.length, Math.ceil((p / 0.3) * words.length));
      words.forEach((w, i) => w.classList.toggle('on', i < active));
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(renderAll); }
  }, { passive: true });
  window.addEventListener('resize', renderAll);
  renderAll();
}

// ---------- Orbit (homepage, vervangt "Van idee tot resultaat") ----------
// Gebruikt dezelfde iconen als de vorige netwerkdiagram-sectie, evenwichtig
// verdeeld over twee banen. Posities worden berekend (niet hardcoded) zodat
// het aantal iconen kan wijzigen zonder dat de CSS/HTML hoeft te worden aangepast.
function initOrbit() {
  const mount = document.getElementById('orbit');
  if (!mount) return;

  const icons = [
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
    '<path d="M10 10 7 7"/><path d="m10 14-3 3"/><path d="m14 10 3-3"/><path d="m14 14 3 3"/><path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/><path d="M19.637 14a4 4 0 1 1-5.432 5.868"/><path d="M4.367 10a4 4 0 1 1 5.438-5.862"/><path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/><rect x="10" y="8" width="4" height="8" rx="1"/>',
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
    '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'
  ];

  const half = Math.ceil(icons.length / 2);
  const lane1Icons = icons.slice(0, half);
  const lane2Icons = icons.slice(half);

  mount.innerHTML = `
    <div class="orbit-lane l1"></div>
    <div class="orbit-lane l2"></div>
    <div class="orbit-spin l1" data-lane="1"></div>
    <div class="orbit-spin l2" data-lane="2"></div>
    <div class="orbit-core"><img src="/assets/images/logo.png" alt="Content Lab" width="60" height="64"></div>
  `;

  const lane1El = mount.querySelector('.orbit-spin[data-lane="1"]');
  const lane2El = mount.querySelector('.orbit-spin[data-lane="2"]');

  function place(container, list, radiusPct) {
    const n = list.length;
    list.forEach((svgInner, i) => {
      const angle = (360 / n) * i - 90;
      const rad = angle * Math.PI / 180;
      const x = 50 + radiusPct * Math.cos(rad);
      const y = 50 + radiusPct * Math.sin(rad);
      const sat = document.createElement('div');
      sat.className = 'orbit-sat';
      sat.style.left = x + '%';
      sat.style.top = y + '%';
      sat.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + svgInner + '</svg>';
      container.appendChild(sat);
    });
  }

  place(lane1El, lane1Icons, 35);
  place(lane2El, lane2Icons, 50);
}

// ---------- Start ----------
// Aanroepen ONDERAAN het bestand, zodat alle functies en `let`-declaraties
// (zoals revealObserver) al geïnitialiseerd zijn voordat init() draait.
// Dit voorkomt een "Cannot access before initialization"-fout die anders het
// hele script zou laten crashen en tekst onzichtbaar zou maken.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
