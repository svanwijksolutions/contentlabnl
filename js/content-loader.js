// ==========================================================================
// Content Lab: js/content-loader.js
// Rendert CMS-content (packages/testimonials/portfolio JSON) in de pagina.
// Draait na DOM-load, onafhankelijk van header/footer fetch.
// ==========================================================================

(function () {
  const isEnglish = window.location.pathname.includes('/en/');
  const t = (nl, en) => (isEnglish ? en : nl);

  function run() {
    renderPackages();
    renderTestimonials();
    renderPortfolio();
    renderBlog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // ---------- Pakketten ----------
  function renderPackages() {
    const containers = document.querySelectorAll('[data-render="packages"]');
    if (!containers.length) return;

    fetch('/content/packages.json')
      .then(r => r.json())
      .then(data => {
        const items = (data.packages || []).sort((a, b) => a.order - b.order);
        containers.forEach(container => {
          const limit = container.getAttribute('data-limit');
          const list = limit ? items.slice(0, parseInt(limit, 10)) : items;
          container.innerHTML = list.map(pkg => `
            <div class="package-card">
              <h3>${escapeHtml(isEnglish ? pkg.title_en : pkg.title_nl)}</h3>
              <p>${escapeHtml(isEnglish ? pkg.description_en : pkg.description_nl)}</p>
              <div class="package-price">${escapeHtml(pkg.price)}</div>
              <a href="${isEnglish ? '/en/contact.html' : '/contact.html'}" class="btn btn-primary">${t('Neem contact op', 'Get in touch')}</a>
            </div>
          `).join('');
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Pakketten konden niet worden geladen.', 'Packages could not be loaded.')}</p>`; });
      });
  }

  // ---------- Testimonials ----------
  function renderTestimonials() {
    const containers = document.querySelectorAll('[data-render="testimonials"]');
    if (!containers.length) return;

    fetch('/content/testimonials.json')
      .then(r => r.json())
      .then(data => {
        const items = data.testimonials || [];
        containers.forEach(container => {
          container.innerHTML = items.map(tItem => `
            <div class="testimonial-card">
              <p class="quote">&ldquo;${escapeHtml(isEnglish ? tItem.quote_en : tItem.quote_nl)}&rdquo;</p>
              <div class="testimonial-footer">
                ${tItem.company_logo ? `
                  <a href="${escapeAttr(tItem.company_url || '#')}" target="_blank" rel="noopener noreferrer">
                    <img class="company-logo" src="${escapeAttr(tItem.company_logo)}" alt="${escapeHtml(tItem.company)}" width="90" height="24" loading="lazy">
                  </a>` : ''}
                <div>
                  <div><strong>${escapeHtml(tItem.reviewer_name)}</strong></div>
                  <div class="testimonial-name">${escapeHtml(tItem.company)}</div>
                </div>
              </div>
            </div>
          `).join('');
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Testimonials konden niet worden geladen.', 'Testimonials could not be loaded.')}</p>`; });
      });
  }

  // ---------- Portfolio ----------
  function renderPortfolio() {
    const containers = document.querySelectorAll('[data-render="portfolio"]');
    if (!containers.length) return;

    fetch('/content/portfolio.json')
      .then(r => r.json())
      .then(data => {
        const items = data.portfolio || [];
        containers.forEach(container => {
          const limit = container.getAttribute('data-limit');
          const list = limit ? items.slice(0, parseInt(limit, 10)) : items;
          if (!list.length) {
            container.innerHTML = `<p class="blog-empty">${t('Binnenkort meer voorbeelden van ons werk.', 'More examples of our work coming soon.')}</p>`;
            return;
          }
          container.innerHTML = list.map(p => `
            <div class="portfolio-card">
              <img src="${escapeAttr(p.cover_image)}" alt="${escapeHtml(isEnglish ? p.title_en : p.title_nl)}" width="800" height="600" loading="lazy">
              <div class="portfolio-body">
                <span class="portfolio-tag">${escapeHtml(p.category)}</span>
                <h3>${escapeHtml(isEnglish ? p.title_en : p.title_nl)}</h3>
                <p>${escapeHtml(isEnglish ? p.description_en : p.description_nl)}</p>
                ${p.result ? `<p class="portfolio-result">${escapeHtml(p.result)}</p>` : ''}
                ${p.link ? `<a href="${escapeAttr(p.link)}" target="_blank" rel="noopener noreferrer">${t('Bekijk project', 'View project')} &rarr;</a>` : ''}
              </div>
            </div>
          `).join('');
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Portfolio kon niet worden geladen.', 'Portfolio could not be loaded.')}</p>`; });
      });
  }

  // ---------- Blog ----------
  function renderBlog() {
    const containers = document.querySelectorAll('[data-render="blog"]');
    if (!containers.length) return;

    fetch('/content/blog.json')
      .then(r => r.json())
      .then(data => {
        const items = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        containers.forEach(container => {
          if (!items.length) {
            container.innerHTML = `<p class="blog-empty">${t('Binnenkort de eerste artikelen. Kom snel terug!', 'The first articles are coming soon. Check back shortly!')}</p>`;
            return;
          }
          container.innerHTML = items.map(post => {
            const dateStr = post.date ? new Date(post.date).toLocaleDateString(isEnglish ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return `
              <a class="blog-card" href="#">
                ${post.cover_image ? `<img src="${escapeAttr(post.cover_image)}" alt="${escapeHtml(isEnglish ? post.title_en : post.title_nl)}" width="400" height="200" loading="lazy">` : ''}
                <div class="blog-body">
                  <span class="blog-date">${dateStr}</span>
                  <h3>${escapeHtml(isEnglish ? post.title_en : post.title_nl)}</h3>
                </div>
              </a>
            `;
          }).join('');
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Blog kon niet worden geladen.', 'Blog could not be loaded.')}</p>`; });
      });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function escapeAttr(str) { return escapeHtml(str); }
})();
