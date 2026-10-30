import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/pages.css';

import { gsap, ScrollTrigger, initSmoothScroll, scrollTo } from './core.js';
import { initCursor } from './cursor.js';
import { playIntro, initPageTransitions } from './animations/transitions.js';
import { initReveals } from './animations/reveal.js';
import { magnetic, tilt, marquee, header, mobileMenu, footerYear } from './animations/interactions.js';

const pages = {
  home: () => import('./pages/home.js').then((m) => m.initHome()),
  gallery: () => import('./pages/gallery.js').then((m) => m.initGallery()),
  experience: () => import('./pages/experience.js').then((m) => m.initExperience()),
  book: () => import('./forms/booking.js').then((m) => m.initBooking()),
  contact: () => import('./forms/contact.js').then((m) => m.initContact()),
};

async function boot() {
  initSmoothScroll();
  initCursor();
  initPageTransitions();
  header();
  mobileMenu();
  footerYear();

  const page = document.body.dataset.page;
  const pageReady = pages[page]?.();

  await document.fonts.ready;
  await playIntro();

  if (page === 'home') {
    const { heroIntro } = await import('./pages/home.js');
    heroIntro();
  } else {
    pageHeroIntro();
  }

  await pageReady;
  initReveals();
  magnetic();
  tilt();
  marquee();

  // In page anchors scroll smoothly through Lenis.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        scrollTo(id);
      }
    });
  });
  if (location.hash && document.querySelector(location.hash)) setTimeout(() => scrollTo(location.hash), 300);

  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Inner page heroes: background settles while the title rises.
function pageHeroIntro() {
  const hero = document.querySelector('.page-hero');
  if (!hero) return;
  const bg = hero.querySelector('.page-hero__bg img');
  if (bg && !document.documentElement.classList.contains('reduced-motion')) {
    gsap.from(bg, { scale: 1.3, duration: 2.4 });
    gsap.to(bg, { yPercent: 15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

boot();
