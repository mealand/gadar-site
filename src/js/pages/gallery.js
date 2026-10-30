import { gsap, ScrollTrigger, Flip, reducedMotion } from '../core.js';
import { openLightbox } from '../lightbox.js';

const playIcon = '<span class="g-item__play" aria-hidden="true">&#9654;</span>';

export async function initGallery() {
  const grid = document.querySelector('[data-gallery]');
  if (!grid) return;
  let items = [];
  try {
    items = await (await fetch('/assets/gallery.json')).json();
  } catch {
    grid.innerHTML = '<p>The gallery could not be loaded right now.</p>';
    return;
  }

  grid.innerHTML = items.map((item, i) => `
    <button class="g-item ${item.size ? 'g-item--' + item.size : ''}" data-category="${item.category}" data-index="${i}"
      data-cursor="${item.type === 'video' ? 'Play' : 'View'}" aria-label="Open ${item.caption}">
      <img src="${item.poster || item.src}" alt="${item.caption}" loading="lazy" />
      ${item.type === 'video' ? `<video class="g-item__video" data-src="${item.src}" muted loop playsinline preload="none" aria-hidden="true"></video>${playIcon}` : ''}
      <span class="g-item__label">${item.caption}</span>
    </button>`).join('');

  const cards = [...grid.children];

  if (!reducedMotion) {
    gsap.set(cards, { autoAlpha: 0, y: 60 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 1.2 }),
    });
  }

  // Video tiles play silently while they are on screen.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        if (!target.src) target.src = target.dataset.src;
        target.play().then(() => target.classList.add('is-playing')).catch(() => {});
      } else {
        target.pause();
      }
    }), { rootMargin: '100px' });
    grid.querySelectorAll('.g-item__video').forEach((v) => io.observe(v));
  }

  const visible = () => cards.filter((c) => !c.classList.contains('is-hidden'));

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.g-item');
    if (!card) return;
    const shown = visible();
    const list = shown.map((c) => items[c.dataset.index]);
    openLightbox(list, shown.indexOf(card));
  });

  const buttons = document.querySelectorAll('[data-filter]');
  const apply = (filter, animate = true) => {
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === filter));
    const state = Flip.getState(cards);
    cards.forEach((c) => c.classList.toggle('is-hidden', filter !== 'all' && c.dataset.category !== filter));
    if (animate && !reducedMotion) {
      gsap.set(cards, { autoAlpha: 1, y: 0 });
      Flip.from(state, {
        duration: 0.9,
        ease: 'expo.inOut',
        scale: true,
        absolute: true,
        stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.5 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    }
  };
  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));

  const initial = new URLSearchParams(location.search).get('filter');
  if (initial && document.querySelector(`[data-filter="${initial}"]`)) apply(initial, false);
}
