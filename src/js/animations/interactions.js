import { gsap, ScrollTrigger, finePointer, reducedMotion, lenis } from '../core.js';

// Buttons lean toward the pointer and spring back on leave.
export function magnetic() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const label = el.querySelector('span');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * 0.3, y: y * 0.4, duration: 0.6, ease: 'power3.out' });
      if (label) gsap.to(label, { x: x * 0.12, y: y * 0.15, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to([el, label].filter(Boolean), { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// Cards tilt in 3D following the pointer.
export function tilt() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: 0.6, ease: 'power2.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: 'power3.out' }));
  });
}

// Infinite marquee that reverses with the scroll direction and speeds up with scroll velocity.
export function marquee() {
  document.querySelectorAll('.marquee__track').forEach((track) => {
    track.innerHTML += track.innerHTML;
    if (reducedMotion) return;
    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 30, repeat: -1 });
    loop.totalTime(loop.duration() * 1000); // headroom so reversing never hits the start
    ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        const v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.to(loop, { timeScale: self.direction * (1 + v), duration: 0.4, overwrite: true });
      },
    });
  });
}

export function header() {
  const el = document.querySelector('[data-header]');
  if (!el) return;
  const page = document.body.dataset.page;
  el.querySelector(`[data-nav="${page}"]`)?.classList.add('is-active');
  let last = 0;
  const update = (y) => {
    el.classList.toggle('is-scrolled', y > 40);
    el.classList.toggle('is-hidden', y > last && y > 400 && !document.body.classList.contains('menu-open'));
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => update(scroll));
  else window.addEventListener('scroll', () => update(window.scrollY), { passive: true });
  update(window.scrollY);
}

export function mobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  const links = menu.querySelectorAll('li a');
  let open = false;

  const set = (state) => {
    open = state;
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      lenis?.stop();
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, { clipPath: 'circle(150% at calc(100% - 3rem) 2.6rem)', duration: reducedMotion ? 0 : 1, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: 1, delay: 0.35 });
    } else {
      lenis?.start();
      gsap.to(menu, {
        clipPath: 'circle(0% at calc(100% - 3rem) 2.6rem)', duration: reducedMotion ? 0 : 0.8, ease: 'expo.inOut',
        onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
      });
    }
  };
  toggle.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && open && set(false));
}

export function footerYear() {
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}
