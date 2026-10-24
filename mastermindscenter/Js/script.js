/* ============================================================
   MASTER MINDS CENTER — script.js
   GSAP + ScrollTrigger + Lenis + Three.js
============================================================ */

/* If GSAP failed to load, don't break the page */
if (!window.gsap) {
  document.querySelector('.preloader')?.remove();
} else {

  gsap.registerPlugin(ScrollTrigger);

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');

  /* ------------------------------------------------------
     1) SMOOTH SCROLL (Lenis)
  ------------------------------------------------------ */
  let lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // locked until preloader finishes
  }

  /* ------------------------------------------------------
     2) CUSTOM CURSOR
  ------------------------------------------------------ */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (dot && ring && !isTouch) {
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const dX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const rX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
    const rY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY);
    });
    const HOVER_SEL = 'a, button, .video-card__media, [data-tilt]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOVER_SEL)) document.body.classList.add('cursor-active');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOVER_SEL)) document.body.classList.remove('cursor-active');
    });
  }

  /* ------------------------------------------------------
     3) NAV — hide on scroll down / show on scroll up
  ------------------------------------------------------ */
  let lastY = 0;
  let menuOpen = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 60);
      if (y > lastY && y > 350 && !menuOpen) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
      lastY = y;
    },
  });

  /* Scroll progress bar */
  const progress = document.querySelector('.scroll-progress span');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => { if (progress) progress.style.transform = `scaleX(${self.progress})`; },
  });

  /* ------------------------------------------------------
     4) MOBILE MENU
  ------------------------------------------------------ */
  const menuTl = gsap.timeline({ paused: true })
    .to(menu, { clipPath: 'circle(150% at 92% 6%)', duration: 0.8, ease: 'power3.inOut' })
    .fromTo('.menu__link', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, '-=0.3')
    .fromTo('.menu__foot', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4');

  function openMenu() {
    menuOpen = true;
    menu.classList.add('is-open');
    nav.classList.add('menu-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menuTl.timeScale(1).play(0);
    lenis?.stop();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    nav.classList.remove('menu-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menuTl.timeScale(1.4).reverse();
    lenis?.start();
  }
  burger?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));

  /* ------------------------------------------------------
     5) ANCHOR LINKS (smooth scroll)
  ------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        closeMenu();
        const target = document.querySelector(id);
        if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
        else target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  document.getElementById('toTop')?.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ------------------------------------------------------
     6) WORD SPLIT for section titles
  ------------------------------------------------------ */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
            } else {
              const w = document.createElement('span');
              w.className = 'w';
              const wi = document.createElement('span');
              wi.className = 'wi';
              wi.textContent = part;
              w.appendChild(wi);
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) {
          walk(child);
        }
      });
    };
    walk(el);
    return el.querySelectorAll('.wi');
  }

  /* ------------------------------------------------------
     7) SCROLL EFFECTS (reveals, splits, stagger, parallax)
  ------------------------------------------------------ */
  function initScrollFX() {
    /* Split titles */
    document.querySelectorAll('[data-split]').forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 115 });
      gsap.to(words, {
        yPercent: 0,
        duration: 1.1,
        stagger: 0.04,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    /* Simple reveals */
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { y: 44, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
    });

    /* Stagger groups */
    gsap.utils.toArray('[data-stagger]').forEach((group) => {
      const items = group.querySelectorAll(':scope > *');
      gsap.fromTo(items,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        });
    });

    /* Parallax elements */
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      const amount = parseFloat(el.dataset.parallax || 40);
      gsap.fromTo(el, { y: amount }, {
        y: -amount, ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom', end: 'bottom top', scrub: true,
        },
      });
    });

    /* Hero parallax out */
    gsap.to('.hero__content', {
      yPercent: -8, opacity: 0.5, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('#hero-canvas', {
      yPercent: 14, scale: 1.08, opacity: 0.45, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* Counters */
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const comma = end >= 1000;
      const delay = el.closest('.hero') ? 3 : 0;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(obj, {
          v: end, duration: 2.2, ease: 'power3.out', delay,
          onUpdate: () => {
            const val = Math.round(obj.v);
            el.textContent = (comma ? val.toLocaleString('en-US') : val) + suffix;
          },
        }),
      });
    });

    /* Active nav link */
    const navLinks = document.querySelectorAll('.nav__links a');
    document.querySelectorAll('main section[id]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + sec.id));
          }
        },
      });
    });
  }

  /* ------------------------------------------------------
     8) 3D TILT CARDS + MAGNETIC BUTTONS
  ------------------------------------------------------ */
  if (!isTouch) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const glare = card.querySelector('.tilt-glare');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        gsap.to(card, {
          rotateY: (px - 0.5) * 10, rotateX: (0.5 - py) * 10,
          transformPerspective: 1000, duration: 0.5, ease: 'power2.out',
        });
        if (glare) {
          glare.style.setProperty('--gx', px * 100 + '%');
          glare.style.setProperty('--gy', py * 100 + '%');
        }
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
      });
    });

    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });

    /* Hero content subtle 3D tilt */
    const heroContent = document.querySelector('.hero__content');
    if (heroContent) {
      gsap.set(heroContent, { transformPerspective: 1200 });
      const hRY = gsap.quickTo(heroContent, 'rotationY', { duration: 0.8, ease: 'power3' });
      const hRX = gsap.quickTo(heroContent, 'rotationX', { duration: 0.8, ease: 'power3' });
      window.addEventListener('mousemove', (e) => {
        hRY(((e.clientX / window.innerWidth) - 0.5) * 4);
        hRX(-((e.clientY / window.innerHeight) - 0.5) * 3);
      });
    }
  }

  /* ------------------------------------------------------
     9) MARQUEES (infinite, scroll-velocity reactive)
  ------------------------------------------------------ */
  function initMarquees() {
    document.querySelectorAll('[data-marquee]').forEach((m) => {
      const track = m.querySelector('.marquee__track');
      const unit = track?.querySelector('.marquee__unit');
      if (!track || !unit) return;

      const target = m.offsetWidth * 2;
      let copies = Math.max(2, Math.ceil(target / Math.max(unit.offsetWidth, 1)) + 1);
      for (let i = 1; i < copies; i++) track.appendChild(unit.cloneNode(true));

      let unitW = unit.offsetWidth;
      const dir = m.dataset.marquee === 'right' ? 1 : -1;
      const speed = parseFloat(m.dataset.speed || 0.6);
      let x = 0, boost = 0, paused = false;

      if (m.hasAttribute('data-pause')) {
        m.addEventListener('mouseenter', () => (paused = true));
        m.addEventListener('mouseleave', () => (paused = false));
      }
      if (lenis) lenis.on('scroll', (e) => { boost = Math.min(Math.abs(e.velocity || 0) * 0.35, 5); });
      else window.addEventListener('scroll', () => { boost = 2; }, { passive: true });

      gsap.ticker.add(() => {
        boost *= 0.95;
        if (paused) return;
        x += dir * (speed + boost);
        if (x <= -unitW) x += unitW;
        if (dir === 1 && x >= 0) x -= unitW;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });

      window.addEventListener('resize', () => { unitW = unit.offsetWidth; });
    });
  }
  initMarquees();
  window.addEventListener('load', initMarquees);

  /* ------------------------------------------------------
     10) VIDEOS — custom player behavior
  ------------------------------------------------------ */
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach((card) => {
    const video = card.querySelector('video');
    const playBtn = card.querySelector('.video-card__play');
    const media = card.querySelector('.video-card__media');
    const progress2 = card.querySelector('.video-card__progress span');
    const muteBtn = card.querySelector('.video-card__mute');
    let userTouched = false;

    const pauseOthers = () => {
      videoCards.forEach((c) => {
        if (c !== card) {
          const v = c.querySelector('video');
          if (v) v.pause();
          c.classList.remove('is-playing');
        }
      });
    };

    const toggle = () => {
      userTouched = true;
      if (video.paused) {
        pauseOthers();
        video.play().catch(() => {});
        card.classList.add('is-playing');
      } else {
        video.pause();
        card.classList.remove('is-playing');
      }
    };

    playBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    media?.addEventListener('click', toggle);

    muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    });

    video.addEventListener('timeupdate', () => {
      if (video.duration) progress2.style.transform = `scaleX(${video.currentTime / video.duration})`;
    });

    /* Auto-play the big video (muted) when it enters view */
    if (card.classList.contains('video-card--lg') && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting && !userTouched && video.paused) {
          video.play().catch(() => {});
          card.classList.add('is-playing');
          obs.disconnect();
        }
      }, { threshold: 0.4 }).observe(card);
    }
  });

  /* ------------------------------------------------------
     11) THREE.JS — 3D particle universe in the hero
  ------------------------------------------------------ */
  function initHero3D() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !window.THREE) return;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
      camera.position.set(0, 0, 26);

      const world = new THREE.Group();
      scene.add(world);

      /* Particles */
      const COUNT = isTouch ? 1300 : 2800;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const cGold = new THREE.Color('#f0b64a');
      const cCyan = new THREE.Color('#2dd4bf');
      const cWhite = new THREE.Color('#e8ecf7');
      for (let i = 0; i < COUNT; i++) {
        const r = 10 + Math.random() * 22;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        positions[i * 3 + 2] = r * Math.cos(phi);
        const rnd = Math.random();
        const c = rnd > 0.82 ? cGold : rnd > 0.6 ? cCyan : cWhite;
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.13, vertexColors: true, transparent: true, opacity: 0.8,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      });
      const points = new THREE.Points(pGeo, pMat);
      world.add(points);

      /* Floating wireframe geometry */
      const ico = new THREE.Mesh(
        new THREE.IcosahedronGeometry(5, 1),
        new THREE.MeshBasicMaterial({ color: '#f0b64a', wireframe: true, transparent: true, opacity: 0.35 })
      );
      ico.position.set(16, 6, -10);

      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 1.4, 12, 28),
        new THREE.MeshBasicMaterial({ color: '#2dd4bf', wireframe: true, transparent: true, opacity: 0.28 })
      );
      torus.position.set(-17, -5, -12);

      const octa = new THREE.Mesh(
        new THREE.OctahedronGeometry(2.6, 0),
        new THREE.MeshBasicMaterial({ color: '#f0b64a', wireframe: true, transparent: true, opacity: 0.25 })
      );
      octa.position.set(-12, 10, -6);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6.5, 0.12, 8, 60),
        new THREE.MeshBasicMaterial({ color: '#f0b64a', transparent: true, opacity: 0.5 })
      );
      ring.position.set(14, -9, -4);
      ring.rotation.x = Math.PI / 2.4;

      world.add(ico, torus, octa, ring);

      /* Mouse parallax */
      const mouse = { x: 0, y: 0 };
      if (!isTouch) {
        window.addEventListener('mousemove', (e) => {
          mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
          mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
        });
      }

      /* Pause rendering when hero is off-screen */
      let visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 }).observe(canvas);
      }

      function resize() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      window.addEventListener('resize', resize);

      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        if (!visible) return;
        const t = clock.getElapsedTime();
        points.rotation.y = t * 0.02;
        points.rotation.x = Math.sin(t * 0.1) * 0.05;
        ico.rotation.x = t * 0.2; ico.rotation.y = t * 0.26;
        ico.position.y = 6 + Math.sin(t * 0.6) * 0.8;
        torus.rotation.x = t * 0.16; torus.rotation.y = t * 0.2;
        torus.position.y = -5 + Math.cos(t * 0.5);
        octa.rotation.y = -t * 0.3;
        octa.position.y = 10 + Math.sin(t * 0.8) * 0.6;
        ring.rotation.z = t * 0.1;
        world.rotation.y += (mouse.x * 0.18 - world.rotation.y) * 0.04;
        world.rotation.x += (mouse.y * 0.1 - world.rotation.x) * 0.04;
        renderer.render(scene, camera);
      });
    } catch (err) {
      console.warn('3D hero disabled:', err);
    }
  }
  initHero3D();

  /* ------------------------------------------------------
     12) PRELOADER → HERO INTRO
  ------------------------------------------------------ */
  /* Set initial states (JS-driven so the site still works without JS) */
  gsap.set('#hero-canvas', { opacity: 0 });
  gsap.set('.nav', { y: -80, opacity: 0 });
  gsap.set('.hero__eyebrow', { y: 24, opacity: 0 });
  gsap.set('.hero__title .line', { yPercent: 115 });
  gsap.set('.hero__sub', { y: 30, opacity: 0 });
  gsap.set('.hero__ctas .btn', { y: 26, opacity: 0 });
  gsap.set('.hero__stat', { y: 24, opacity: 0 });
  gsap.set(['.hero__side', '.hero__scroll'], { opacity: 0 });

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });
    tl.to('#hero-canvas', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to('.nav', { y: 0, opacity: 1 }, 0.1)
      .to('.hero__eyebrow', { y: 0, opacity: 1 }, 0.25)
      .to('.hero__title .line', { yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.35)
      .to('.hero__sub', { y: 0, opacity: 1 }, 0.7)
      .to('.hero__ctas .btn', { y: 0, opacity: 1, stagger: 0.09 }, 0.85)
      .to('.hero__stat', { y: 0, opacity: 1, stagger: 0.08 }, 1)
      .to(['.hero__side', '.hero__scroll'], { opacity: 1, duration: 0.8 }, 1.2);
    return tl;
  }

  const preloader = document.getElementById('preloader');
  const counterEl = document.querySelector('.preloader__counter');
  const barFill = document.querySelector('.preloader__bar-fill');
  const loadState = { value: 0 };

  gsap.to(loadState, {
    value: 100,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate() {
      const v = Math.round(loadState.value);
      if (counterEl) counterEl.textContent = v + '%';
      if (barFill) barFill.style.transform = `scaleX(${v / 100})`;
    },
    onComplete() {
      const tl = gsap.timeline({
        onComplete() {
          lenis?.start();
          ScrollTrigger.refresh();
        },
      });
      tl.to('.preloader__logo-word', { yPercent: -120, duration: 0.7, stagger: 0.08, ease: 'power3.in' })
        .to('.preloader__bar, .preloader__meta', { opacity: 0, duration: 0.3 }, '<')
        .to(preloader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' })
        .set(preloader, { display: 'none' })
        .add(heroIntro(), '-=0.45');
    },
  });

  /* Safety net: never trap the user behind the preloader */
  setTimeout(() => {
    if (preloader && preloader.style.display !== 'none') {
      preloader.style.display = 'none';
      lenis?.start();
      heroIntro();
    }
  }, 8000);

  /* ------------------------------------------------------
     13) FOOTER YEAR + REFRESH
  ------------------------------------------------------ */
  document.querySelectorAll('.year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());

}