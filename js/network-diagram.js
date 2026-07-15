// ==========================================================================
// Content Lab: js/network-diagram.js
// Rendert het "wat we bieden / wat het oplevert"-diagram op de homepage.
// Vast canvas van 1300x700, wordt via transform:scale() responsive gemaakt
// zodat de interne posities/curves niet opnieuw berekend hoeven te worden.
// ==========================================================================

(function () {
  const mount = document.getElementById('networkDiagram');
  if (!mount) return;

  const isEnglish = window.location.pathname.includes('/en/');

  const topIconsNL = [
    { svg: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' },
    { svg: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>' },
    { svg: '<path d="M10 10 7 7"/><path d="m10 14-3 3"/><path d="m14 10 3-3"/><path d="m14 14 3 3"/><path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/><path d="M19.637 14a4 4 0 1 1-5.432 5.868"/><path d="M4.367 10a4 4 0 1 1 5.438-5.862"/><path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/><rect x="10" y="8" width="4" height="8" rx="1"/>' },
    { svg: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>' },
    { svg: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' },
    { svg: '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>' },
    { svg: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>' },
    { svg: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>' }
  ];

  const bottomIconsNL = [
    { svg: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>' },
    { svg: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>' },
    { svg: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>' }
  ];

  const topIcons = topIconsNL.map((icon, i) => ({ ...icon, cls: 'dark' }));
  const bottomIcons = bottomIconsNL.map((icon, i) => ({ ...icon, cls: 'light' }));
  const icons = [...topIcons, ...bottomIcons];

  const W = 1300, H = 700;
  const hubX = W / 2, hubY = H / 2;
  const n = icons.length;
  const topCount = topIcons.length, bottomCount = bottomIcons.length;
  const nodeW = 104, gap = 28;
  const topRowY = 40, bottomRowY = H - 40 - nodeW;

  function rowXs(count) {
    const totalW = count * nodeW + (count - 1) * gap;
    const startX = (W - totalW) / 2;
    return Array.from({ length: count }, (_, i) => startX + i * (nodeW + gap));
  }
  const topXs = rowXs(topCount);
  const bottomXs = rowXs(bottomCount);

  let svgLines = '', svgDots = '', nodesHtml = '';

  icons.forEach((icon, i) => {
    const isTop = i < topCount;
    const idx = isTop ? i : i - topCount;
    const x = isTop ? topXs[idx] : bottomXs[idx];
    const y = isTop ? topRowY : bottomRowY;
    const boxCenterX = x + nodeW / 2;
    const boxEdgeY = isTop ? y + nodeW : y;
    const bendY = isTop ? hubY - 90 - (idx % 3) * 14 : hubY + 90 + (idx % 3) * 14;

    const path = `M${boxCenterX} ${boxEdgeY} C ${boxCenterX} ${bendY}, ${hubX} ${bendY}, ${hubX} ${hubY}`;
    const cls = isTop ? 'top' : 'bottom';
    const delay = (idx * 0.15).toFixed(2);

    svgLines += `<path class="nd-line ${cls}" d="${path}" style="animation-delay:${delay}s"/>`;
    const dotDuration = (14 + Math.random() * 6).toFixed(1);
    const dotDelay = (parseFloat(delay) + 1.8 + Math.random() * 3).toFixed(2);
    const dotDir = isTop ? 'nd-dots' : 'nd-dots-reversed';
    svgDots += `<path class="nd-dot-path ${cls}" d="${path}" style="animation:${dotDir} ${dotDuration}s linear infinite, nd-fade-in 2s ease-in forwards; animation-delay:${dotDelay}s, ${dotDelay}s;"/>`;

    nodesHtml += `<div class="nd-node" style="left:${x}px; top:${y}px; animation-delay:${delay}s;">
      <div class="nd-badge nd-${icon.cls}">
        <svg viewBox="0 0 24 24" fill="none" stroke="${icon.cls === 'dark' ? '#FFFFFF' : '#262626'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>
      </div>
    </div>`;
  });

  mount.innerHTML = `
    <div class="nd-scale-wrap">
      <div class="nd-canvas" style="width:${W}px; height:${H}px;">
        <svg width="${W}" height="${H}" style="position:absolute; left:0; top:0;">${svgLines}${svgDots}</svg>
        ${nodesHtml}
        <div class="nd-hub">
          <div class="nd-pulse-ring"></div>
          <div class="nd-pulse-ring r2"></div>
          <div class="nd-pulse-ring r3"></div>
          <div class="nd-hub-logo">
            <img src="/assets/images/logo-wit.png" alt="Content Lab" width="56" height="60">
          </div>
        </div>
      </div>
    </div>
  `;

  // Responsive: schaal het vaste 1300x700-canvas naar de beschikbare breedte
  const scaleWrap = mount.querySelector('.nd-scale-wrap');
  const canvas = mount.querySelector('.nd-canvas');

  function applyScale() {
    const available = mount.clientWidth;
    const scale = Math.min(1, available / W);
    canvas.style.transform = `scale(${scale})`;
    scaleWrap.style.height = (H * scale) + 'px';
  }

  applyScale();
  window.addEventListener('resize', applyScale);
})();
