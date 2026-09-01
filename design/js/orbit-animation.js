/**
 * Orbit Animation Engine
 *
 * Scroll-driven animation with continuous spin:
 * 1. Lock opens
 * 2. Cards emerge one-by-one, joining the already-spinning ring
 * 3. Ring spins continuously throughout
 * 4. Cards collapse one-by-one back into lock, leaving the spinning ring
 * 5. Lock closes
 */

export function initOrbitAnimation(selectors) {
  const container = document.querySelector(selectors.container);
  const lock      = document.querySelector(selectors.lock);
  const cards     = Array.from(document.querySelectorAll(selectors.cards));
  const shackle   = lock.querySelector('.lock-shackle');
  const glow      = lock.querySelector('.orbit-lock-glow');
  const ripple    = lock.querySelector('.orbit-lock-ripple');
  const scene     = document.querySelector(selectors.scene);
  const wordmark  = scene.querySelector('.orbit-wordmark');
  const tag       = scene.querySelector('.orbit-tag');

  if (!container || !cards.length) return;

  const N = cards.length;

  function getRadius() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    return {
      x: Math.min(280, vw * 0.22),
      y: Math.min(120, vh * 0.14),
    };
  }

  const cfg = {
    shackleOpen: -38,
    shackleClosed: 0,
    revolutions: 2.5,
  };

  var ENTER_ANGLE = 0;
  var EXIT_ANGLE  = Math.PI;
  var DIR = 1;

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

  /**
   * Phases:
   *  0.00 - 0.08  Locked, static
   *  0.08 - 0.15  Shackle opens
   *  0.15 - 0.85  Continuous spin. Cards emerge 0.15–0.35, collapse 0.65–0.85
   *  0.82 - 0.88  Shackle closes
   *  0.88 - 0.92  Glow pulse + ripple ring
   *  0.90 - 0.95  Wordmark fades in
   *  0.92 - 0.97  Tagline fades in
   *  0.97 - 1.00  Hold
   */
  function render() {
    var p = getProgress();

    // --- Shackle ---
    var openT  = smoothstep(0.08, 0.15, p);
    var closeT = smoothstep(0.82, 0.88, p);
    var shackleAngle = p < 0.5
      ? lerp(cfg.shackleClosed, cfg.shackleOpen, openT)
      : lerp(cfg.shackleOpen, cfg.shackleClosed, closeT);
    shackle.style.transform = 'rotate(' + shackleAngle + 'deg)';

    // --- Glow: visible during orbit, pulses brighter after lock ---
    var glowIn  = smoothstep(0.08, 0.18, p);
    var glowOut = smoothstep(0.65, 0.82, p);
    var glowLock = smoothstep(0.88, 0.92, p);
    if (p < 0.65) {
      glow.style.opacity = glowIn;
    } else if (p < 0.88) {
      glow.style.opacity = 1 - glowOut;
    } else {
      glow.style.opacity = glowLock;
    }

    // --- Ripple: expanding ring after lock closes ---
    var rippleT = smoothstep(0.88, 0.94, p);
    ripple.style.opacity = rippleT < 0.5 ? rippleT * 1.8 : (1 - rippleT) * 1.8;
    ripple.style.transform = 'scale(' + lerp(0.85, 1.6, rippleT) + ')';

    // --- Wordmark: "Lockify" fades in after lock ---
    var wmT = smoothstep(0.90, 0.95, p);
    var lockRect = lock.getBoundingClientRect();
    var sceneRect = scene.getBoundingClientRect();
    var lockCenterY = lockRect.top + lockRect.height / 2 - sceneRect.top;
    var lockCenterX = lockRect.left + lockRect.width / 2 - sceneRect.left;

    wordmark.style.opacity = wmT;
    wordmark.style.transform = 'translate(-50%, 0) translateY(' + lerp(8, 0, wmT) + 'px)';
    wordmark.style.left = lockCenterX + 'px';
    wordmark.style.top = (lockCenterY + lockRect.height / 2 + 28) + 'px';

    // --- Tag: "Local Encrypted Vault" fades in after wordmark ---
    var tagT = smoothstep(0.92, 0.97, p);
    tag.style.opacity = tagT;
    tag.style.transform = 'translate(-50%, 0) translateY(' + lerp(8, 0, tagT) + 'px)';
    tag.style.left = lockCenterX + 'px';
    tag.style.top = (lockCenterY + lockRect.height / 2 + 64) + 'px';

    // --- Continuous orbit: spins from 0.15 to 0.85 ---
    var orbitT = smoothstep(0.15, 0.82, p);
    var fullOrbitAngle = DIR * cfg.revolutions * Math.PI * 2 * orbitT;

    // --- Cards ---
    for (var i = 0; i < N; i++) {
      var card = cards[i];

      var emergeStart = 0.15 + (i / N) * 0.17;
      var emergeEnd   = emergeStart + 0.05;
      var emergeT     = smoothstep(emergeStart, emergeEnd, p);

      var collapseStart = 0.62 + (i / N) * 0.15;
      var collapseEnd   = collapseStart + 0.05;
      var collapseT     = smoothstep(collapseStart, collapseEnd, p);

      var vis = Math.min(emergeT, 1 - collapseT);

      if (vis <= 0.01) {
        card.style.opacity = '0';
        card.style.transform = 'translate(-50%, -50%) scale(0)';
        card.classList.remove('hoverable');
        continue;
      }

      var slotAngle = (i / N) * Math.PI * 2;

      // Current orbit position for this card's slot
      var orbitPos = slotAngle + fullOrbitAngle;

      var angle;
      if (emergeT < 1) {
        // Emerging: blend from entry point into the spinning ring
        angle = lerp(ENTER_ANGLE, orbitPos, emergeT);
      } else if (collapseT > 0) {
        // Collapsing: peel off the spinning ring toward exit (left side)
        var exitTarget = EXIT_ANGLE;
        if (DIR > 0) {
          while (exitTarget <= orbitPos) exitTarget += Math.PI * 2;
        } else {
          while (exitTarget >= orbitPos) exitTarget -= Math.PI * 2;
        }
        angle = lerp(orbitPos, exitTarget, collapseT);
      } else {
        // Fully on the ring
        angle = orbitPos;
      }

      var r = getRadius();
      var x = Math.cos(angle) * r.x * vis;
      var y = Math.sin(angle) * r.y * vis;

      var depthRaw = Math.sin(angle);
      var depthNorm = (depthRaw + 1) / 2;
      var depthScale = lerp(0.6, 1.3, depthNorm);
      var depthOpacity = lerp(0.3, 1.0, depthNorm);

      var finalScale = vis * depthScale;
      var finalOpacity = vis * depthOpacity;
      var zIndex = Math.round(depthNorm * 100);

      card.style.transform =
        'translate(-50%, -50%) translate(' + x + 'px, ' + y + 'px) scale(' + finalScale + ')';
      card.style.opacity = finalOpacity;
      card.style.zIndex = zIndex;
      card.classList.toggle('hoverable', finalOpacity > 0.3);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
