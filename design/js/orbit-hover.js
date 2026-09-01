/**
 * Orbit Hover — glow + connector line + info box
 *
 * Plug-and-play: link orbit-hover.css and import this module.
 * Cards need data-hover-title and data-hover-desc attributes.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export function initOrbitHover(sceneSelector) {
  if (!matchMedia('(hover: hover)').matches) return;

  const scene = document.querySelector(sceneSelector);
  if (!scene) return;

  const cards = Array.from(scene.querySelectorAll('.orbit-card'));
  if (!cards.length) return;

  const { box, path, dotStart, dotEnd } = createHoverElements(scene);
  let active = null;

  function dismiss() {
    if (!active) return;
    active = null;
    hideHover(box, path, dotStart, dotEnd);
  }

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (parseFloat(card.style.opacity || 0) < 0.4) return;
      if (card.classList.contains('ejected')) return;
      if (scene.classList.contains('expand-active')) return;
      active = card;
      showHover(card, scene, box, path, dotStart, dotEnd);
    });

    card.addEventListener('mouseleave', () => {
      if (active !== card) return;
      dismiss();
    });
  });

  window.addEventListener('scroll', dismiss, { passive: true });
}

function createHoverElements(scene) {
  const box = document.createElement('div');
  box.className = 'orbit-info-box';
  box.innerHTML = '<div class="orbit-info-title"></div><div class="orbit-info-desc"></div>';
  scene.appendChild(box);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('orbit-connector-svg');

  const path = document.createElementNS(SVG_NS, 'path');
  path.classList.add('orbit-connector-line');

  const dotStart = document.createElementNS(SVG_NS, 'circle');
  dotStart.classList.add('orbit-connector-dot');
  dotStart.setAttribute('r', '3');
  dotStart.style.opacity = '0';

  const dotEnd = document.createElementNS(SVG_NS, 'circle');
  dotEnd.classList.add('orbit-connector-dot');
  dotEnd.setAttribute('r', '2.5');
  dotEnd.style.opacity = '0';

  svg.append(path, dotStart, dotEnd);
  scene.appendChild(svg);

  return { box, path, dotStart, dotEnd };
}

function showHover(card, scene, box, path, dotStart, dotEnd) {
  const isPremium = card.classList.contains('premium');
  const title = card.dataset.hoverTitle || card.querySelector('.orbit-card-label')?.textContent || '';
  const desc = card.dataset.hoverDesc || '';

  box.querySelector('.orbit-info-title').textContent = title;
  box.querySelector('.orbit-info-desc').textContent = desc;
  box.classList.toggle('premium', isPremium);

  const sceneRect = scene.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();

  const cx = cardRect.left + cardRect.width / 2 - sceneRect.left;
  const cy = cardRect.top + cardRect.height / 2 - sceneRect.top;
  const sceneW = sceneRect.width;
  const mid = sceneW / 2;
  var onRight = cx >= mid;

  var gap = 50;
  var boxW = 220;
  var pad = 10;
  if (onRight && cx + cardRect.width / 2 + gap + boxW > sceneW - pad) {
    onRight = false;
  } else if (!onRight && cx - cardRect.width / 2 - gap - boxW < pad) {
    onRight = true;
  }

  positionInfoBox(box, cx, cy, cardRect.width, onRight);
  drawConnector(path, dotStart, dotEnd, cx, cy, cardRect.width, onRight, isPremium);

  requestAnimationFrame(() => {
    box.classList.add('active');
    path.style.strokeDashoffset = '0';
    dotStart.style.opacity = '1';
    dotEnd.style.opacity = '1';
  });
}

function hideHover(box, path, dotStart, dotEnd) {
  box.classList.remove('active');
  dotStart.style.opacity = '0';
  dotEnd.style.opacity = '0';
  const len = path.getTotalLength();
  path.style.strokeDashoffset = len;
}

function positionInfoBox(box, cx, cy, cardW, onRight) {
  var gap = 50;
  var boxW = 220;

  if (onRight) {
    box.style.left = (cx + cardW / 2 + gap) + 'px';
  } else {
    box.style.left = (cx - cardW / 2 - gap - boxW) + 'px';
  }
  box.style.top = (cy - 20) + 'px';
}

function drawConnector(path, dotStart, dotEnd, cx, cy, cardW, onRight, isPremium) {
  var gap = 50;
  var pad = 2;
  var color = isPremium ? '#e8c368' : '#3dd9a4';

  var sx = onRight ? cx + cardW / 2 + pad : cx - cardW / 2 - pad;
  var sy = cy;
  var ex = onRight ? cx + cardW / 2 + gap - pad : cx - cardW / 2 - gap + pad;
  var ey = cy - 10;

  var dx = (ex - sx) * 0.5;
  var d = 'M' + sx + ',' + sy + ' C' + (sx + dx) + ',' + sy + ' ' + (ex - dx) + ',' + ey + ' ' + ex + ',' + ey;

  path.setAttribute('d', d);
  path.classList.toggle('premium', isPremium);

  var len = path.getTotalLength();
  path.style.transition = 'none';
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;

  dotStart.setAttribute('cx', sx);
  dotStart.setAttribute('cy', sy);
  dotStart.setAttribute('fill', color);
  dotEnd.setAttribute('cx', ex);
  dotEnd.setAttribute('cy', ey);
  dotEnd.setAttribute('fill', color);

  requestAnimationFrame(() => {
    path.style.transition = 'stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
  });
}
