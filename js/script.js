/* ==========================================================================
   SAVANA — Agência de Publicidade
   Preloader · Smooth scroll · Animações GSAP · Interações
   ========================================================================== */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* Fallback: se os CDNs falharem, mostra tudo sem animação */
  if (typeof gsap === 'undefined') {
    document.body.classList.add('no-anim');
    const pre = document.getElementById('preloader');
    if (pre) pre.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ========================================================================
     SMOOTH SCROLL (Lenis)
     ======================================================================== */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !prefersReduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // âncoras internas via Lenis
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70, duration: 1.4 });
        closeMobileMenu();
      });
    });
  }

  /* ========================================================================
     SPLIT TEXT (helper)
     ======================================================================== */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    const frag = document.createDocumentFragment();
    // agrupa caracteres por palavra (nowrap) para nunca quebrar no meio da palavra
    text.split(' ').forEach((word, i, arr) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.cssText = 'display:inline-block;white-space:nowrap;';
      wordSpan.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        wordSpan.appendChild(span);
      });
      frag.appendChild(wordSpan);
      if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return el.querySelectorAll('.char');
  }

  function splitWords(el) {
    const nodes = [...el.childNodes];
    const wrap = (word) => `<span class="word-mask" style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span class="word" style="display:inline-block;">${word}</span></span>`;
    let html = '';
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        html += node.textContent.split(/(\s+)/).map((part) =>
          part.trim() ? wrap(part) : ' '
        ).join('');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const inner = node.textContent.split(/(\s+)/).map((part) =>
          part.trim() ? wrap(part) : ' '
        ).join('');
        html += `<${node.tagName.toLowerCase()}>${inner}</${node.tagName.toLowerCase()}>`;
      }
    });
    el.innerHTML = html;
    return el.querySelectorAll('.word');
  }

  /* ========================================================================
     PRELOADER + INTRO DO HERO
     ======================================================================== */
  const preloader = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  const heroChars = [];
  document.querySelectorAll('.hero__title [data-split]').forEach((el) => {
    heroChars.push(splitChars(el));
  });

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    const facets = gsap.utils.toArray('#rhino-img .rf');
    const rhinoLayers = '#rhino-img .rhino-base, #rhino-img .rhino-under, #rhino-img .rhino-detail, #rhino-img .rhino-outline';

    // estado inicial: rinoceronte desmontado — cada faceta espalhada,
    // girada e sem escala; elas voam até seu lugar durante a intro
    if (facets.length) {
      gsap.set(facets, {
        opacity: 0,
        scale: 0,
        x: () => gsap.utils.random(-180, 180),
        y: () => gsap.utils.random(-140, 140),
        rotation: () => gsap.utils.random(-120, 120),
        transformOrigin: '50% 50%'
      });
      gsap.set(rhinoLayers, { opacity: 0 });
      gsap.set('.hero__rhino-reflection', { opacity: 0 });
    }

    tl.fromTo('.hero__eyebrow', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 })
      .fromTo('.hero__title .char',
        { yPercent: 115 },
        { yPercent: 0, duration: 1.1, stagger: 0.022 }, '-=0.55')
      .fromTo('.hero__actions .btn',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 }, '-=0.6')
      .fromTo('.hero__visual',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=1.1')
      // silhueta-fantasma surge e as facetas se montam sobre ela
      .to('#rhino-img .rhino-base', { opacity: 0.35, duration: 0.5 }, '<')
      .to(facets, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        duration: 1.15,
        ease: 'power3.out',
        stagger: { each: 0.022, from: 'random' }
      }, '<0.15')
      .to('#rhino-img .rhino-base', { opacity: 1, duration: 0.6 }, '-=0.6')
      .to('#rhino-img .rhino-under, #rhino-img .rhino-detail, #rhino-img .rhino-outline',
        { opacity: 1, duration: 0.7 }, '-=0.35')
      .to('.hero__rhino-reflection', { opacity: 0.18, duration: 0.6 }, '-=0.4')
      .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.8')
      .add(() => document.getElementById('whatsapp-float').classList.add('is-visible'), '-=0.4');
    return tl;
  }

  function hidePreloader() {
    const tl = gsap.timeline({
      onComplete: () => {
        preloader.remove();
        if (lenis) lenis.start();
      }
    });
    tl.to('.preloader__inner', { y: -30, opacity: 0, duration: 0.55, ease: 'power2.in' })
      .to('.preloader__counter', { opacity: 0, duration: 0.4 }, '<')
      .to('.preloader__panel--left', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
      .to('.preloader__panel--right', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.82')
      .add(heroIntro(), '-=0.55');
  }

  if (preloader && !prefersReduced) {
    if (lenis) lenis.stop();
    const counter = { val: 0 };
    const loadTl = gsap.timeline();
    loadTl
      .fromTo('.preloader__mark .mark-facet',
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.8, stagger: 0.14, ease: 'expo.out' })
      .to('.preloader__logo span', { y: 0, duration: 0.85, stagger: 0.06, ease: 'power4.out' }, '-=0.4')
      .to('.preloader__tag', { opacity: 1, duration: 0.7 }, '-=0.4')
      .to(counter, {
        val: 100,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => { countEl.textContent = Math.round(counter.val); }
      }, 0.2)
      .add(hidePreloader, '+=0.15');

    // segurança: nunca deixa o preloader preso na tela
    setTimeout(() => {
      if (document.getElementById('preloader')) {
        loadTl.progress(1);
      }
    }, 6000);
  } else if (preloader) {
    preloader.remove();
    gsap.set('.hero__title .char', { yPercent: 0 });
    document.getElementById('whatsapp-float').classList.add('is-visible');
  }

  /* ========================================================================
     CANVAS DE PARTÍCULAS (HERO)
     ======================================================================== */
  const canvas = document.getElementById('stars');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h, raf;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width * devicePixelRatio;
      h = canvas.height = rect.height * devicePixelRatio;
      stars = Array.from({ length: Math.min(140, Math.floor(rect.width / 9)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.3 + 0.3) * devicePixelRatio,
        a: Math.random() * 0.55 + 0.1,
        v: (Math.random() * 0.12 + 0.02) * devicePixelRatio,
        tw: Math.random() * Math.PI * 2
      }));
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        s.y -= s.v;
        if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
        const twinkle = 0.6 + 0.4 * Math.sin(t * 0.0012 + s.tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${s.a * twinkle})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    // pausa quando o hero sai da tela
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { raf = requestAnimationFrame(draw); }
      else { cancelAnimationFrame(raf); }
    }).observe(canvas);
  }

  /* ========================================================================
     RINOCERONTE — flutuação, tilt e parallax
     ======================================================================== */
  const rhinoWrap = document.getElementById('hero-rhino');
  const rhinoImg = document.getElementById('rhino-img');
  if (rhinoWrap && !prefersReduced) {
    gsap.to(rhinoImg, {
      y: -14,
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    gsap.to(rhinoWrap, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    if (!isTouch) {
      const xTo = gsap.quickTo(rhinoWrap, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      const yTo = gsap.quickTo(rhinoWrap, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      gsap.set(rhinoWrap, { transformPerspective: 900 });
      document.querySelector('.hero').addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        xTo(nx * 7);
        yTo(ny * -5);
      });
    }
  }

  /* ========================================================================
     REVEALS DE SCROLL
     ======================================================================== */
  if (!prefersReduced) {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const type = el.dataset.reveal;
      const trigger = { trigger: el, start: 'top 86%', once: true };

      if (type === 'words') {
        const words = splitWords(el);
        gsap.from(words, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.025,
          ease: 'power4.out',
          scrollTrigger: trigger
        });
      } else if (type === 'fade') {
        gsap.from(el, { opacity: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: trigger });
      } else {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: trigger
        });
      }
    });

    // linha dos cabeçalhos de seção cresce ao entrar
    document.querySelectorAll('.section-head__line').forEach((line) => {
      gsap.from(line, {
        scaleX: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: line, start: 'top 88%', once: true }
      });
    });
  }

  /* ========================================================================
     TICKER (loop infinito)
     ======================================================================== */
  const tickerTrack = document.getElementById('ticker-track');
  if (tickerTrack) {
    const group = tickerTrack.querySelector('.ticker__group');
    for (let i = 0; i < 3; i++) tickerTrack.appendChild(group.cloneNode(true));
    if (!prefersReduced) {
      gsap.to(tickerTrack, { xPercent: -25, ease: 'none', duration: 22, repeat: -1 });
    }
  }

  // duplica grupos do marquee de clientes para loop contínuo
  document.querySelectorAll('.marquee__track').forEach((track) => {
    const group = track.querySelector('.marquee__group');
    track.appendChild(group.cloneNode(true));
  });

  /* ========================================================================
     HEADER — estado de scroll, barra de progresso e link ativo
     ======================================================================== */
  const header = document.getElementById('header');
  const progress = document.querySelector('.progress-bar');

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > 30);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && max > 0) progress.style.transform = `scaleX(${y / max})`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) lenis.on('scroll', onScroll);
  onScroll();

  document.querySelectorAll('main section[id], footer[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (!self.isActive) return;
        document.querySelectorAll('.nav__link').forEach((l) => {
          l.classList.toggle('is-active', l.getAttribute('href') === `#${section.id}`);
        });
      }
    });
  });

  /* ========================================================================
     MENU MOBILE
     ======================================================================== */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    burger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  /* ========================================================================
     PREVIEW FLUTUANTE DOS SERVIÇOS
     ======================================================================== */
  const preview = document.getElementById('service-preview');
  if (preview && !isTouch && !prefersReduced) {
    const numEl = preview.querySelector('.service-preview__num');
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.85, rotation: -4 });
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
    const list = document.getElementById('services-list');

    list.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    document.querySelectorAll('.service-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        numEl.textContent = String(Number(row.dataset.preview) + 1).padStart(2, '0');
        preview.classList.add('is-visible');
        gsap.to(preview, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.6)' });
      });
      row.addEventListener('mouseleave', () => {
        preview.classList.remove('is-visible');
        gsap.to(preview, { scale: 0.85, rotation: -4, duration: 0.4 });
      });
    });
  }

  /* ========================================================================
     BOTÕES MAGNÉTICOS
     ======================================================================== */
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - rect.left - rect.width / 2) * 0.3);
        yTo((e.clientY - rect.top - rect.height / 2) * 0.4);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ========================================================================
     CURSOR CUSTOMIZADO
     ======================================================================== */
  if (!isTouch && !prefersReduced) {
    const cursor = document.querySelector('.cursor');
    const dot = document.querySelector('.cursor-dot');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      cx(e.clientX); cy(e.clientY);
      dx(e.clientX); dy(e.clientY);
    });

    document.querySelectorAll('[data-hover], a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  } else {
    document.querySelectorAll('.cursor, .cursor-dot').forEach((el) => el.remove());
  }

  /* ========================================================================
     PARALLAX SUTIL — orbe do hero e rino do CTA
     ======================================================================== */
  if (!prefersReduced) {
    gsap.to('.eclipse-img--hero', {
      yPercent: 16,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
    });
    /* sem opacity aqui: o scrub deixava a cena pálida no meio da rolagem */
    gsap.from('.cta__scene', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top 85%', end: 'center 60%', scrub: 1.2 }
    });
  }

  /* ========================================================================
     RECÁLCULO PÓS-CARREGAMENTO
     Fontes/imagens alteram o layout e a página pode abrir já ancorada em
     um #fragmento — recalcula os triggers para revelar o que está em vista.
     ======================================================================== */
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    if (window.location.hash && lenis) {
      const target = document.querySelector(window.location.hash);
      if (target) lenis.scrollTo(target, { offset: -70, immediate: true });
    }
  });
})();
