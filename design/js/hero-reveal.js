export function initHeroReveal(selectors) {
  var container = document.querySelector(selectors.container);
  var scene = document.querySelector(selectors.scene);
  if (!container || !scene) return;

  var backdrop = scene.querySelector('.hero-backdrop');
  var glow     = scene.querySelector('.hero-glow');
  var badge    = scene.querySelector('.hero-badge');
  var headline = scene.querySelector('.hero-headline');
  var sub      = scene.querySelector('.hero-sub');
  var ctas     = scene.querySelector('.hero-ctas');
  var content  = scene.querySelector('.hero-content');
  var nav      = document.querySelector('#site-nav');

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

  /*
   * Timeline (progress 0–1 over 350vh of scroll):
   *
   * The hero overlaps the last 150vh of orbit via margin-top: -150vh.
   * From p=0 to ~0.14, both orbit and hero scenes are sticky (both visible).
   * The hero scene is on top (later in DOM). Its backdrop fades from
   * transparent → opaque, smoothly covering the orbit's lock/wordmark.
   * Hero content then builds itself on the now-opaque background.
   *
   * 0.00–0.14  Backdrop fades in (crossfade: orbit → hero bg)
   * 0.05–0.25  Glow fades in
   * 0.10–0.35  Content block shifts up from below
   * 0.12–0.28  Badge fades in
   * 0.20–0.40  Headline fades in
   * 0.35–0.52  Subtitle fades in
   * 0.46–0.60  CTAs fade in
   * 0.28       Nav bar reveals
   * 0.60–1.00  Hold — hero fully assembled
   */
  var navRevealed = false;

  function render() {
    var p = getProgress();

    // Backdrop: transparent → opaque (covers orbit underneath)
    var bgT = smoothstep(0.0, 0.14, p);
    backdrop.style.opacity = bgT;

    // Background glow
    var glowT = smoothstep(0.05, 0.25, p);
    glow.style.opacity = glowT;

    // Hero content block shifts up from below-center
    var shiftT = smoothstep(0.10, 0.35, p);
    content.style.transform = 'translateY(' + lerp(60, 0, shiftT) + 'px)';

    // Badge
    var badgeT = smoothstep(0.12, 0.28, p);
    badge.style.opacity = badgeT;
    badge.style.transform = 'translateY(' + lerp(12, 0, badgeT) + 'px)';

    // Headline
    var headT = smoothstep(0.20, 0.40, p);
    headline.style.opacity = headT;
    headline.style.transform = 'translateY(' + lerp(30, 0, headT) + 'px)';

    // Subtitle
    var subT = smoothstep(0.35, 0.52, p);
    sub.style.opacity = subT;
    sub.style.transform = 'translateY(' + lerp(20, 0, subT) + 'px)';

    // CTAs
    var ctaT = smoothstep(0.46, 0.60, p);
    ctas.style.opacity = ctaT;
    ctas.style.transform = 'translateY(' + lerp(20, 0, ctaT) + 'px)';

    // Nav reveal
    if (nav) {
      if (p > 0.28 && !navRevealed) {
        nav.classList.add('revealed');
        navRevealed = true;
      } else if (p < 0.22 && navRevealed) {
        nav.classList.remove('revealed');
        navRevealed = false;
      }
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
