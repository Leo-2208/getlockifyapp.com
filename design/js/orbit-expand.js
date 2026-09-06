/**
 * Orbit Expand — click card to eject, expand into detail dialog
 *
 * Two-phase animation:
 *   1. Card flies from orbit to target position (stays as pill)
 *   2. Card expands width + body content fades in
 *
 * Adds 'expand-active' class to scene so hover module can suppress connectors.
 */

export function initOrbitExpand(sceneSelector, orbitAPI) {
  var scene = document.querySelector(sceneSelector);
  if (!scene || !orbitAPI) return;

  var cards = Array.from(scene.querySelectorAll('.orbit-card'));
  var ring = scene.querySelector('.orbit-ring');
  if (!cards.length || !ring) return;

  var activeIndex = -1;
  var closingIndex = -1;
  var expandTimer = null;

  cards.forEach(function(card) {
    card.addEventListener('click', function(e) {
      e.stopPropagation();
      var idx = orbitAPI.getCardIndex(card);
      if (idx < 0 || idx === activeIndex || idx === closingIndex) return;
      if (activeIndex >= 0) closeCard();
      openCard(idx);
    });
  });

  document.addEventListener('click', function(e) {
    if (activeIndex < 0) return;
    if (e.target.closest('.orbit-card.ejected')) return;
    closeCard();
  });

  window.addEventListener('scroll', function() {
    if (activeIndex < 0) return;
    var p = orbitAPI.getProgress();
    if (p > 0.58 || p < 0.12) closeCard();
  }, { passive: true });

  function openCard(idx) {
    var card = cards[idx];
    var sceneRect = scene.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var isMobile = window.innerWidth <= 768 || !matchMedia('(hover: hover)').matches;

    var cx = cardRect.left + cardRect.width / 2 - sceneRect.left;
    var mid = sceneRect.width / 2;
    var onRight = cx >= mid;

    var ringCX = ring.getBoundingClientRect().left - sceneRect.left;
    var ringCY = ring.getBoundingClientRect().top - sceneRect.top;

    var expandW = isMobile ? Math.min(window.innerWidth * 0.85, 360) : 280;
    var tx, ty;

    if (isMobile) {
      tx = mid - ringCX;
      ty = -(sceneRect.height * 0.25);
    } else {
      var pad = 24;
      var offset = sceneRect.width * 0.25;
      var targetX;

      if (onRight) {
        targetX = ringCX + offset;
        if (targetX + expandW / 2 > sceneRect.width - pad) targetX = sceneRect.width - pad - expandW / 2;
      } else {
        targetX = ringCX - offset;
        if (targetX - expandW / 2 < pad) targetX = pad + expandW / 2;
      }

      tx = targetX - ringCX;
      ty = -20;
    }

    orbitAPI.ejectCard(idx);
    scene.classList.add('expand-active');
    activeIndex = idx;

    // Phase 1: Fly card to top-center of where dialog will be (centered pill)
    card.style.pointerEvents = 'auto';
    card.style.zIndex = isMobile ? '500' : '300';
    card.style.opacity = '1';
    card.style.transition = 'transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
    card.style.transform = 'translate(-50%, -50%) translate(' + tx + 'px, ' + ty + 'px)';

    // Phase 2: Switch to top-center anchor, expand downward + equally left/right
    expandTimer = setTimeout(function() {
      if (activeIndex !== idx) return;
      expandTimer = null;

      card.style.transition = 'none';
      var pillH = card.offsetHeight;
      var startW = card.offsetWidth;

      var anchorTy = ty - pillH / 2;

      card.classList.add('ejected');
      card.style.width = startW + 'px';
      card.style.transform = 'translate(-50%, 0) translate(' + tx + 'px, ' + anchorTy + 'px)';
      card.offsetWidth;

      card.style.transition = 'width 0.3s ease, padding 0.3s ease';
      card.style.width = expandW + 'px';
      card.style.padding = '20px';

      var body = document.createElement('div');
      body.className = 'orbit-expand-body';
      body.innerHTML =
        '<div class="orbit-expand-desc"></div>' +
        '<button class="orbit-expand-close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<line x1="18" y1="6" x2="6" y2="18"/>' +
          '<line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';
      body.querySelector('.orbit-expand-desc').textContent = card.dataset.expandDesc || card.dataset.hoverDesc || '';
      card.appendChild(body);

      body.querySelector('.orbit-expand-close').addEventListener('click', function(e) {
        e.stopPropagation();
        closeCard();
      });
    }, 480);
  }

  function closeCard() {
    if (activeIndex < 0) return;
    var card = cards[activeIndex];
    var idx = activeIndex;
    activeIndex = -1;
    closingIndex = idx;

    if (expandTimer) {
      clearTimeout(expandTimer);
      expandTimer = null;
    }

    var body = card.querySelector('.orbit-expand-body');
    if (body) card.removeChild(body);
    card.classList.remove('ejected');
    card.style.width = '';
    card.style.padding = '';
    card.style.pointerEvents = '';
    scene.classList.remove('expand-active');

    var pos = orbitAPI.getCardPosition(idx);
    if (pos) {
      card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      card.style.transform = 'translate(-50%, -50%) translate(' + pos.x + 'px, ' + pos.y + 'px) scale(' + pos.scale + ')';
      card.style.opacity = String(pos.opacity);
      card.style.zIndex = String(pos.zIndex);

      setTimeout(function() {
        card.style.transition = '';
        card.style.zIndex = '';
        orbitAPI.returnCard(idx);
        closingIndex = -1;
      }, 420);
    } else {
      card.style.transition = '';
      card.style.transform = 'translate(-50%, -50%) scale(0)';
      card.style.opacity = '0';
      card.style.zIndex = '';
      orbitAPI.returnCard(idx);
      closingIndex = -1;
    }
  }
}
