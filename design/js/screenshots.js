export function initScreenshots(selectors) {
  var container = document.querySelector(selectors.container);
  var scene = document.querySelector(selectors.scene);
  if (!container || !scene) return;

  var header = scene.querySelector('.screenshots-header');
  var track  = scene.querySelector('.screenshots-track');
  var cards  = Array.from(scene.querySelectorAll('.screenshot-card'));
  var dots   = Array.from(scene.querySelectorAll('.screenshots-dot'));
  var detail = scene.querySelector('.screenshot-detail');
  var detailTitle = detail.querySelector('.detail-title');
  var detailDesc  = detail.querySelector('.detail-desc');

  var N = cards.length;
  var activeIndex = 0;
  var detailOpen = false;

  function getProgress() {
    var rect = container.getBoundingClientRect();
    var scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / scrollable));
  }

  function smoothstep(edge0, edge1, x) {
    var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getTrackMetrics() {
    var trackW = track.scrollWidth;
    var viewW = scene.offsetWidth;
    return { maxShift: trackW - viewW, viewW: viewW };
  }

  function scrollToCard(i) {
    var metrics = getTrackMetrics();
    var cardRect = cards[i].getBoundingClientRect();
    var cardCenter = cardRect.left + cardRect.width / 2;
    var viewCenter = metrics.viewW / 2;
    var offset = cardCenter - viewCenter;

    // Skip scroll if card is already near center
    if (Math.abs(offset) < 10) return;

    var p = getProgress();
    var currentSlideT = smoothstep(0.06, 0.92, p);
    var currentShift = currentSlideT * metrics.maxShift;

    var targetShift = Math.max(0, Math.min(currentShift + offset, metrics.maxShift));
    var targetSlideT = metrics.maxShift > 0 ? targetShift / metrics.maxShift : 0;
    targetSlideT = Math.max(0, Math.min(1, targetSlideT));

    // Analytical inverse of smoothstep: 3t²-2t³ = v  →  t = 0.5 - sin(asin(1-2v)/3)
    var t = 0.5 - Math.sin(Math.asin(1 - 2 * targetSlideT) / 3);
    var targetP = t * 0.86 + 0.06;

    // Don't scroll backward if the track is already at its limit
    if (offset > 0 && targetP < p) return;
    if (offset < 0 && targetP > p) return;

    var containerRect = container.getBoundingClientRect();
    var scrollable = container.offsetHeight - window.innerHeight;
    var targetScrollY = window.scrollY + containerRect.top + targetP * scrollable;

    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }

  function render() {
    var p = getProgress();

    // Header entrance
    var headerT = smoothstep(0.0, 0.08, p);
    header.style.opacity = headerT;
    header.style.transform = 'translateY(' + lerp(20, 0, headerT) + 'px)';

    // Horizontal scroll: 0.06–0.92 maps to full track shift
    var slideT = smoothstep(0.06, 0.92, p);
    var metrics = getTrackMetrics();
    var shift = slideT * metrics.maxShift;
    track.style.transform = 'translateX(' + (-shift) + 'px)';

    // Determine active card (closest to center)
    var centerX = metrics.viewW / 2;
    var best = 0;
    var bestDist = Infinity;
    for (var i = 0; i < N; i++) {
      var cardRect = cards[i].getBoundingClientRect();
      var cardCenter = cardRect.left + cardRect.width / 2;
      var dist = Math.abs(cardCenter - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    if (best !== activeIndex) {
      cards[activeIndex].classList.remove('active');
      dots[activeIndex].classList.remove('active');
      activeIndex = best;
      cards[activeIndex].classList.add('active');
      dots[activeIndex].classList.add('active');
    }

    requestAnimationFrame(render);
  }

  // Click to scroll-center card + show detail
  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      var title = card.getAttribute('data-title');
      var desc = card.getAttribute('data-desc');
      detailTitle.textContent = title;
      detailDesc.textContent = desc;
      detail.classList.add('open');
      detailOpen = true;

      scrollToCard(i);
    });
  });

  // Close detail
  var closeBtn = detail.querySelector('.detail-close');
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    detail.classList.remove('open');
    detailOpen = false;
  });

  // Close on click outside
  scene.addEventListener('click', function (e) {
    if (detailOpen && !detail.contains(e.target) && !e.target.closest('.screenshot-card')) {
      detail.classList.remove('open');
      detailOpen = false;
    }
  });

  // Init first card as active
  if (cards.length) {
    cards[0].classList.add('active');
    dots[0].classList.add('active');
  }

  requestAnimationFrame(render);
}
