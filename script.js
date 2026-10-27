document.addEventListener('DOMContentLoaded', () => {
  // Start-Sequenz: Schwarz → LP → Bild klein → Bild voll → UI
  var INTRO_ENABLED = true;
  var hero = document.querySelector('.hero');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var introDone = false;

  var logoEl = document.querySelector('.hero-logo');

  var settleLogo = function () {
    if (!logoEl) return;
    logoEl.classList.add('is-drawn');
  };

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
    settleLogo();
    // Ready zuerst: Bild bleibt im Expand-Endzustand, dann erst Scroll/UI freigeben
    hero.classList.add('is-ready');
    hero.classList.remove('is-intro-logo', 'is-intro-expand');
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
      hero.classList.add('is-intro-expand', 'is-ready');
    }
    settleLogo();
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
    // Schwarz → LP + Bild sofort parallel aufbauen
    window.setTimeout(function () {
      settleLogo();
      hero.classList.add('is-intro-logo', 'is-intro-expand');
      window.setTimeout(finishIntro, 1250);
    }, 20);
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
    if (lenis) {
      lenis.scrollTo(targetY, { duration: (duration || 1350) / 1000 });
      return;
    }
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
      smoothScrollTo(targetY, 1350);
    });
  });

  // Scroll-Reveal
  var revealEls = document.querySelectorAll('.reveal');
  var workItems = document.querySelectorAll('.photo-strip-item');
  var workTitle = document.querySelector('.work-strip-word');
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

    if (workItems.length || workTitle) {
      var workIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            workIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '20% 0px 15% 0px' });
      workItems.forEach(function (el) { workIo.observe(el); });
      if (workTitle) workIo.observe(workTitle);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    workItems.forEach(function (el) { el.classList.add('is-visible'); });
    if (workTitle) workTitle.classList.add('is-visible');
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

  // Header-Parallax: Hintergrundfoto hinkt dem Scroll nach, Titel-Schrift läuft dagegen
  var heroBg = document.querySelector('.hero-bg');
  var heroLogo = document.querySelector('.hero-logo');
  var heroTitleText = document.querySelector('.hero-title-text');
  var heroIntroText = document.querySelector('.hero-intro-text');
  var heroSkillsBlock = document.querySelector('.hero-skills-block');
  if (hero && (heroBg || heroLogo || heroTitleText || heroIntroText || heroSkillsBlock) && !reduceMotion) {
    var rafHero = null;
    var updateHeroParallax = function () {
      if (!introDone) return;
      var heroTop = hero.getBoundingClientRect().top;
      if (heroBg) {
        var bgOffset = heroTop * -0.3;
        heroBg.style.transform = 'translate3d(0, ' + bgOffset.toFixed(1) + 'px, 0)';
      }
      if (heroLogo) {
        var logoOffset = heroTop * 0.08;
        heroLogo.style.transform = 'translate3d(-50%, calc(-50% + ' + logoOffset.toFixed(1) + 'px), 0)';
      }
      if (heroTitleText) {
        var titleOffset = heroTop * 0.18;
        heroTitleText.style.transform = 'translate3d(0, ' + titleOffset.toFixed(1) + 'px, 0)';
      }
      if (heroIntroText) {
        var introOffset = heroTop * 0.18;
        heroIntroText.style.transform = 'translate3d(0, ' + introOffset.toFixed(1) + 'px, 0)';
      }
      if (heroSkillsBlock) {
        var skillsOffset = heroTop * 0.18;
        heroSkillsBlock.style.transform = 'translate3d(0, ' + skillsOffset.toFixed(1) + 'px, 0)';
      }
      rafHero = null;
    };
    var onHeroScroll = function () {
      if (!rafHero) rafHero = window.requestAnimationFrame(updateHeroParallax);
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    window.addEventListener('resize', onHeroScroll);
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onHeroScroll);
    }
    updateHeroParallax();
  }

  // Statement: von unten rein wie Header-Titel (scrollgekoppelt)
  var statementBlock = document.getElementById('statement-block');
  if (statementBlock && !reduceMotion) {
    var rafStatement = null;
    var updateStatementRise = function () {
      var top = statementBlock.getBoundingClientRect().top;
      var vh = window.innerHeight || 800;
      var settle = vh * 0.34;
      var offset = (top - settle) * 0.2;
      if (offset > 140) offset = 140;
      if (offset < -36) offset = -36;
      var fade = 1 - (top - settle) / (vh * 0.55);
      if (fade < 0) fade = 0;
      if (fade > 1) fade = 1;
      statementBlock.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
      statementBlock.style.opacity = fade.toFixed(3);
      rafStatement = null;
    };
    var onStatementScroll = function () {
      if (!rafStatement) rafStatement = window.requestAnimationFrame(updateStatementRise);
    };
    window.addEventListener('scroll', onStatementScroll, { passive: true });
    window.addEventListener('resize', onStatementScroll);
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onStatementScroll);
    }
    updateStatementRise();
  } else if (statementBlock) {
    statementBlock.style.opacity = '1';
    statementBlock.style.transform = 'none';
  }

  // About-Hintergrund: gleicher sanfter Parallax wie Header
  var aboutSection = document.querySelector('.about-feature');
  var aboutBg = document.querySelector('.about-feature-bg');
  if (aboutSection && aboutBg && !reduceMotion) {
    var rafAbout = null;
    var updateAboutParallax = function () {
      var aboutTop = aboutSection.getBoundingClientRect().top;
      var bgOffset = aboutTop * -0.1;
      aboutBg.style.transform = 'translate3d(0, ' + bgOffset.toFixed(1) + 'px, 0)';
      rafAbout = null;
    };
    var onAboutScroll = function () {
      if (!rafAbout) rafAbout = window.requestAnimationFrame(updateAboutParallax);
    };
    window.addEventListener('scroll', onAboutScroll, { passive: true });
    window.addEventListener('resize', onAboutScroll);
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onAboutScroll);
    }
    updateAboutParallax();
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
