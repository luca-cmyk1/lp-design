document.addEventListener('DOMContentLoaded', () => {
  // Page-Load Intro — auf false setzen zum Reaktivieren
  var INTRO_ENABLED = false;
  var intro = document.getElementById('site-intro');
  var hero = document.querySelector('.hero');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var startHero = function () {
    document.body.classList.remove('is-intro');
    if (hero) hero.classList.add('is-ready');
  };
  var removeIntro = function () {
    if (!intro) return;
    intro.classList.add('is-exit');
    window.setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 600);
  };
  if (!INTRO_ENABLED || reduceMotion || !intro) {
    startHero();
    if (intro) intro.style.display = 'none';
  } else {
    document.body.classList.add('is-intro');
    // 1) dunkel leer  2) LP erscheint  3) Übergang zum Hero
    window.setTimeout(function () { intro.classList.add('is-show'); }, 900);
    window.setTimeout(function () {
      intro.classList.add('is-bridge');
      startHero();
    }, 2200);
    window.setTimeout(removeIntro, 3900);
  }

  // Sanftes Scrollen zu Abschnitten
  var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var smoothScrollTo = function (targetY, duration) {
    var startY = window.scrollY;
    var distance = targetY - startY;
    var startTime = null;
    var step = function (timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (id && !target) return;
      e.preventDefault();
      var targetY = 0;
      if (target) {
        var scrollMarginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        targetY = target.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
      }
      smoothScrollTo(targetY, 1100);
    });
  });

  // Scroll-Reveal
  var revealEls = document.querySelectorAll('.reveal');
  var photoStrip = document.querySelector('.photo-strip');
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

    if (photoStrip) {
      var stripIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            stripIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      stripIo.observe(photoStrip);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    if (photoStrip) photoStrip.classList.add('is-visible');
  }

  // Menü im Headerbild
  var heroNav = document.querySelector('.hero-nav');
  var heroSection = document.querySelector('.hero');
  if (heroNav && heroSection) {
    var NAV_FIXED_TOP = 20;
    var NAV_ABSOLUTE_BOTTOM_GAP = 28;
    var navSwitchThreshold = heroNav.offsetHeight + NAV_FIXED_TOP + NAV_ABSOLUTE_BOTTOM_GAP;
    var onNavScroll = function () {
      var heroBottom = heroSection.getBoundingClientRect().bottom;
      heroNav.classList.toggle('is-fixed', heroBottom <= navSwitchThreshold);
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    window.addEventListener('resize', function () {
      navSwitchThreshold = heroNav.offsetHeight + NAV_FIXED_TOP + NAV_ABSOLUTE_BOTTOM_GAP;
      onNavScroll();
    });
    onNavScroll();

    var heroNavLinks = heroNav.querySelectorAll('.nav-link');
    heroNavLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        heroNavLinks.forEach(function (l) { l.classList.remove('nav-link--active'); });
        link.classList.add('nav-link--active');
      });
    });
  }

  // Custom cursor + soft follower (Eliot-Referenz)
  var cursor = document.getElementById('site-cursor');
  var cursorDot = document.getElementById('site-cursor-dot');
  var canFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!reduceMotion && canFinePointer && cursor && cursorDot) {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var tx = cx;
    var ty = cy;
    var rafCursor = null;
    var tickCursor = function () {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      cursorDot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      rafCursor = window.requestAnimationFrame(tickCursor);
    };
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
      cursorDot.classList.add('is-on');
      if (!rafCursor) rafCursor = window.requestAnimationFrame(tickCursor);
    }, { passive: true });
    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-on');
      cursorDot.classList.remove('is-on');
    });
    document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });
  } else {
    document.body.classList.add('has-native-cursor');
  }

  // Kontaktformular
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var CONTACT_EMAIL = '[DEINE E-MAIL]';

    var showError = function (field, message) {
      var input = contactForm.elements[field];
      var errorEl = document.getElementById('cf-' + field + '-error');
      if (message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        input.setAttribute('aria-invalid', 'true');
      } else {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
        input.removeAttribute('aria-invalid');
      }
    };

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('cf-status');
      var valid = true;

      var name = contactForm.elements.name.value.trim();
      if (!name) { showError('name', 'Bitte gib deinen Namen ein.'); valid = false; } else { showError('name', ''); }

      var email = contactForm.elements.email.value.trim();
      if (!email || !contactForm.elements.email.checkValidity()) { showError('email', 'Bitte gib eine gültige E-Mail-Adresse ein.'); valid = false; } else { showError('email', ''); }

      var message = contactForm.elements.message.value.trim();
      if (!message) { showError('message', 'Sag kurz, worum es geht.'); valid = false; } else { showError('message', ''); }

      if (!valid) {
        status.textContent = 'Bitte prüfe die markierten Felder.';
        return;
      }

      var subject = 'Projektanfrage von ' + name;
      var body = message + '\n\n— ' + name + ' (' + email + ')';
      status.textContent = 'Öffnet dein E-Mail-Programm …';
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
});
