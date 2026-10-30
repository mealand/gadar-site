// Small helpers for talking to the PHP API.
let token = null;

export async function csrf() {
  if (token) return token;
  const res = await fetch('/api/csrf.php', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Could not reach the server. Please try again shortly.');
  token = (await res.json()).token;
  return token;
}

export async function postForm(url, formData) {
  formData.set('csrf', await csrf());
  const res = await fetch(url, { method: 'POST', body: formData, credentials: 'same-origin' });
  let data = {};
  try { data = await res.json(); } catch { /* non JSON reply */ }
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || 'Something went wrong. Please try again.');
    err.fields = data.errors || {};
    throw err;
  }
  return data;
}

// Upload with progress reporting, used for photo and video submissions.
export async function uploadForm(url, formData, onProgress) {
  formData.set('csrf', await csrf());
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.upload.addEventListener('progress', (e) => e.lengthComputable && onProgress?.(e.loaded / e.total));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* non JSON reply */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) return resolve(data);
      const err = new Error(data.message || (xhr.status === 413 ? 'Those files are too large. Please choose smaller ones.' : 'Upload failed. Please try again.'));
      err.fields = data.errors || {};
      reject(err);
    };
    xhr.onerror = () => reject(new Error('Network error. Please check your connection and try again.'));
    xhr.send(formData);
  });
}

export function showFieldErrors(form, errors = {}) {
  form.querySelectorAll('.field').forEach((f) => {
    f.classList.remove('has-error');
    const msg = f.querySelector('.field__error');
    if (msg) msg.textContent = '';
  });
  Object.entries(errors).forEach(([name, message]) => {
    const input = form.querySelector(`[name="${name}"], [name="${name}[]"]`);
    const field = input?.closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    const msg = field.querySelector('.field__error');
    if (msg) msg.textContent = message;
  });
  const first = form.querySelector('.has-error input, .has-error select, .has-error textarea');
  first?.focus({ preventScroll: false });
}

export const site = {
  // Placeholder contact details: replace with the real ones.
  whatsapp: '2348000000000',
  phone: '+234 800 000 0000',
  email: 'hello@gadarevents.com',
};
