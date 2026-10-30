import { gsap, reducedMotion } from '../core.js';

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

// Plays the monogram preloader on the first visit of a session, otherwise lifts the gold curtain.
export function playIntro() {
  const html = document.documentElement;
  const preloader = document.querySelector('.preloader');
  const panel = document.querySelector('.curtain__panel');

  if (reducedMotion) {
    preloader?.remove();
    gsap.set(panel, { scaleY: 0 });
    html.classList.remove('is-arriving');
    store.set('gadar-loaded', '1');
    store.del('gadar-transition');
    return Promise.resolve();
  }

  if (html.classList.contains('is-arriving') || html.classList.contains('seen-preloader')) {
    preloader?.remove();
    store.del('gadar-transition');
    if (!html.classList.contains('is-arriving')) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .set(panel, { scaleY: 1, transformOrigin: 'top' })
        .call(() => html.classList.remove('is-arriving'))
        .to(panel, { scaleY: 0, duration: 1, ease: 'expo.inOut' });
    });
  }

  document.body.classList.add('is-loading');
  return new Promise((resolve) => {
    const counter = { v: 0 };
    const count = preloader.querySelector('.preloader__count');
    gsap.timeline({
      onComplete() {
        preloader.remove();
        document.body.classList.remove('is-loading');
        store.set('gadar-loaded', '1');
        resolve();
      },
    })
      .to('.preloader__ring', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
      .to('.preloader__g', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.3)
      .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(counter.v)) }, 0)
      .to('.preloader__word', { opacity: 1, letterSpacing: '0.3em', duration: 1.2, ease: 'power2.out' }, 0.8)
      .to(preloader.children, { y: -30, opacity: 0, duration: 0.6, ease: 'power2.in', stagger: 0.05 }, '+=0.2')
      .to(preloader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.2');
  });
}

// Internal links sweep the gold curtain up before navigating.
export function initPageTransitions() {
  if (reducedMotion) return;
  const panel = document.querySelector('.curtain__panel');
  const brand = document.querySelector('.curtain__brand');

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^\/(admin|api)\//.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    store.set('gadar-transition', '1');
    gsap.timeline({ onComplete: () => (location.href = url.href) })
      .set(panel, { transformOrigin: 'bottom' })
      .to(panel, { scaleY: 1, duration: 0.8, ease: 'expo.inOut' })
      .fromTo(brand, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
  });

  // Restore the page if the browser serves it from the back/forward cache.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(panel, { scaleY: 0 });
      gsap.set(brand, { opacity: 0 });
      store.del('gadar-transition');
    }
  });
}
