/**
 * Nav Reveal — scroll-triggered stagger entrance
 *
 * Nav stays hidden during the orbit animation.
 * When the trigger element enters the viewport (content after orbit),
 * the nav slides down with staggered child reveals.
 * Scrolling back into orbit hides it again.
 */

export function initNavReveal(navSelector, triggerSelector) {
  var nav = document.querySelector(navSelector);
  var trigger = document.querySelector(triggerSelector);
  if (!nav || !trigger) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        nav.classList.add('revealed');
      } else if (entry.boundingClientRect.top > 0) {
        nav.classList.remove('revealed');
      }
    });
  }, { threshold: 0 });

  observer.observe(trigger);
}
