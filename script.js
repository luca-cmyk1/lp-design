document.addEventListener('DOMContentLoaded', () => {
  // Scroll-Reveal: Abschnitte faden beim Scrollen sanft ein
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // Schwebender CTA-Button: erscheint nach dem Scrollen
  var floatingCta = document.querySelector('.floating-cta');
  if (floatingCta) {
    var onScroll = function () {
      floatingCta.classList.toggle('is-visible', window.scrollY > 480);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});
