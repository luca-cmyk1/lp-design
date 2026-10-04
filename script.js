document.addEventListener('DOMContentLoaded', () => {
  // Sanftes, etwas langsameres Scrollen zu Abschnitten (ersetzt den abrupten nativen Sprung)
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

  // Menü im Headerbild: wird fix am oberen Rand, sobald der Hero-Bereich wegscrollt
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

    // Angeklickter Menüpunkt wird als aktive schwarze Pill markiert
    var heroNavLinks = heroNav.querySelectorAll('.nav-link');
    heroNavLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        heroNavLinks.forEach(function (l) { l.classList.remove('nav-link--active'); });
        link.classList.add('nav-link--active');
      });
    });
  }

  // Kontaktformular: validiert und öffnet eine vorausgefüllte E-Mail (keine Backend-Anbindung nötig)
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
