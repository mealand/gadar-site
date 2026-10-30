import { gsap, finePointer, reducedMotion } from './core.js';

// Gold dot and trailing ring. Elements with data-cursor="Label" show a filled ring with that label.
export function initCursor() {
  if (!finePointer || reducedMotion) return;
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;
  document.documentElement.classList.add('has-cursor');

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  gsap.set([dot, ring], { opacity: 0 });
  window.addEventListener('pointermove', (e) => {
    gsap.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
    dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
  });
  document.addEventListener('pointerleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, label, input, select, textarea, .filter');
    if (interactive && !interactive.matches('[data-cursor]')) {
      cursor.classList.add('is-hover');
      cursor.classList.remove('is-label');
    } else if (labelled) {
      label.textContent = labelled.dataset.cursor;
      cursor.classList.add('is-label');
      cursor.classList.remove('is-hover');
    } else {
      cursor.classList.remove('is-hover', 'is-label');
    }
  });
}
