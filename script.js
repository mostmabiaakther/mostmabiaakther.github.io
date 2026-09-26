(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = () => reducedMotion.matches;

  /* ------------------------------------------------------------ Count-up */
  // The HTML always contains the real value; the animation only runs from JS
  // and always ends on exactly the original text.
  const counters = [...document.querySelectorAll('[data-count]')];
  const loadedAt = performance.now();
  counters.forEach((el) => {
    const finalText = el.textContent.trim();
    const target = parseFloat(el.dataset.count);
    const decimals = (finalText.split('.')[1] || '').length;
    if (prefersReduced() || !Number.isFinite(target) || target.toFixed(decimals) !== finalText) return;
    if (!('IntersectionObserver' in window)) return; // stays static, showing the real value

    // Screen readers get the real value throughout; the ticking digits are hidden from them.
    const live = document.createElement('span');
    live.setAttribute('aria-hidden', 'true');
    live.textContent = (0).toFixed(decimals);
    const real = document.createElement('span');
    real.className = 'visually-hidden';
    real.textContent = finalText;
    el.replaceChildren(real, live);

    let done = false;
    const finish = () => { done = true; el.textContent = finalText; };
    window.addEventListener('beforeprint', finish, { once: true });

    const run = () => {
      const duration = 1500;
      let start = 0;
      const tick = (now) => {
        if (done) return;
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        if (t >= 1) { finish(); return; }
        live.textContent = (target * (1 - Math.pow(1 - t, 4))).toFixed(decimals);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      // Let the hero entrance finish first when the badge is visible on load.
      const wait = Math.max(0, 900 - (performance.now() - loadedAt));
      window.setTimeout(run, wait);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ----------------------------------------------------- Header & progress */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');
  const brand = document.querySelector('.brand');
  const mobileMenu = window.matchMedia('(max-width: 64rem)');
  const navAnchors = [...menu.querySelectorAll('a[href^="#"]')];
  const trackedSections = navAnchors.map((a) => document.querySelector(a.hash)).filter(Boolean);
  let scrollFrame = 0;

  navAnchors.forEach((a, i) => a.parentElement.style.setProperty('--n', i));

  function updateScrollUI() {
    const scrollTop = window.scrollY || root.scrollTop;
    const scrollable = root.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', scrollTop > 16);
    progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, scrollTop / scrollable) : 0})`;

    const marker = scrollTop + window.innerHeight * 0.4;
    let currentId = '';
    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top + scrollTop <= marker) currentId = section.id;
    });
    // "Achievements" covers the evidence, honours and gallery run of sections.
    if (['honours', 'gallery'].includes(currentId)) currentId = 'achievements';
    navAnchors.forEach((a) => {
      if (a.hash === `#${currentId}`) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    scrollFrame = 0;
  }
  const requestScrollUpdate = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUI); };

  // Track honours/gallery too so the Achievements link stays active there.
  ['honours', 'gallery', 'moments'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) trackedSections.push(el);
  });
  trackedSections.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  /* ------------------------------------------------------------ Mobile nav */
  let menuIsOpen = false;
  function setMenu(open, { focus = false } = {}) {
    menuIsOpen = mobileMenu.matches && open;
    menu.classList.toggle('is-open', menuIsOpen);
    menuButton.setAttribute('aria-expanded', String(menuIsOpen));
    menuButton.setAttribute('aria-label', menuIsOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('menu-open', menuIsOpen);
    menu.inert = mobileMenu.matches ? !menuIsOpen : false;
    if (focus) {
      const target = menuIsOpen ? navAnchors[0] : menuButton;
      requestAnimationFrame(() => target && target.focus());
    }
  }
  menuButton.addEventListener('click', () => setMenu(!menuIsOpen, { focus: true }));
  navAnchors.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  brand.addEventListener('click', () => setMenu(false));
  const onBreakpoint = () => setMenu(false);
  if (mobileMenu.addEventListener) mobileMenu.addEventListener('change', onBreakpoint);
  else mobileMenu.addListener(onBreakpoint);
  setMenu(false);

  document.addEventListener('keydown', (event) => {
    if (!menuIsOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, { focus: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [brand, ...navAnchors, menuButton];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* --------------------------------------------------------- Scroll reveal */
  const reveals = [...document.querySelectorAll('.reveal')];
  // Stagger siblings that share a parent (cards in a grid, timeline items…)
  const groups = new Map();
  reveals.forEach((el) => {
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  });
  groups.forEach((list) => list.forEach((el, i) => el.style.setProperty('--i', Math.min(i, 5))));

  const showAll = () => reveals.forEach((el) => el.classList.add('is-visible', 'is-settled'));
  if (prefersReduced() || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        observer.unobserve(el);
        // Drop the stagger delay once revealed so hover transitions stay snappy.
        window.setTimeout(() => el.classList.add('is-settled'), 1400);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach((el) => io.observe(el));
  }
  window.addEventListener('beforeprint', showAll);

  /* --------------------------------------------------------------- Marquee */
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    const track = marquee.querySelector('.marquee-track');
    const list = track.querySelector('.marquee-list');
    const clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('aria-label');
    track.appendChild(clone);
    const syncMarquee = () => {
      marquee.classList.toggle('is-static', prefersReduced());
      clone.hidden = prefersReduced();
    };
    syncMarquee();
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMarquee);
  }

  /* -------------------------------------------------------------- Lightbox */
  const lightbox = document.querySelector('.lightbox');
  const lbImage = lightbox.querySelector('.lightbox-stage img');
  const lbSource = lightbox.querySelector('.lightbox-stage source');
  const lbTitle = lightbox.querySelector('.lightbox-title');
  const lbSub = lightbox.querySelector('.lightbox-sub');
  const lbCounter = lightbox.querySelector('.lightbox-counter');
  const lbOriginal = lightbox.querySelector('.lightbox-original');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');
  let sequence = [];
  let index = 0;
  let returnFocus = null;

  function describe(trigger) {
    const item = trigger.closest('.photo-card, .certificate, .gallery-item') || trigger;
    const title = item.querySelector('[data-lb-title]');
    const caption = item.querySelector('[data-lb-caption]');
    const img = trigger.querySelector('img');
    const source = trigger.querySelector('source');
    return {
      title: title ? title.textContent.trim() : (img ? img.alt : ''),
      caption: caption ? caption.textContent.trim() : '',
      alt: img ? img.alt : '',
      src: img ? img.getAttribute('src') : '',
      srcset: source ? source.getAttribute('srcset') : '',
    };
  }

  function show(i, direction) {
    index = (i + sequence.length) % sequence.length;
    const data = describe(sequence[index]);
    lbImage.classList.remove('is-next', 'is-prev');
    if (data.srcset) lbSource.setAttribute('srcset', data.srcset);
    else lbSource.removeAttribute('srcset');
    lbSource.setAttribute('sizes', '(min-width: 78rem) 72rem, 94vw');
    lbImage.src = data.src;
    lbImage.alt = data.alt;
    lbTitle.textContent = data.title;
    lbSub.textContent = data.caption;
    lbCounter.textContent = sequence.length > 1 ? `Image ${index + 1} of ${sequence.length}` : '';
    lbOriginal.href = data.src;
    lbOriginal.setAttribute('aria-label', `Open original image: ${data.title} (opens in a new tab)`);
    const single = sequence.length < 2;
    lbPrev.hidden = single;
    lbNext.hidden = single;
    if (direction && !prefersReduced()) {
      void lbImage.offsetWidth; // restart animation
      lbImage.classList.add(direction > 0 ? 'is-next' : 'is-prev');
    }
    // Warm the neighbours so navigation feels instant.
    [index + 1, index - 1].forEach((n) => {
      const next = sequence[(n + sequence.length) % sequence.length];
      const src = next && next.querySelector('img');
      if (src) { const pre = new Image(); pre.decoding = 'async'; pre.src = src.getAttribute('src'); }
    });
  }

  function openPreview(trigger) {
    const group = trigger.closest('[data-gallery]');
    sequence = group ? [...group.querySelectorAll('[data-view]')] : [trigger];
    returnFocus = trigger;
    show(sequence.indexOf(trigger), 0);
    document.body.classList.add('modal-open');
    lightbox.classList.remove('is-closing');
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    lbClose.focus();
  }

  let closing = false;
  function closePreview() {
    if (!lightbox.hasAttribute('open') || closing) return;
    const finish = () => {
      closing = false;
      lightbox.classList.remove('is-closing');
      if (typeof lightbox.close === 'function') lightbox.close();
      else { lightbox.removeAttribute('open'); finishClose(); }
    };
    if (prefersReduced()) { finish(); return; }
    closing = true;
    lightbox.classList.add('is-closing');
    window.setTimeout(finish, 200);
  }

  function finishClose() {
    document.body.classList.remove('modal-open');
    lbImage.removeAttribute('src');
    lbSource.removeAttribute('srcset');
    lbImage.alt = '';
    lbOriginal.setAttribute('href', '#');
    const target = returnFocus;
    returnFocus = null;
    if (target) target.focus();
  }

  document.querySelectorAll('[data-view]').forEach((trigger) => {
    trigger.addEventListener('click', () => openPreview(trigger));
  });
  lbClose.addEventListener('click', closePreview);
  lbPrev.addEventListener('click', () => show(index - 1, -1));
  lbNext.addEventListener('click', () => show(index + 1, 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.classList.contains('lightbox-stage')) closePreview();
  });
  lightbox.addEventListener('cancel', (event) => { event.preventDefault(); closePreview(); });
  lightbox.addEventListener('close', finishClose);

  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' && sequence.length > 1) { event.preventDefault(); show(index + 1, 1); }
    else if (event.key === 'ArrowLeft' && sequence.length > 1) { event.preventDefault(); show(index - 1, -1); }
    else if (event.key === 'Home') { event.preventDefault(); show(0, -1); }
    else if (event.key === 'End') { event.preventDefault(); show(sequence.length - 1, 1); }
    else if (event.key === 'Escape') { event.preventDefault(); closePreview(); }
    else if (event.key === 'Tab') {
      const focusable = [lbClose, lbPrev, lbNext, lbOriginal].filter((el) => !el.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!focusable.includes(document.activeElement)) { event.preventDefault(); first.focus(); }
    }
  });

  // Swipe on touch / pen
  const stage = lightbox.querySelector('.lightbox-stage');
  let startX = 0;
  let startY = 0;
  let tracking = false;
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.target.closest('button')) return;
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  stage.addEventListener('pointerup', (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && sequence.length > 1) {
      if (dx < 0) show(index + 1, 1);
      else show(index - 1, -1);
    }
  });
  stage.addEventListener('pointercancel', () => { tracking = false; });

  /* ------------------------------------------------------------ Copy email */
  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  if (copyButton && navigator.clipboard && window.isSecureContext) {
    const label = copyButton.querySelector('.copy-label');
    const original = label.textContent;
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyButton.dataset.copy);
        label.textContent = 'Copied';
        copyStatus.textContent = 'Email address copied to clipboard';
        copyButton.classList.add('is-copied');
        window.setTimeout(() => {
          label.textContent = original;
          copyStatus.textContent = '';
          copyButton.classList.remove('is-copied');
        }, 2200);
      } catch (error) {
        copyButton.hidden = true;
      }
    });
  }

  /* ------------------------------------------------------------------ Misc */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScrollUI();
})();
