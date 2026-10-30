import { postForm, showFieldErrors } from '../api.js';

export function initContact() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('[type=submit]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.elements.name.value.trim()) errors.name = 'Please tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.elements.email.value.trim())) errors.email = 'Please enter a valid email address.';
    if (form.elements.message.value.trim().length < 10) errors.message = 'Please write a short message.';
    showFieldErrors(form, errors);
    if (Object.keys(errors).length) return;

    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending...';
    try {
      await postForm('/api/contact.php', new FormData(form));
      form.reset();
      status.classList.add('is-success');
      status.textContent = 'Thank you. Your message is with us and we will reply shortly.';
    } catch (err) {
      showFieldErrors(form, err.fields);
      status.classList.add('is-error');
      status.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
}
