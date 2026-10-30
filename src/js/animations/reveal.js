import { gsap, ScrollTrigger, SplitText, reducedMotion } from '../core.js';

// Headings with data-split rise line by line from behind a mask.
export function splitHeadings(scope = document) {
  scope.querySelectorAll('[data-split]').forEach((el) => {
    gsap.set(el, { visibility: 'visible' });
    if (reducedMotion) return;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          rotate: 2,
          duration: 1.3,
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
}

// Generic fade and rise for anything marked data-reveal, batched so siblings stagger.
export function revealOnScroll(scope = document) {
  const items = scope.querySelectorAll('[data-reveal]');
  if (reducedMotion) return gsap.set(items, { visibility: 'visible' });
  gsap.set(items, { visibility: 'visible', autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }),
  });
}

// Images wipe open from the bottom while settling from a slight zoom.
export function revealMedia(scope = document) {
  if (reducedMotion) return;
  scope.querySelectorAll('.media--reveal').forEach((fig) => {
    const img = fig.querySelector('img, video');
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .to(fig, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'expo.inOut' })
      .from(img, { scale: 1.35, duration: 2, ease: 'expo.out' }, 0);
  });
}

export function parallax(scope = document) {
  if (reducedMotion) return;
  scope.querySelectorAll('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || -10;
    gsap.fromTo(el, { yPercent: 0 }, {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Statements where each word brightens as the reader scrolls through it.
export function scrubWords(scope = document) {
  scope.querySelectorAll('[data-words]').forEach((el) => {
    if (reducedMotion) return;
    const split = SplitText.create(el, { type: 'words', wordsClass: 'word' });
    gsap.to(split.words, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });
}

export function counters(scope = document) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const raw = el.dataset.count;
    const target = raw === 'years' ? new Date().getFullYear() - 2018 : parseInt(raw, 10);
    const suffix = el.dataset.suffix || '';
    const format = (n) => Math.round(n).toLocaleString('en-NG') + suffix;
    if (reducedMotion) return (el.textContent = format(target));
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2.4,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = format(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

// Timeline rule fills with gold as the milestones scroll past.
export function timelineProgress(scope = document) {
  scope.querySelectorAll('[data-timeline]').forEach((el) => {
    const bar = el.querySelector('.timeline__progress');
    if (reducedMotion) return gsap.set(bar, { scaleY: 1 });
    gsap.to(bar, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 60%', scrub: true } });
  });
}

export function initReveals(scope = document) {
  timelineProgress(scope);
  splitHeadings(scope);
  revealOnScroll(scope);
  revealMedia(scope);
  parallax(scope);
  scrubWords(scope);
  counters(scope);
}
