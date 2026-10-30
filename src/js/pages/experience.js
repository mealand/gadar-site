import { gsap, ScrollTrigger, reducedMotion } from '../core.js';
import { openLightbox } from '../lightbox.js';
import { uploadForm, showFieldErrors } from '../api.js';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Shown until real, approved stories exist.
const samples = [
  { name: 'Sample Client', role: 'client', event_name: 'Wedding reception, Kaduna', story: 'Placeholder story. From our first meeting to the last dance, every single detail felt considered. Our families still talk about the entrance.', media: [{ type: 'image', url: '/assets/placeholders/wedding-08.svg' }] },
  { name: 'Sample Guest', role: 'attendee', event_name: 'Awards night, Abuja', story: 'Placeholder story. The ushers greeted every guest by name and the evening ran perfectly on time.', media: [] },
  { name: 'Sample Client', role: 'client', event_name: 'Corporate gala, Kaduna', story: 'Placeholder story. Calm, professional and beautifully presented. Our partners left impressed.', media: [{ type: 'image', url: '/assets/placeholders/government-05.svg' }, { type: 'image', url: '/assets/placeholders/catering-04.svg' }] },
  { name: 'Sample Guest', role: 'attendee', event_name: 'Concert, Lagos', story: 'Placeholder story. Thousands of people and yet it felt intimate. The VIP hospitality was outstanding.', media: [{ type: 'image', url: '/assets/placeholders/entertainment-06.svg' }] },
];

function cardHTML(item, placeholder = false) {
  const media = (item.media || []).map((m, i) => `
    <button class="exp-card__thumb" type="button" data-media-index="${i}" data-cursor="${m.type === 'video' ? 'Play' : 'View'}" aria-label="Open ${m.type}">
      ${m.type === 'video'
        ? `<video src="${esc(m.url)}#t=0.5" muted playsinline preload="metadata"></video><span class="g-item__play" aria-hidden="true">&#9654;</span>`
        : `<img src="${esc(m.url)}" alt="Shared by ${esc(item.name)}" loading="lazy" />`}
    </button>`).join('');
  return `
    <article class="exp-card ${placeholder ? 'exp-card--placeholder' : ''}" data-role="${esc(item.role)}">
      ${media ? `<div class="exp-card__media">${media}</div>` : ''}
      <p class="exp-card__story">&ldquo;${esc(item.story)}&rdquo;</p>
      <div class="exp-card__meta"><span>${esc(item.name)}, ${item.role === 'client' ? 'Client' : 'Guest'}</span><span>${esc(item.event_name)}</span></div>
    </article>`;
}

function initWall() {
  const wall = document.querySelector('[data-exp-wall]');
  const more = document.querySelector('[data-exp-more]');
  const filters = document.querySelectorAll('[data-exp-filter]');
  if (!wall) return;
  let page = 1;
  let role = 'all';
  let data = [];

  const animateIn = (cards) => {
    if (reducedMotion) return;
    gsap.set(cards, { autoAlpha: 0, y: 60 });
    ScrollTrigger.batch(cards, {
      start: 'top 95%', once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 1.1 }),
    });
  };

  const render = (items, append, placeholder) => {
    if (!append) { wall.innerHTML = ''; data = []; }
    const start = data.length;
    data.push(...items);
    wall.insertAdjacentHTML('beforeend', items.map((it) => cardHTML(it, placeholder)).join(''));
    const cards = [...wall.children].slice(start);
    cards.forEach((card, i) => (card.dataset.index = start + i));
    animateIn(cards);
    ScrollTrigger.refresh();
  };

  const load = async (append = false) => {
    try {
      const res = await fetch(`/api/experiences.php?page=${page}&role=${role}`);
      const json = await res.json();
      if (!json.ok) throw new Error();
      if (!json.items.length && page === 1) {
        render(samples.filter((s) => role === 'all' || s.role === role), false, true);
      } else {
        render(json.items, append, false);
      }
      more.hidden = !json.has_more;
    } catch {
      // API unreachable (for example during local design work): show the samples.
      render(samples.filter((s) => role === 'all' || s.role === role), false, true);
      more.hidden = true;
    }
  };

  wall.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-media-index]');
    if (!thumb) return;
    const item = data[thumb.closest('.exp-card').dataset.index];
    const list = item.media.map((m) => ({ type: m.type, src: m.url, caption: `${item.name}, ${item.event_name}` }));
    openLightbox(list, Number(thumb.dataset.mediaIndex));
  });

  more?.addEventListener('click', () => { page += 1; load(true); });
  filters.forEach((f) => f.addEventListener('click', () => {
    filters.forEach((b) => b.classList.toggle('is-active', b === f));
    role = f.dataset.expFilter;
    page = 1;
    load();
  }));

  return load();
}

function initShareForm() {
  const form = document.querySelector('[data-exp-form]');
  if (!form) return;
  const input = form.querySelector('input[type=file]');
  const drop = form.querySelector('[data-dropzone]');
  const previews = form.querySelector('[data-previews]');
  const progress = form.querySelector('[data-progress]');
  const status = form.querySelector('.form-status');
  let files = [];

  const fileError = (msg) => showFieldErrors(form, msg ? { media: msg } : {});

  const addFiles = (list) => {
    let msg = '';
    for (const f of list) {
      const isImage = f.type.startsWith('image/');
      const isVideo = f.type.startsWith('video/');
      const images = files.filter((x) => x.type.startsWith('image/')).length;
      const videos = files.filter((x) => x.type.startsWith('video/')).length;
      if (!isImage && !isVideo) { msg = `${f.name} is not a supported photo or video.`; continue; }
      if (isImage && images >= MAX_IMAGES) { msg = `You can add up to ${MAX_IMAGES} photos.`; continue; }
      if (isVideo && videos >= MAX_VIDEOS) { msg = 'You can add one video.'; continue; }
      if (isImage && f.size > MAX_IMAGE_MB * 1048576) { msg = `${f.name} is larger than ${MAX_IMAGE_MB} MB.`; continue; }
      if (isVideo && f.size > MAX_VIDEO_MB * 1048576) { msg = `${f.name} is larger than ${MAX_VIDEO_MB} MB.`; continue; }
      files.push(f);
    }
    fileError(msg);
    drawPreviews();
  };

  const drawPreviews = () => {
    previews.querySelectorAll('[data-url]').forEach((el) => URL.revokeObjectURL(el.dataset.url));
    previews.innerHTML = '';
    files.forEach((f, i) => {
      const url = URL.createObjectURL(f);
      const el = document.createElement('div');
      el.className = 'preview';
      el.dataset.url = url;
      el.innerHTML = f.type.startsWith('video/')
        ? `<video src="${url}" muted playsinline></video>`
        : `<img src="${url}" alt="" />`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${f.name}`);
      remove.innerHTML = '&#10005;';
      remove.addEventListener('click', () => { files.splice(i, 1); drawPreviews(); });
      el.appendChild(remove);
      previews.appendChild(el);
      if (!reducedMotion) gsap.from(el, { scale: 0.6, autoAlpha: 0, duration: 0.6, delay: i * 0.04 });
    });
  };

  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = (n) => (form.elements[n]?.value || '').trim();
    const errors = {};
    if (v('name').length < 2) errors.name = 'Please tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(v('email'))) errors.email = 'Please enter a valid email address.';
    if (!v('event_name')) errors.event_name = 'Please tell us which event.';
    if (v('story').length < 20) errors.story = 'Please write at least a sentence or two.';
    if (!form.elements.consent.checked) errors.consent = 'Please confirm we may publish your story.';
    showFieldErrors(form, errors);
    if (errors.consent && Object.keys(errors).length === 1) {
      status.className = 'form-status is-error';
      status.textContent = errors.consent;
    }
    if (Object.keys(errors).length) return;

    const fd = new FormData(form);
    fd.delete('media[]');
    files.forEach((f) => fd.append('media[]', f, f.name));

    const button = form.querySelector('[type=submit]');
    const bar = progress.querySelector('span');
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = files.length ? 'Uploading your story...' : 'Sending your story...';
    progress.classList.add('is-active');
    bar.style.width = '0';
    try {
      await uploadForm('/api/experience-submit.php', fd, (p) => (bar.style.width = `${Math.round(p * 100)}%`));
      form.reset();
      files = [];
      drawPreviews();
      status.classList.add('is-success');
      status.textContent = 'Thank you for sharing your Gadar Experience. Our team will review it shortly and it will appear on the wall once approved.';
    } catch (err) {
      showFieldErrors(form, err.fields);
      status.classList.add('is-error');
      status.textContent = err.message;
    } finally {
      button.disabled = false;
      setTimeout(() => progress.classList.remove('is-active'), 600);
    }
  });
}

export function initExperience() {
  initShareForm();
  return initWall();
}
