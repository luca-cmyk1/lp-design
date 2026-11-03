document.addEventListener('DOMContentLoaded', () => {
  // Start-Sequenz: Schwarz → LP → Bild klein → Bild voll → UI
  var INTRO_ENABLED = false;
  var hero = document.querySelector('.hero');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var introDone = false;

  // Hero: volles Viewport, dann leichte Hochzieh-Animation
  var settleHero = function () {
    if (!hero || hero.classList.contains('is-settled')) return;
    hero.classList.add('is-settled');
  };
  if (reduceMotion) {
    settleHero();
  } else {
    window.requestAnimationFrame(function () {
      window.setTimeout(settleHero, 420);
    });
  }

  var lockIntroScroll = function (e) {
    if (!introDone) {
      e.preventDefault();
    }
  };
  var lockIntroKeys = function (e) {
    if (introDone) return;
    var k = e.key;
    if (
      k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp' ||
      k === 'Home' || k === 'End' || k === ' ' || k === 'Spacebar'
    ) {
      e.preventDefault();
    }
  };

  var finishIntro = function () {
    if (!hero || introDone) return;
    hero.classList.add('is-ready');
    introDone = true;
    document.documentElement.classList.remove('is-intro');
    document.body.classList.remove('is-intro');
    window.removeEventListener('wheel', lockIntroScroll, { capture: true });
    window.removeEventListener('touchmove', lockIntroScroll, { capture: true });
    window.removeEventListener('keydown', lockIntroKeys, { capture: true });
    if (lenis && typeof lenis.start === 'function') lenis.start();
    window.scrollTo(0, 0);
    var bg = document.querySelector('.hero-bg');
    if (bg) bg.style.transform = 'translate3d(0, 0, 0)';
  };

  var lenis = null;

  if (!INTRO_ENABLED || reduceMotion || !hero) {
    if (hero) {
      hero.classList.add('is-ready');
    }
    document.documentElement.classList.remove('is-intro');
    document.body.classList.remove('is-intro');
    introDone = true;
  } else {
    introDone = false;
    document.documentElement.classList.add('is-intro');
    document.body.classList.add('is-intro');
    window.scrollTo(0, 0);
    window.addEventListener('wheel', lockIntroScroll, { passive: false, capture: true });
    window.addEventListener('touchmove', lockIntroScroll, { passive: false, capture: true });
    window.addEventListener('keydown', lockIntroKeys, { capture: true });
    window.setTimeout(finishIntro, 400);
  }

  // Leicht weicheres / langsameres Scrollen (ganz subtil)
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.4,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.88
    });
    if (!introDone && typeof lenis.stop === 'function') lenis.stop();
    var rafLenis = function (time) {
      lenis.raf(time);
      window.requestAnimationFrame(rafLenis);
    };
    window.requestAnimationFrame(rafLenis);
  }

  // Sanftes Scrollen zu Abschnitten
  var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var smoothScrollTo = function (targetY, duration) {
    var ms = duration || 1350;
    if (lenis) {
      lenis.scrollTo(targetY, { duration: ms / 1000 });
      return;
    }
    var startY = window.scrollY;
    var distance = targetY - startY;
    var startTime = null;
    var step = function (timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / ms, 1);
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
      smoothScrollTo(targetY, 1350);
    });
  });

  // Scroll-Reveal
  var revealEls = document.querySelectorAll('.reveal');
  var workItems = document.querySelectorAll('.project-card');
  var workTitles = Array.prototype.slice.call(document.querySelectorAll('.work-strip-title'));
  var workKicker = document.querySelector('.work-strip-kicker');
  var whyKicker = document.querySelector('.why-block-kicker');
  var whyGrid = document.querySelector('.why-grid');
  var runTypewriter = function (el, speed) {
    if (!el || el.dataset.typed === '1') return;
    var full = el.getAttribute('data-typewriter') || (el.textContent || '').trim();
    el.setAttribute('data-typewriter', full);
    el.dataset.typed = '1';
    el.classList.add('is-visible');
    if (reduceMotion) {
      el.textContent = full;
      el.classList.add('is-typed');
      return;
    }
    el.textContent = '';
    el.classList.add('is-typing');
    var i = 0;
    var step = function () {
      i += 1;
      el.textContent = full.slice(0, i);
      if (i < full.length) {
        window.setTimeout(step, speed || 42);
      } else {
        el.classList.remove('is-typing');
        el.classList.add('is-typed');
      }
    };
    window.setTimeout(step, 80);
  };
  var showKickerAfter = function (titleEl) {
    var kicker = null;
    if (titleEl.classList.contains('why-block-title')) kicker = whyKicker;
    else kicker = workKicker;
    if (!kicker) return;
    window.setTimeout(function () {
      runTypewriter(kicker, kicker === whyKicker ? 38 : 48);
    }, reduceMotion ? 0 : 280);
  };
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

    if (workItems.length) {
      var workList = Array.prototype.slice.call(workItems);
      var workIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var index = workList.indexOf(entry.target);
          if (index < 0) return;
          var rowStart = Math.floor(index / 2) * 2;
          [rowStart, rowStart + 1].forEach(function (i) {
            var card = workList[i];
            if (!card || card.classList.contains('is-visible')) return;
            card.classList.add('is-visible');
            workIo.unobserve(card);
          });
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
      workList.forEach(function (el) { workIo.observe(el); });
    }
    if (workTitles.length) {
      var workTitleIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            workTitleIo.unobserve(entry.target);
            showKickerAfter(entry.target);
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -22% 0px' });
      workTitles.forEach(function (el) { workTitleIo.observe(el); });
    }
    if (whyGrid) {
      var whyGridIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            whyGridIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
      whyGridIo.observe(whyGrid);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    workItems.forEach(function (el) { el.classList.add('is-visible'); });
    workTitles.forEach(function (el) { el.classList.add('is-visible'); });
    runTypewriter(workKicker, 48);
    runTypewriter(whyKicker, 38);
    if (whyGrid) whyGrid.classList.add('is-visible');
  }

  // Über mich: Zoom einmal triggern, dann durchziehen
  var aboutMedia = document.getElementById('about-media');
  if (aboutMedia) {
    if (reduceMotion) {
      aboutMedia.classList.add('is-zoomed-out');
    } else if ('IntersectionObserver' in window) {
      var aboutZoomIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          aboutMedia.classList.add('is-zoomed-out');
          aboutZoomIo.unobserve(entry.target);
        });
      }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
      aboutZoomIo.observe(aboutMedia);
    } else {
      aboutMedia.classList.add('is-zoomed-out');
    }
  }

  // Parallax: Elemente mit data-parallax bewegen sich langsamer/schneller als der Scroll
  // data-parallax-anchor: 0–1, wo im Viewport der Effekt «ankommt» (höher = früher)
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !reduceMotion) {
    var parallaxData = parallaxEls.map(function (el) {
      var anchorAttr = parseFloat(el.getAttribute('data-parallax-anchor'));
      return {
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0.15,
        anchor: isNaN(anchorAttr) ? 0.5 : Math.min(1, Math.max(0, anchorAttr))
      };
    });
    var rafParallax = null;
    var updateParallax = function () {
      var vh = window.innerHeight;
      parallaxData.forEach(function (item) {
        var rect = item.el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        // Nur von unten rein: einmal angekommen (offset ≤ 0) bleibt die Ruheposition
        var offset = Math.max(0, (center - vh * item.anchor) * item.speed);
        item.el.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
      });
      rafParallax = null;
    };
    var onParallaxScroll = function () {
      if (!rafParallax) rafParallax = window.requestAnimationFrame(updateParallax);
    };
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    window.addEventListener('resize', onParallaxScroll);
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onParallaxScroll);
    }
    updateParallax();
  }

  // Scroll-Hinweis unten rechts — verschwindet beim Scrollen
  var scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    var hintHidden = false;
    var syncScrollHint = function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var hide = y > 48;
      if (hide === hintHidden) return;
      hintHidden = hide;
      scrollHint.classList.toggle('is-hidden', hide);
    };
    window.addEventListener('scroll', syncScrollHint, { passive: true });
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', syncScrollHint);
    }
    syncScrollHint();
  }

  // Header: Bild-Parallax + schlichter Screen-Crossfade
  var heroBg = document.querySelector('.hero-bg');
  if (hero && heroBg && !reduceMotion) {
    var rafHero = null;
    var updateHeroParallax = function () {
      if (!introDone) return;
      var heroTop = hero.getBoundingClientRect().top;
      heroBg.style.transform = 'translate3d(0, ' + (heroTop * -0.25).toFixed(1) + 'px, 0)';
      rafHero = null;
    };
    var onHeroScroll = function () {
      if (!rafHero) rafHero = window.requestAnimationFrame(updateHeroParallax);
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    window.addEventListener('resize', onHeroScroll);
    if (lenis && typeof lenis.on === 'function') lenis.on('scroll', onHeroScroll);
    updateHeroParallax();
  }

  var heroScreens = Array.prototype.slice.call(document.querySelectorAll('.hero-screen'));
  if (heroScreens.length > 1 && !reduceMotion) {
    var slideIndex = 0;
    var slideBusy = false;
    var swapHeroScreen = function () {
      if (slideBusy) return;
      var current = heroScreens[slideIndex];
      var nextIndex = (slideIndex + 1) % heroScreens.length;
      var next = heroScreens[nextIndex];
      slideBusy = true;

      next.classList.remove('is-active', 'is-leaving');
      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      next.classList.add('is-active');

      window.setTimeout(function () {
        current.classList.remove('is-leaving');
        slideIndex = nextIndex;
        slideBusy = false;
      }, 1100);
    };
    window.setInterval(swapHeroScreen, 4800);
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
      if (el.getAttribute('data-cursor') === 'visit') return;
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });
    var cursorName = cursor.querySelector('.site-cursor-name');
    var visitOutTimer = null;
    document.querySelectorAll('[data-cursor="visit"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (visitOutTimer) {
          clearTimeout(visitOutTimer);
          visitOutTimer = null;
        }
        if (cursorName) cursorName.textContent = el.getAttribute('data-cursor-name') || '';
        cursor.classList.add('is-visit');
        cursor.classList.remove('is-hover');
        cursorDot.classList.add('is-visit-hidden');
      });
      el.addEventListener('mouseleave', function () {
        // Morph zurück zum normalen Ring (Base-Styles + langsamere Transition)
        cursor.classList.remove('is-visit');
        if (visitOutTimer) clearTimeout(visitOutTimer);
        visitOutTimer = setTimeout(function () {
          cursorDot.classList.remove('is-visit-hidden');
          visitOutTimer = null;
        }, 520);
      });
    });
  } else {
    document.body.classList.add('has-native-cursor');
  }

  // Topbar: hell auf dunklem Grund, dunkel auf hellem Grund (LP bleibt immer weiss)
  var topbar = document.getElementById('site-topbar');
  var aboutSection = document.getElementById('ueber-mich');
  var contactSection = document.getElementById('kontakt');
  if (topbar) {
    var darkSections = [hero, aboutSection, contactSection].filter(Boolean);
    var syncTopbar = function () {
      var sampleY = 40;
      var overDark = darkSections.some(function (section) {
        var rect = section.getBoundingClientRect();
        return rect.top < sampleY && rect.bottom > sampleY;
      });
      var isLight = !overDark;
      if (topbar) {
        topbar.classList.toggle('is-light', isLight);
        topbar.classList.remove('is-scrolling');
      }
    };
    window.addEventListener('scroll', syncTopbar, { passive: true });
    window.addEventListener('resize', syncTopbar);
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', syncTopbar);
    }
    syncTopbar();
  }

  // Footer: Hover öffnet; Tippen toggelt (Touch)
  var siteFooter = document.getElementById('site-footer');
  var footerToggle = document.getElementById('site-footer-toggle');
  if (siteFooter && footerToggle) {
    footerToggle.addEventListener('click', function () {
      var open = siteFooter.classList.toggle('is-open');
      footerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Kontaktformular
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var CONTACT_EMAIL = 'info@lp-design.ch';

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
      var body = message + '\n\n' + name + ' (' + email + ')';
      status.textContent = 'Öffnet dein E-Mail-Programm …';
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

});
