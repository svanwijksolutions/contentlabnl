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
