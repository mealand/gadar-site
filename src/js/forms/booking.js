import { gsap, reducedMotion, scrollTo } from '../core.js';
import { postForm, showFieldErrors, site } from '../api.js';

const val = (form, name) => (form.elements[name]?.value || '').trim();

const validators = {
  1(form) {
    return form.querySelector('[name="event_type"]:checked') ? {} : { event_type: 'Please choose the type of event.' };
  },
  2(form) {
    const e = {};
    if (!val(form, 'location')) e.location = 'Please tell us the city or venue.';
    if (!val(form, 'guests')) e.guests = 'Please choose an approximate guest count.';
    const date = val(form, 'event_date');
    if (date && new Date(date) < new Date(new Date().toDateString())) e.event_date = 'Please choose a date in the future.';
    return e;
  },
  3(form) {
    const e = {};
    if (val(form, 'name').length < 2) e.name = 'Please tell us your name.';
    if (val(form, 'phone').replace(/\D/g, '').length < 7) e.phone = 'Please enter a phone number we can call.';
    if (!/^\S+@\S+\.\S+$/.test(val(form, 'email'))) e.email = 'Please enter a valid email address.';
    if (!val(form, 'preferred_time')) e.preferred_time = 'Please choose a time.';
    return e;
  },
};

export function initBooking() {
  const form = document.querySelector('[data-booking]');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const stepItems = [...document.querySelectorAll('[data-steps] li')];
  const bar = form.querySelector('.booking__bar span');
  const status = form.querySelector('.form-status');
  let current = 0;

  const params = new URLSearchParams(location.search);
  const service = params.get('service');
  if (service) {
    const chip = form.querySelector(`[name="services[]"][value="${CSS.escape(service)}"]`);
    if (chip) chip.checked = true;
  }
  const type = params.get('type');
  if (type) {
    const radio = [...form.querySelectorAll('[name="event_type"]')].find((r) => r.value.toLowerCase().startsWith(type.toLowerCase()));
    if (radio) radio.checked = true;
  }

  const go = (next) => {
    const from = steps[current];
    const to = steps[next];
    const dir = next > current ? 1 : -1;
    stepItems.forEach((li, i) => {
      li.classList.toggle('is-active', i === next);
      li.classList.toggle('is-done', i < next);
    });
    bar.style.width = `${Math.min(100, ((next + 1) / 3) * 100)}%`;
    current = next;

    const swap = () => {
      from.classList.remove('is-active');
      to.classList.add('is-active');
      scrollTo('.booking', -120);
      if (reducedMotion) return;
      gsap.fromTo(to.children, { autoAlpha: 0, x: 60 * dir }, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.9 });
    };
    if (reducedMotion) return swap();
    gsap.to(from.children, { autoAlpha: 0, x: -60 * dir, stagger: 0.03, duration: 0.4, ease: 'power2.in', onComplete: () => {
      gsap.set(from.children, { clearProps: 'all' });
      swap();
    } });
  };

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) {
      const errors = validators[current + 1](form);
      showFieldErrors(form, errors);
      if (!Object.keys(errors).length) go(current + 1);
    }
    if (e.target.closest('[data-prev]')) go(current - 1);
  });

  // Picking an event type moves straight on, which feels quicker on mobile.
  form.querySelectorAll('[name="event_type"]').forEach((r) =>
    r.addEventListener('change', () => {
      showFieldErrors(form, {});
      setTimeout(() => current === 0 && go(1), 450);
    })
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = validators[3](form);
    showFieldErrors(form, errors);
    if (Object.keys(errors).length) return;

    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending your request...';
    try {
      await postForm('/api/booking.php', new FormData(form));
      showConfirmation(form);
    } catch (err) {
      status.classList.add('is-error');
      status.textContent = err.message;
      const fields = err.fields || {};
      showFieldErrors(form, fields);
      const firstStep = Object.keys(fields).map((f) => form.querySelector(`[name="${f}"], [name="${f}[]"]`)?.closest('.step')).find(Boolean);
      if (firstStep && steps.indexOf(firstStep) !== current) go(steps.indexOf(firstStep));
    } finally {
      button.disabled = false;
    }
  });

  function showConfirmation() {
    const name = val(form, 'name').split(' ')[0];
    const type = form.querySelector('[name="event_type"]:checked').value;
    form.querySelector('[data-confirm-name]').textContent = name;
    const text = `Hello Gadar Events, I am ${val(form, 'name')}. I just requested a call about a ${type} in ${val(form, 'location')}.`;
    form.querySelector('[data-confirm-whatsapp]').href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
    stepItems.forEach((li) => { li.classList.remove('is-active'); li.classList.add('is-done'); });
    bar.style.width = '100%';
    steps[current].classList.remove('is-active');
    const done = form.querySelector('[data-step="done"]');
    done.classList.add('is-active');
    done.focus();
    scrollTo('.booking', -120);
    if (reducedMotion) return gsap.set('.confirm__mark circle, .confirm__mark path', { strokeDashoffset: 0 });
    gsap.timeline()
      .to('.confirm__mark circle', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
      .to('.confirm__mark path', { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
      .from(done.querySelectorAll('h2, p, .confirm__actions'), { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1 }, 0.4);
  }
}
