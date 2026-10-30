import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const pages = ['index', 'about', 'services', 'gallery', 'experience', 'book', 'contact', '404'];

// Replaces <!-- @include name --> with src/partials/name.html so every page shares one header and footer.
function htmlPartials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
          readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8')
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [htmlPartials()],
  server: {
    // PHP runs separately (npm run dev:php); Vite forwards API and admin calls to it.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(root, `${p}.html`)])),
    },
  },
});
