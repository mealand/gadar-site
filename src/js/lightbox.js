import { gsap, lenis } from './core.js';

// Shared lightbox. items: [{ type: 'image' | 'video', src, caption }]
let box;
let list = [];
let index = 0;
let lastFocus;

function build() {
  box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Media viewer');
  box.innerHTML = `
    <button class="lightbox__btn lightbox__close" aria-label="Close">&#10005;</button>
    <button class="lightbox__btn lightbox__prev" aria-label="Previous">&#8592;</button>
    <button class="lightbox__btn lightbox__next" aria-label="Next">&#8594;</button>
    <figure class="lightbox__stage"><div class="lightbox__media"></div><figcaption class="lightbox__caption"></figcaption></figure>`;
  document.body.appendChild(box);
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', () => go(-1));
  box.querySelector('.lightbox__next').addEventListener('click', () => go(1));
  box.addEventListener('click', (e) => e.target === box && close());
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
}

function render() {
  const item = list[index];
  const media = box.querySelector('.lightbox__media');
  media.innerHTML = '';
  let el;
  if (item.type === 'video') {
    el = document.createElement('video');
    Object.assign(el, { src: item.src, controls: true, autoplay: true, playsInline: true });
  } else {
    el = document.createElement('img');
    Object.assign(el, { src: item.src, alt: item.caption || '' });
  }
  media.appendChild(el);
  box.querySelector('.lightbox__caption').textContent = item.caption || '';
  const multi = list.length > 1;
  box.querySelector('.lightbox__prev').hidden = !multi;
  box.querySelector('.lightbox__next').hidden = !multi;
  gsap.fromTo(el, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.8 });
}

function go(dir) {
  index = (index + dir + list.length) % list.length;
  render();
}

export function openLightbox(items, start = 0) {
  if (!box) build();
  list = items;
  index = start;
  lastFocus = document.activeElement;
  box.classList.add('is-open');
  lenis?.stop();
  render();
  gsap.to(box, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
  box.querySelector('.lightbox__close').focus();
}

function close() {
  box.classList.remove('is-open');
  lenis?.start();
  gsap.to(box, {
    autoAlpha: 0, duration: 0.4,
    onComplete: () => (box.querySelector('.lightbox__media').innerHTML = ''),
  });
  lastFocus?.focus();
}
