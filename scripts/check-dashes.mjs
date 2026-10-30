// Fails the build if an em dash or en dash appears in site source files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['.', 'src', 'public', 'database'];
const exts = new Set(['.html', '.css', '.js', '.mjs', '.php', '.json', '.sql', '.txt', '.svg']);
const skip = new Set(['node_modules', 'dist', '.git', 'uploads']);
const banned = /[–—]/;
const problems = [];

function walk(dir, recurse) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (recurse) walk(path, true);
    } else if (exts.has(extname(name))) {
      readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
        if (banned.test(line)) problems.push(`${path}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
  }
}

roots.forEach((r, i) => walk(r, i > 0));

if (problems.length) {
  console.error('Em or en dashes found. Replace them with commas, colons or full stops:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Dash check passed.');
