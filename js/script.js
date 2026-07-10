// ==========================================================================
// Content Lab: js/script.js
// ==========================================================================

// Verplicht init-pattern: readyState-check ipv alleen DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  loadComponents().then(() => {
    initHamburgerMenu();
    initActiveNavLink();
    initLangDropdown();
    initWhatsAppFooterProximity();
  });
  initFaqAccordion();
  initContactForm();
  initFooterYear();
  initRevealAnimations();
}

// ---------- Reveal-on-scroll animaties ----------
let revealObserver;
function initRevealAnimations() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// Wordt aangeroepen door content-loader.js nadat dynamische content is ingevoegd
window.observeReveal = function (container) {
  if (!revealObserver) return;
  container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      whatsappFloat.classList.toggle('whatsapp-on-dark', entry.isIntersecting);
    });
  }, { threshold: 0 });

  observer.observe(footer);
}
function initActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.split('/').pop() === current) {
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
  // Wordt na component-load opnieuw aangeroepen vanuit loadComponents indien nodig
  const interval = setInterval(() => {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
      clearInterval(interval);
    }
  }, 100);
  setTimeout(() => clearInterval(interval), 3000);
}
