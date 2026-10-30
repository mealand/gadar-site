import { gsap, ScrollTrigger, SplitText, reducedMotion } from '../core.js';

export function heroIntro() {
  const title = document.querySelector('[data-hero-title]');
  const bits = document.querySelectorAll('[data-hero-reveal]');
  if (!title) return;
  gsap.set([title, ...bits], { visibility: 'visible' });
  if (reducedMotion) return;

  const split = SplitText.create(title, { type: 'words,chars', charsClass: 'char', mask: 'words' });
  gsap.timeline({ delay: 0.1 })
    .from('.hero__media', { scale: 1.25, duration: 2.6, ease: 'expo.out' })
    .from(split.chars, { yPercent: 120, rotate: 6, opacity: 0, duration: 1.4, stagger: 0.035 }, 0.2)
    .from(bits, { y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.12 }, 0.8);

  // The hero drifts and dims as it scrolls away.
  gsap.to('.hero__content', {
    yPercent: -30, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__media', {
    yPercent: 20, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

// Uses the real showreel if one has been uploaded, otherwise a slow crossfading slideshow.
export async function heroMedia() {
  const video = document.querySelector('.hero__video');
  const slides = gsap.utils.toArray('.hero__slides img');
  if (video?.dataset.src) {
    try {
      const res = await fetch(video.dataset.src, { method: 'HEAD' });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.startsWith('video')) {
        video.src = video.dataset.src;
        video.addEventListener('canplay', () => video.classList.add('is-ready'), { once: true });
        if (!reducedMotion) video.play().catch(() => {});
        return;
      }
    } catch { /* fall back to slides */ }
  }
  if (reducedMotion || slides.length < 2) return;
  const tl = gsap.timeline({ repeat: -1 });
  slides.forEach((img, i) => {
    const next = slides[(i + 1) % slides.length];
    tl.fromTo(img, { scale: 1 }, { scale: 1.12, duration: 7, ease: 'none' }, i * 6)
      .to(next, { opacity: 1, duration: 1.6, ease: 'power1.inOut' }, i * 6 + 5)
      .to(img, { opacity: 0, duration: 1.6, ease: 'power1.inOut' }, i * 6 + 5);
  });
}

// Services panels slide sideways while the section is pinned (desktop only).
export function horizontalServices() {
  const section = document.querySelector('.hscroll');
  const track = section?.querySelector('.hscroll__track');
  if (!track || reducedMotion) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section.querySelector('.hscroll__pin'),
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    track.querySelectorAll('.svc-panel').forEach((panel) => {
      gsap.from(panel.querySelector('img'), {
        scale: 1.3, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
  });
}

export function quotes() {
  const stage = document.querySelector('[data-quotes]');
  if (!stage) return;
  const items = [...stage.querySelectorAll('.quote')];
  const dots = [...document.querySelectorAll('.quotes__dot')];
  let index = 0;
  let timer;

  const show = (next) => {
    if (next === index) return;
    const out = items[index];
    const into = items[next];
    gsap.to(out, { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in' });
    gsap.fromTo(into, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.1, delay: 0.5 });
    items.forEach((q, i) => q.classList.toggle('is-active', i === next));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === next));
    index = next;
  };
  const auto = () => {
    clearInterval(timer);
    timer = setInterval(() => show((index + 1) % items.length), 6500);
  };
  dots.forEach((d, i) => d.addEventListener('click', () => { show(i); auto(); }));
  ScrollTrigger.create({ trigger: stage, start: 'top bottom', onEnter: auto });
}

export function initHome() {
  heroMedia();
  horizontalServices();
  quotes();
}
