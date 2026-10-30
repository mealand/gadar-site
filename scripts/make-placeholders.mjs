// Generates elegant black and gold placeholder images until real Gadar photos are supplied.
import { writeFileSync, mkdirSync } from 'node:fs';

const out = 'public/assets/placeholders';
mkdirSync(out, { recursive: true });

const sets = {
  wedding: 8, government: 5, entertainment: 6, catering: 4, ushering: 4, decor: 4, team: 4, hero: 3,
};
const hues = { wedding: 38, government: 30, entertainment: 18, catering: 28, ushering: 42, decor: 34, team: 36, hero: 40 };

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function svg(cat, n, w, h) {
  const r = rand(cat.length * 97 + n * 31);
  const hue = hues[cat];
  let bokeh = '';
  for (let i = 0; i < 26; i++) {
    const x = (r() * w).toFixed(0);
    const y = (r() * h * 0.8).toFixed(0);
    const rad = (8 + r() * 70).toFixed(0);
    const a = (0.05 + r() * 0.28).toFixed(2);
    bokeh += `<circle cx="${x}" cy="${y}" r="${rad}" fill="hsl(${hue + r() * 12} 70% ${55 + r() * 25}%)" opacity="${a}" filter="url(#b)"/>`;
  }
  const label = `${cat.toUpperCase()} ${String(n).padStart(2, '0')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<radialGradient id="g" cx="${30 + r() * 40}%" cy="${20 + r() * 30}%" r="90%">
<stop offset="0" stop-color="hsl(${hue} 45% 22%)"/><stop offset="0.55" stop-color="hsl(${hue} 20% 8%)"/><stop offset="1" stop-color="#070708"/>
</radialGradient>
<filter id="b"><feGaussianBlur stdDeviation="${(6 + r() * 10).toFixed(1)}"/></filter>
<linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></linearGradient>
</defs>
<rect width="100%" height="100%" fill="url(#g)"/>${bokeh}
<rect width="100%" height="100%" fill="url(#l)"/>
<text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 9)}" fill="#C9A45C" opacity="0.18">G</text>
<text x="32" y="${h - 32}" font-family="Arial, sans-serif" font-size="14" letter-spacing="4" fill="#C9A45C" opacity="0.55">PLACEHOLDER  ${label}</text>
</svg>`;
}

for (const [cat, count] of Object.entries(sets)) {
  for (let n = 1; n <= count; n++) {
    const portrait = cat === 'team' || n % 3 === 0;
    const [w, h] = cat === 'hero' ? [1920, 1080] : portrait ? [900, 1200] : [1200, 900];
    writeFileSync(`${out}/${cat}-${String(n).padStart(2, '0')}.svg`, svg(cat, n, w, h));
  }
}
console.log('Placeholders written to ' + out);
