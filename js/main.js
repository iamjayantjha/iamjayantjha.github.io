/* Portfolio motion. Everything here is enhancement: the page reads fully without it. */
(function () {
  var root = document.documentElement;

  /* Local time in New Delhi (works with or without motion). */
  var clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    } catch (e) {}
  }
  tick();
  setInterval(tick, 20000);


  /* Figure notes: work with or without motion. Hover, keyboard focus or tap pauses the marquee and opens a note. */
  var bandEl = document.querySelector('.band');
  var bandTrackEl = document.getElementById('bandTrack');
  var noteEl = null, noteL = null, noteT = null, activeFig = null, lastPointer = 'mouse';
  if (bandEl && bandTrackEl) {
    Array.prototype.forEach.call(bandTrackEl.querySelectorAll('button.fig'), function (b) {
      var d = document.getElementById(b.getAttribute('aria-describedby'));
      if (d) b.setAttribute('data-note', d.textContent.trim());
    });
    noteEl = document.createElement('div');
    noteEl.className = 'fignote';
    noteEl.setAttribute('aria-hidden', 'true');
    noteL = document.createElement('p'); noteL.className = 'fn-l mono';
    noteT = document.createElement('p'); noteT.className = 'fn-t';
    noteEl.appendChild(noteL); noteEl.appendChild(noteT);
    document.body.appendChild(noteEl);

    var hoverFig = null, focusFig = null;
    /* single source of truth: paused if a figure is hovered, keyboard-focused or has its note open */
    var syncMarquee = function () {
      var paused = !!(hoverFig || focusFig || activeFig);
      bandEl.classList.toggle('is-paused', paused);
      var an = bandTrackEl.getAnimations ? bandTrackEl.getAnimations()[0] : null;
      if (!an) return;
      if (paused) { if (an.playState === 'running') an.pause(); }
      else if (an.playState === 'paused') an.play();
    };
    var hideNote = function () {
      activeFig = null;
      noteEl.classList.remove('is-on');
      syncMarquee();
    };
    var showNote = function (f) {
      if (!f || !f.getAttribute('data-note')) return;
      activeFig = f;
      syncMarquee();
      noteL.textContent = f.textContent;
      noteT.textContent = f.getAttribute('data-note');
      var r = f.getBoundingClientRect();
      var w = noteEl.offsetWidth, h = noteEl.offsetHeight;
      var left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
      var top = r.top - h - 14;
      if (top < 64) top = r.bottom + 14;
      noteEl.style.left = left + 'px';
      noteEl.style.top = top + 'px';
      noteEl.classList.add('is-on');
    };
    var figOf = function (t) { return t && t.closest ? t.closest('.fig') : null; };

    bandEl.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; });
    bandEl.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var f = figOf(e.target);
      if (f) { hoverFig = f; showNote(f); }
    });
    bandEl.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse') return;
      var f = figOf(e.target);
      if (f && figOf(e.relatedTarget) !== f) { hoverFig = null; hideNote(); }
    });
    var bringFig = function (f) {
      var an = bandTrackEl.getAnimations ? bandTrackEl.getAnimations()[0] : null;
      bandEl.scrollLeft = 0;
      if (!an || !an.effect) return;
      var dur = an.effect.getTiming().duration;
      var m = new DOMMatrix(getComputedStyle(bandTrackEl).transform);
      var natural = f.getBoundingClientRect().left - m.m41;
      var half = bandTrackEl.scrollWidth / 2;
      var p = Math.max(0, Math.min(0.98, (natural - window.innerWidth * 0.1) / half));
      an.currentTime = p * dur;   /* the state function owns play and pause */
    };
    bandEl.addEventListener('focusin', function (e) {
      var f = figOf(e.target);
      if (!f) return;
      var kb = false;
      try { kb = f.matches(':focus-visible'); } catch (err) {}
      focusFig = kb ? f : null;
      syncMarquee();
      if (kb) bringFig(f);
      showNote(f);
    });
    bandEl.addEventListener('focusout', function (e) {
      if (!figOf(e.target)) return;
      focusFig = null;
      bandEl.scrollLeft = 0;
      hideNote();
    });
    bandEl.addEventListener('click', function (e) {
      var f = figOf(e.target);
      if (!f || lastPointer === 'mouse') return;
      if (activeFig === f) hideNote(); else showNote(f);
    });
    document.addEventListener('click', function (e) { if (!bandEl.contains(e.target)) { hoverFig = null; if (activeFig) hideNote(); else syncMarquee(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hoverFig = null; focusFig = null; hideNote(); } });
    window.addEventListener('scroll', function () { if (lastPointer !== 'mouse' && (activeFig || hoverFig)) { hoverFig = null; hideNote(); } }, { passive: true });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !window.Lenis) {
    root.classList.remove('pre');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  root.classList.add('anim');

  /* ---------- Lenis wired into ScrollTrigger ---------- */
  var lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- progress bar ---------- */
  var barSet = gsap.quickSetter('#bar', 'scaleX');
  var pct = $('#pct');
  lenis.on('scroll', function (e) { var p = e.progress || 0; barSet(p); if (pct) pct.textContent = Math.round(p * 100) + '%'; });

  var opened = false, pendingAnchor = null;
  /* ---------- smooth anchors through Lenis ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      var target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      ev.preventDefault();
      if (a.closest && a.closest('#nav')) setActive(a);
      if (!opened) { pendingAnchor = a; return; }
      var navH = (nav && nav.offsetHeight) || 0;
      var docTop = function (el) { return Math.round(el.getBoundingClientRect().top + window.scrollY); };
      var ease = function (t) { return 1 - Math.pow(1 - t, 4); };
      if (target && target.classList && target.classList.contains('panel') && workST) {
        /* every panel lands with its left edge at the same inset (2vw), from its real offset in the track */
        var xn = target.offsetLeft - window.innerWidth * 0.02;
        var y = workST.start + Math.max(0, Math.min(workDist(), xn)) * PIN_RATIO;
        try { lenis.scrollTo(y, { force: true, duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }); }
        catch (err) { window.scrollTo(0, y); }
        return;
      }
      /* target position from stable document offsets, never from a pinned or transformed element */
      var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var ty;
      if (target === 0) ty = 0;
      else if (target === $('#work') && workST) ty = Math.round(workST.start);
      else ty = Math.max(0, Math.min(maxY, docTop(target) - navH));
      try { lenis.scrollTo(ty, { force: true, duration: 1.6, easing: ease }); }
      catch (err) { window.scrollTo(0, ty); }
      if (target && target.focus) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    });
  });

  /* ---------- section-aware nav ---------- */
  var nav = $('#nav');
  var links = $$('#nav ul a');
  var navSecs = $$('[data-nav]');
  var lastTheme = null, lastAct = null, navLock = 0;
  function setActive(link) {
    navLock = performance.now() + 2200;
    links.forEach(function (l) { if (l === link) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
  }
  function updateNav() {
    var cur = null, act = null;
    for (var i = 0; i < navSecs.length; i++) {
      var r = navSecs[i].getBoundingClientRect();
      if (!cur && r.top <= 34 && r.bottom > 34) cur = navSecs[i];
      if (!act && r.top <= 80 && r.bottom > 80) act = navSecs[i];
    }
    if (cur && cur !== lastTheme) {
      lastTheme = cur;
      var theme = cur.getAttribute('data-nav');
      nav.classList.toggle('is-bone', theme === 'bone');
      nav.classList.toggle('is-accent', theme === 'accent');
    }
    if (performance.now() < navLock || !act || act === lastAct) return;
    lastAct = act;
    links.forEach(function (l) {
      if (act.id && l.getAttribute('href') === '#' + act.id) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  lenis.on('scroll', updateNav);
  ScrollTrigger.addEventListener('refresh', function () { lastTheme = null; lastAct = null; updateNav(); });
  updateNav();

  /* ---------- word split for the intro ---------- */
  var intro = $('#introText');
  var words = [];
  if (intro) {
    var txt = intro.textContent.trim();
    intro.setAttribute('aria-label', txt);
    intro.textContent = '';
    txt.split(/\s+/).forEach(function (w, i, arr) {
      var sp = document.createElement('span');
      sp.setAttribute('aria-hidden', 'true');
      sp.textContent = w;
      intro.appendChild(sp);
      if (i < arr.length - 1) intro.appendChild(document.createTextNode(' '));
      words.push(sp);
    });
  }

  /* ---------- marquee clone (aria-hidden) ---------- */
  var band = $('#bandTrack');
  if (band) {
    $$('li', band).forEach(function (li) {
      var c = document.createElement('li');
      c.setAttribute('aria-hidden', 'true');
      $$('button.fig', li).forEach(function (b) {
        var s = document.createElement('span');
        s.className = 'fig';
        s.textContent = b.textContent;
        s.setAttribute('data-note', b.getAttribute('data-note') || '');
        c.appendChild(s);
      });
      band.appendChild(c);
    });
  }

  /* ---------- preloader: counts 0 to 1, then the page opens ---------- */
  var num = $('#preNum');
  var counter = { v: 0 };
  gsap.set('.glyph', { opacity: 0 });
  gsap.set('.hero-h, .hero-meta', { opacity: 0, y: 40 });

  function openPage() {
    if (opened) return;
    opened = true;
    root.classList.remove('pre');
    lenis.start();
    ScrollTrigger.refresh();
    if (pendingAnchor) {
      var pa = pendingAnchor; pendingAnchor = null;
      pa.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }
  var pre = gsap.timeline();
  pre.to(counter, { v: 1, duration: 0.7, ease: 'power2.inOut', onUpdate: function () { num.textContent = counter.v.toFixed(2); } })
     .to('.preloader', { yPercent: -100, duration: 0.5, ease: 'power4.inOut' }, '+=0.02')
     .to('.glyph', { opacity: 0.9, duration: 0.9, ease: 'power2.out' }, '-=0.35')
     .to('.hero-h, .hero-meta', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, '-=0.8');
  pre.call(openPage, null, 1.22);
  /* hard cap: whatever happens, scrolling is on and the page is visible after 1.5s */
  setTimeout(function () { if (!opened) { pre.progress(1); openPage(); } }, 1500);

  /* ---------- 1. hero: the 0 turns into a 1 ---------- */
  var hero = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', pin: true, scrub: true, anticipatePin: 1 }
  });
  hero.to('.g0', { scaleX: 0.06, opacity: 0, duration: 1 }, 0)
      .fromTo('.g1', { opacity: 0, scaleY: 0.55, yPercent: window.innerWidth < 900 ? 3 : 14 }, { opacity: 1, scaleY: 1, yPercent: 0, duration: 1 }, 0.2)
      .to('.hero-h .z', { opacity: 0.55, duration: 1 }, 0)
      .to('.hero-h .o', { color: '#ffd21f', duration: 0.6 }, 0.4)
      .to('.cue', { opacity: 0, duration: 0.04 }, 0);

  /* ---------- 2. intro: word-by-word reveal ---------- */
  if (words.length) {
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: '.intro', start: 'top 70%', end: 'bottom 70%', scrub: true }
    });
  }

  /* ---------- 3. work: pinned horizontal gallery on desktop, parallax stack on phones ---------- */
  var workST = null;
  var PIN_RATIO = 0.5;
  var workDist = function () { return 0; };
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var track = $('#track');
    var work = $('#work');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    workDist = dist;
    var panelsAll = $$('.panel');
    var intro = $('.work-intro');
    var chapN = $('#chapN'), chapBar = $('#chapBar');
    var lastChap = -1;
    var move = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: work, start: 'top top', end: function () { return '+=' + Math.round(dist() * PIN_RATIO); },
        pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) {
          var x = self.progress * dist(), vw = window.innerWidth;
          var ov = function (el) { var l = el.offsetLeft - x; return Math.max(0, Math.min(l + el.offsetWidth, vw) - Math.max(l, 0)); };
          var best = 0, bestOv = ov(intro);
          panelsAll.forEach(function (p, i) { var o = ov(p); if (o > bestOv) { bestOv = o; best = i + 1; } });
          if (best !== lastChap) { lastChap = best; chapN.textContent = (best < 10 ? '0' : '') + best; }
          chapBar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
        }
      }
    });
    workST = move.scrollTrigger;
    $$('.panel').forEach(function (p, i) {
      var st = { trigger: p, containerAnimation: move, start: 'left right', end: 'right left', scrub: true };
      gsap.fromTo($('.ghost', p), { xPercent: 30 }, { xPercent: -45, ease: 'none', scrollTrigger: st });
      gsap.fromTo($('.p-shot', p), { x: 110, rotation: i % 2 ? 3 : -3 }, { x: -110, rotation: i % 2 ? -1.5 : 1.5, ease: 'none', scrollTrigger: st });
    });
    return function () { workST = null; };
  });
  mm.add('(max-width: 899px)', function () {
    $$('.panel').forEach(function (p) {
      var scrub = { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true };
      /* outline numeral drifts behind the chapter */
      gsap.fromTo($('.ghost', p), { y: -60, xPercent: 8 }, { y: 200, xPercent: -10, ease: 'none', scrollTrigger: scrub });
      /* framed screenshot slides in with a tilt, then drifts at its own speed */
      var shot = $('.p-shot', p);
      gsap.fromTo(shot, { x: 80, rotation: 5, opacity: 0.2 }, {
        x: 0, rotation: -1.5, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: shot, start: 'top 98%', end: 'top 45%', scrub: true }
      });
      var img = $('.shot img', p);
      if (img) gsap.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: 'none', scrollTrigger: scrub });
      /* notes reveal in sequence, linked to scroll */
      $$('.p-no, h3, .meta, .visit, .what, dt, dd', p).forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 34 }, {
          opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 74%', scrub: true }
        });
      });
    });
  });

  /* ---------- keyboard focus inside the pinned gallery ---------- */
  var workEl = $('#work');
  workEl.addEventListener('scroll', function () { workEl.scrollLeft = 0; workEl.scrollTop = 0; });
  var lastKey = false;
  document.addEventListener('keydown', function () { lastKey = true; }, true);
  document.addEventListener('mousedown', function () { lastKey = false; }, true);
  document.addEventListener('touchstart', function () { lastKey = false; }, { capture: true, passive: true });
  function snapTo(el) {
    workEl.scrollLeft = 0; workEl.scrollTop = 0;
    var tx = gsap.getProperty($('#track'), 'x') || 0;
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth;
    var xn = Math.max(0, Math.min(workDist(), r.left - tx - vw * 0.12));
    lenis.scrollTo(Math.round(workST.start + xn * PIN_RATIO), { immediate: true, force: true });
    ScrollTrigger.update();
  }
  /* Tab inside the gallery: DOM order is the tab order. Move the page first, then focus without the browser scrolling. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !workST) return;
    var links = $$('#work a[href]');
    var idx = links.indexOf(document.activeElement);
    if (idx < 0) return;
    var next = links[idx + (e.shiftKey ? -1 : 1)];
    if (!next) return;
    e.preventDefault();
    var r = next.getBoundingClientRect(), vw = window.innerWidth;
    if (!(workST.isActive && r.left >= 16 && r.right <= vw - 16)) snapTo(next);
    next.focus({ preventScroll: true });
  }, true);
  /* Keyboard focus arriving from outside the gallery (or Shift+Tab back in). Mouse focus never moves the page. */
  document.addEventListener('focusin', function (e) {
    if (!workST || !workEl.contains(e.target)) return;
    var kb = lastKey;
    try { kb = kb || e.target.matches(':focus-visible'); } catch (err) {}
    if (!kb) return;
    workEl.scrollLeft = 0; workEl.scrollTop = 0;
    var r = e.target.getBoundingClientRect();
    var vw = window.innerWidth;
    if (workST.isActive && r.left >= 16 && r.right <= vw - 16) return;
    /* the browser scrolls the focused element into view after this event, so move the page once it has finished */
    setTimeout(function () { snapTo(e.target); }, 0);
  });

  /* ---------- 5. method: steps light up in sequence ---------- */
  $$('#steps li').forEach(function (li) {
    ScrollTrigger.create({ trigger: li, start: 'top 68%', end: 'max', toggleClass: { targets: li, className: 'on' } });
  });

  /* ---------- 6. journey: the line draws as you scroll ---------- */
  gsap.fromTo('.tl-line', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '#tl', start: 'top 65%', end: 'bottom 65%', scrub: true }
  });
  $$('#tl li').forEach(function (li) {
    ScrollTrigger.create({ trigger: li, start: 'top 65%', end: 'max', toggleClass: { targets: li, className: 'on' } });
  });

  /* ---------- 7. contact ---------- */
  gsap.from('.contact h2, .cta-mail', {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.15,
    scrollTrigger: { trigger: '.contact', start: 'top 60%', once: true }
  });

  /* ---------- cursor and magnetic links (fine pointers only) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cur = $('#cursor');
    var cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
    var px0 = -1, py0 = -1, curOver = false, curTimer = 0;
    function setCurOver(v) {
      if (v === curOver) return;
      curOver = v;
      gsap.to(cur, { scale: v ? 3.2 : 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
    }
    function refreshCursor() {
      if (px0 < 0) return;
      var el = document.elementFromPoint(px0, py0);
      setCurOver(!!(el && el.closest && el.closest('a, button')));
    }
    function refreshSoon(ms) { clearTimeout(curTimer); curTimer = setTimeout(refreshCursor, ms); }
    window.addEventListener('mousemove', function (e) {
      px0 = e.clientX; py0 = e.clientY;
      gsap.set(cur, { opacity: 1 });
      cx(e.clientX); cy(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { px0 = -1; setCurOver(false); gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener('click', function () { setCurOver(false); refreshSoon(80); }, true);
    window.addEventListener('scroll', function () { refreshSoon(120); }, { passive: true });
    $$('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { setCurOver(true); });
      el.addEventListener('mouseleave', function () { setCurOver(false); });
    });
    $$('.mag').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.25);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* ---------- hero reacts to the pointer; index rows reveal a preview ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var gx = gsap.quickTo('.glyph', 'x', { duration: 1.2, ease: 'power3' });
    var gy = gsap.quickTo('.glyph', 'y', { duration: 1.2, ease: 'power3' });
    var gr = gsap.quickTo('.glyph', 'rotation', { duration: 1.2, ease: 'power3' });
    var hx = gsap.quickTo('.hero-h', 'x', { duration: 1.4, ease: 'power3' });
    $('.hero').addEventListener('mousemove', function (e) {
      var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      gx(nx * -50); gy(ny * -36); gr(nx * 4); hx(nx * 12);
    }, { passive: true });

    var peek = $('#peek');
    gsap.set(peek, { opacity: 0, scale: 0.9 });
    var px = gsap.quickTo(peek, 'x', { duration: 0.35, ease: 'power3' });
    var py = gsap.quickTo(peek, 'y', { duration: 0.35, ease: 'power3' });
    $$('.index a').forEach(function (a) {
      var src = a.getAttribute('data-img');
      a.addEventListener('mouseenter', function () {
        if (!src) return;
        peek.src = src;
        gsap.to(peek, { opacity: 1, scale: 1, rotation: -3, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      });
      a.addEventListener('mousemove', function (e) { px(e.clientX + 24); py(e.clientY - 90); });
      a.addEventListener('mouseleave', function () { gsap.to(peek, { opacity: 0, scale: 0.9, duration: 0.2, overwrite: 'auto' }); });
    });
  }

  /* fonts and images change layout: recalc pins once they settle */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 350); });
})();
