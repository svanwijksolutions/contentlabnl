// ==========================================================================
// Content Lab: js/content-loader.js
// Rendert CMS-content (packages/testimonials/portfolio/blog JSON) in de pagina.
// Draait na DOM-load, onafhankelijk van header/footer fetch.
// ==========================================================================

(function () {
  const isEnglish = window.location.pathname.includes('/en/');
  const t = (nl, en) => (isEnglish ? en : nl);
  const BLOG_PAGE_SIZE = 15;

  function run() {
    renderPackages();
    renderTestimonials();
    renderPortfolio();
    renderBlog();
    renderBlogPost();
    renderPortfolioDetail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // ---------- Slug-hulpfunctie (voor klikbare detailpagina's, geen apart CMS-veld nodig) ----------
  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ---------- Pakketten ----------
  // Rendert zowel de volledige pakketten-grid (diensten-pagina, [data-render="packages"])
  // als de horizontale scroll-strook op de homepage ([data-render="packages-hscroll"]).
  // Beide lezen uit dezelfde content/packages.json, dus een nieuw pakket in het CMS
  // verschijnt automatisch op beide plekken zonder codewijziging.
  function renderPackages() {
    const containers = document.querySelectorAll('[data-render="packages"]');
    const hscrollContainers = document.querySelectorAll('[data-render="packages-hscroll"]');
    if (!containers.length && !hscrollContainers.length) return;

    fetch('/content/packages.json')
      .then(r => r.json())
      .then(data => {
        const items = (data.packages || []).sort((a, b) => a.order - b.order);

        containers.forEach(container => {
          const limit = container.getAttribute('data-limit');
          const list = limit ? items.slice(0, parseInt(limit, 10)) : items;
          container.innerHTML = list.map((pkg, i) => {
            const features = isEnglish ? (pkg.features_en || []) : (pkg.features_nl || []);
            const featureItems = features.map(f => `
              <li><img src="/assets/icons/check.svg" alt="" width="16" height="16">${escapeHtml(f)}</li>
            `).join('');
            return `
            <div class="package-card reveal" style="transition-delay:${i * 80}ms">
              <div>
                <h3>${escapeHtml(isEnglish ? pkg.title_en : pkg.title_nl)}</h3>
                <p class="package-intro">${escapeHtml(isEnglish ? pkg.intro_en : pkg.intro_nl)}</p>
                <ul class="package-features">${featureItems}</ul>
              </div>
              <div>
                <a href="${isEnglish ? '/en/contact.html' : '/contact.html'}" class="btn btn-primary">${t('Neem contact op', 'Get in touch')}</a>
              </div>
            </div>
          `;
          }).join('');
          requestAnimationFrame(() => window.observeReveal && window.observeReveal(container));
        });

        hscrollContainers.forEach(container => {
          container.innerHTML = items.map(pkg => {
            const teaser = (isEnglish ? pkg.homepage_teaser_en : pkg.homepage_teaser_nl)
              || (isEnglish ? pkg.intro_en : pkg.intro_nl);
            return `
            <div class="hscroll-card">
              <h3>${escapeHtml(isEnglish ? pkg.title_en : pkg.title_nl)}</h3>
              <p>${escapeHtml(teaser)}</p>
              <a href="${isEnglish ? '/en/services.html' : '/diensten.html'}">${t('Meer over dit pakket', 'More about this package')} &rarr;</a>
            </div>
          `;
          }).join('');
          // Herbereken de horizontale scroll-afstand: die hangt af van het
          // aantal kaarten (scrollWidth), en dit vult pas na deze async fetch.
          if (typeof window.refreshHscroll === 'function') window.refreshHscroll();
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Pakketten konden niet worden geladen.', 'Packages could not be loaded.')}</p>`; });
        hscrollContainers.forEach(c => { c.innerHTML = `<p>${t('Pakketten konden niet worden geladen.', 'Packages could not be loaded.')}</p>`; });
      });
  }

  // ---------- Testimonials (slider) ----------
  // Elk CMS-item wordt één <figure class="quote-item">; js/script.js
  // (window.initQuoteSlider) telt de items en bouwt de dots, dus elk
  // aantal testimonials uit het CMS werkt zonder aanpassing hier.
  function renderTestimonials() {
    const containers = document.querySelectorAll('[data-render="testimonials"]');
    if (!containers.length) return;

    fetch('/content/testimonials.json')
      .then(r => r.json())
      .then(data => {
        const items = data.testimonials || [];
        containers.forEach(container => {
          container.innerHTML = items.map((tItem, i) => `
            <figure class="quote-item${i === 0 ? ' active' : ''}">
              <blockquote>${escapeHtml(isEnglish ? tItem.quote_en : tItem.quote_nl)}</blockquote>
              <figcaption>
                ${tItem.company_logo ? `
                  <a href="${escapeAttr(tItem.company_url || '#')}" target="_blank" rel="noopener noreferrer">
                    <img class="company-logo" src="${escapeAttr(tItem.company_logo)}" alt="${escapeHtml(tItem.company)}" width="90" height="24" loading="lazy">
                  </a>` : ''}
                <cite><b>${escapeHtml(tItem.reviewer_name)}</b>${escapeHtml(tItem.company)}</cite>
              </figcaption>
            </figure>
          `).join('');
        });
        if (typeof window.initQuoteSlider === 'function') window.initQuoteSlider();
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Testimonials konden niet worden geladen.', 'Testimonials could not be loaded.')}</p>`; });
      });
  }

  // ---------- Portfolio (grid + filter) ----------
  function renderPortfolio() {
    const containers = document.querySelectorAll('[data-render="portfolio"]');
    if (!containers.length) return;

    fetch('/content/portfolio.json')
      .then(r => r.json())
      .then(data => {
        const items = data.portfolio || [];
        containers.forEach(container => {
          const limit = container.getAttribute('data-limit');
          const full = !limit;

          const allCategories = Array.from(new Set(items.flatMap(p => normalizeCategories(p.category))));

          const filterBar = document.querySelector('[data-portfolio-filter]');
          if (full && filterBar && allCategories.length) {
            filterBar.innerHTML = [
              `<button class="filter-pill active" data-filter="all">${t('Alles', 'All')}</button>`,
              ...allCategories.map(c => `<button class="filter-pill" data-filter="${escapeAttr(c)}">${escapeHtml(c)}</button>`)
            ].join('');

            filterBar.querySelectorAll('.filter-pill').forEach(btn => {
              btn.addEventListener('click', () => {
                filterBar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                paintPortfolio(btn.getAttribute('data-filter'));
              });
            });
          }

          function paintPortfolio(activeFilter) {
            const list = (limit ? items.slice(0, parseInt(limit, 10)) : items).filter(p => {
              if (!activeFilter || activeFilter === 'all') return true;
              return normalizeCategories(p.category).includes(activeFilter);
            });

            if (!list.length) {
              container.innerHTML = `<p class="blog-empty">${t('Geen projecten in deze categorie.', 'No projects in this category.')}</p>`;
              return;
            }

            container.innerHTML = list.map((p, i) => {
              const slug = slugify(isEnglish ? p.title_en : p.title_nl);
              const detailHref = `${isEnglish ? '/en/portfolio/project.html' : '/portfolio/project.html'}?slug=${encodeURIComponent(slug)}`;
              const cats = normalizeCategories(p.category);
              return `
              <a class="portfolio-card reveal" href="${detailHref}" style="transition-delay:${i * 80}ms">
                <div class="portfolio-image-wrap">
                  <img src="${escapeAttr(p.cover_image)}" alt="${escapeHtml(isEnglish ? p.title_en : p.title_nl)}" width="800" height="600" loading="lazy">
                </div>
                <div class="portfolio-body">
                  <div class="portfolio-tags">${cats.map(c => `<span class="portfolio-tag">${escapeHtml(c)}</span>`).join('')}</div>
                  <div class="portfolio-title-row">
                    ${p.company_logo ? `<img class="portfolio-logo-inline" src="${escapeAttr(p.company_logo)}" alt="">` : ''}
                    <h3>${escapeHtml(isEnglish ? p.title_en : p.title_nl)}</h3>
                  </div>
                  <p>${escapeHtml(isEnglish ? p.description_en : p.description_nl)}</p>
                  ${p.result ? `<p class="portfolio-result">${escapeHtml(p.result)}</p>` : ''}
                  <span class="portfolio-view-link">${t('Bekijk project', 'View project')} &rarr;</span>
                </div>
              </a>
            `;
            }).join('');
            requestAnimationFrame(() => window.observeReveal && window.observeReveal(container));
          }

          paintPortfolio('all');
        });
      })
      .catch(() => {
        containers.forEach(c => { c.innerHTML = `<p>${t('Portfolio kon niet worden geladen.', 'Portfolio could not be loaded.')}</p>`; });
      });
  }

  function normalizeCategories(category) {
    if (!category) return [];
    return Array.isArray(category) ? category : [category];
  }

  // ---------- Portfolio detailpagina ----------
  function renderPortfolioDetail() {
    const container = document.querySelector('[data-render="portfolio-detail"]');
    if (!container) return;

    const slug = new URLSearchParams(window.location.search).get('slug');

    fetch('/content/portfolio.json')
      .then(r => r.json())
      .then(data => {
        const items = data.portfolio || [];
        const item = items.find(p => slugify(isEnglish ? p.title_en : p.title_nl) === slug);

        if (!item) {
          container.innerHTML = `
            <div class="detail-not-found">
              <h1>${t('Project niet gevonden', 'Project not found')}</h1>
              <p>${t('Dit project bestaat niet (meer).', 'This project no longer exists.')}</p>
              <a href="${isEnglish ? '/en/portfolio/' : '/portfolio/'}" class="btn btn-primary">${t('Terug naar portfolio', 'Back to portfolio')}</a>
            </div>`;
          return;
        }

        const cats = normalizeCategories(item.category);
        document.title = `${isEnglish ? item.title_en : item.title_nl} | Content Lab`;

        container.innerHTML = `
          <a href="${isEnglish ? '/en/portfolio/' : '/portfolio/'}" class="detail-back">&larr; ${t('Terug naar portfolio', 'Back to portfolio')}</a>
          <div class="detail-tags">${cats.map(c => `<span class="portfolio-tag">${escapeHtml(c)}</span>`).join('')}</div>
          <h1>${escapeHtml(isEnglish ? item.title_en : item.title_nl)}</h1>
          ${item.company_logo ? `<img class="detail-company-logo" src="${escapeAttr(item.company_logo)}" alt="" loading="lazy">` : ''}
          <img class="detail-cover-image" src="${escapeAttr(item.cover_image)}" alt="${escapeHtml(isEnglish ? item.title_en : item.title_nl)}" loading="eager">
          <p class="detail-description">${escapeHtml(isEnglish ? item.description_en : item.description_nl)}</p>
          ${item.result ? `<p class="portfolio-result detail-result">${escapeHtml(item.result)}</p>` : ''}
          ${item.link ? `<a href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">${t('Bekijk live project', 'View live project')} &rarr;</a>` : ''}
        `;
      })
      .catch(() => {
        container.innerHTML = `<p>${t('Project kon niet worden geladen.', 'Project could not be loaded.')}</p>`;
      });
  }

  // ---------- Blog (lijst + paginering) ----------
  function renderBlog() {
    const container = document.querySelector('[data-render="blog"]');
    if (!container) return;

    const searchInput = document.querySelector('[data-blog-search]');

    fetch('/content/blog.json')
      .then(r => r.json())
      .then(data => {
        const allItems = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!allItems.length) {
          container.innerHTML = `<p class="blog-empty">${t('Binnenkort de eerste artikelen. Kom snel terug!', 'The first articles are coming soon. Check back shortly!')}</p>`;
          return;
        }

        let currentPage = 1;
        let items = allItems;

        const pagerBottom = ensurePager('afterend');
        const pagerTop = document.querySelector('[data-blog-pager-top]');

        function ensurePager(position) {
          let p = document.querySelector('[data-blog-pager]');
          if (!p) {
            p = document.createElement('div');
            p.setAttribute('data-blog-pager', '');
            p.className = 'blog-pager';
            container.insertAdjacentElement(position, p);
          }
          return p;
        }

        function matchesSearch(post, query) {
          if (!query) return true;
          const haystack = [post.title_nl, post.title_en, post.body_nl, post.body_en].join(' ').toLowerCase();
          return haystack.includes(query.toLowerCase());
        }

        function renderPagerInto(el, totalPages) {
          if (!el) return;
          if (totalPages <= 1) { el.innerHTML = ''; return; }
          let html = `<button class="pager-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="${t('Vorige pagina', 'Previous page')}">&larr;</button>`;
          for (let p = 1; p <= totalPages; p++) {
            html += `<button class="pager-btn pager-num${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`;
          }
          html += `<button class="pager-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="${t('Volgende pagina', 'Next page')}">&rarr;</button>`;
          el.innerHTML = html;
          el.querySelectorAll('.pager-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const val = btn.getAttribute('data-page');
              if (val === 'prev') currentPage = Math.max(1, currentPage - 1);
              else if (val === 'next') currentPage = Math.min(totalPages, currentPage + 1);
              else currentPage = parseInt(val, 10);
              paint();
              container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          });
        }

        function paint() {
          const totalPages = Math.max(1, Math.ceil(items.length / BLOG_PAGE_SIZE));
          currentPage = Math.min(currentPage, totalPages);

          if (!items.length) {
            container.innerHTML = `<p class="blog-empty">${t('Geen artikelen gevonden voor deze zoekopdracht.', 'No articles found for this search.')}</p>`;
            renderPagerInto(pagerTop, 0);
            renderPagerInto(pagerBottom, 0);
            return;
          }

          const start = (currentPage - 1) * BLOG_PAGE_SIZE;
          const pageItems = items.slice(start, start + BLOG_PAGE_SIZE);

          container.innerHTML = pageItems.map((post, i) => {
            const dateStr = post.date ? new Date(post.date).toLocaleDateString(isEnglish ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const slug = slugify(isEnglish ? post.title_en : post.title_nl);
            const href = `${isEnglish ? '/en/blog/post.html' : '/blog/post.html'}?slug=${encodeURIComponent(slug)}`;
            return `
              <a class="blog-card reveal" href="${href}" style="transition-delay:${(i % BLOG_PAGE_SIZE) * 40}ms">
                ${post.cover_image ? `<img src="${escapeAttr(post.cover_image)}" alt="${escapeHtml(isEnglish ? post.title_en : post.title_nl)}" width="400" height="400" loading="lazy">` : ''}
                <div class="blog-body">
                  <h3>${escapeHtml(isEnglish ? post.title_en : post.title_nl)}</h3>
                  <span class="blog-date">${dateStr}</span>
                </div>
              </a>
            `;
          }).join('');
          requestAnimationFrame(() => window.observeReveal && window.observeReveal(container));

          renderPagerInto(pagerTop, totalPages);
          renderPagerInto(pagerBottom, totalPages);
        }

        if (searchInput) {
          searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim();
            items = allItems.filter(p => matchesSearch(p, q));
            currentPage = 1;
            paint();
          });
        }

        paint();
      })
      .catch(() => {
        container.innerHTML = `<p>${t('Blog kon niet worden geladen.', 'Blog could not be loaded.')}</p>`;
      });
  }

  // ---------- Blog detailpagina ----------
  function renderBlogPost() {
    const container = document.querySelector('[data-render="blog-post"]');
    if (!container) return;

    const slug = new URLSearchParams(window.location.search).get('slug');

    fetch('/content/blog.json')
      .then(r => r.json())
      .then(data => {
        const items = data.posts || [];
        const post = items.find(p => slugify(isEnglish ? p.title_en : p.title_nl) === slug);

        if (!post) {
          container.innerHTML = `
            <div class="detail-not-found">
              <h1>${t('Artikel niet gevonden', 'Article not found')}</h1>
              <p>${t('Dit artikel bestaat niet (meer).', 'This article no longer exists.')}</p>
              <a href="${isEnglish ? '/en/blog/' : '/blog/'}" class="btn btn-primary">${t('Terug naar blog', 'Back to blog')}</a>
            </div>`;
          return;
        }

        const dateStr = post.date ? new Date(post.date).toLocaleDateString(isEnglish ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const bodyMd = (isEnglish ? post.body_en : post.body_nl) || '';
        const bodyHtml = (window.marked && typeof window.marked.parse === 'function')
          ? window.marked.parse(bodyMd)
          : `<p>${escapeHtml(bodyMd)}</p>`;

        document.title = `${isEnglish ? post.title_en : post.title_nl} | Content Lab`;

        container.innerHTML = `
          <a href="${isEnglish ? '/en/blog/' : '/blog/'}" class="detail-back">&larr; ${t('Terug naar blog', 'Back to blog')}</a>
          <span class="blog-date">${dateStr}</span>
          <h1>${escapeHtml(isEnglish ? post.title_en : post.title_nl)}</h1>
          ${post.cover_image ? `<img class="detail-cover-image" src="${escapeAttr(post.cover_image)}" alt="${escapeHtml(isEnglish ? post.title_en : post.title_nl)}" loading="eager">` : ''}
          <div class="blog-post-body">${bodyHtml}</div>
        `;
      })
      .catch(() => {
        container.innerHTML = `<p>${t('Artikel kon niet worden geladen.', 'Article could not be loaded.')}</p>`;
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