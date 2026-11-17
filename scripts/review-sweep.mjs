// Varredura visual do site inteiro, rolando com a roda (como um visitante) e capturando a cada passo.
// Uso: node scripts/review-sweep.mjs [nome]   → captures/<nome>/<config>-NN-y<scroll>.png
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'review'}`;
const PORT = 5195;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function sweep(label, { w, h, theme, lang, step, dpr = 1 }) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  p.on('pageerror', (e) => errors.push(`${label}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && errors.push(`${label}: ${m.text()}`));
  await p.goto(`${base}?static&theme=${theme}&lang=${lang}`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 20000 });
  await p.mouse.move(w * 0.3, h * 0.5);
  await p.waitForTimeout(600);
  let i = 0, last = -1;
  for (;;) {
    const y = await p.evaluate(() => Math.round(scrollY));
    await p.screenshot({ path: `${out}/${label}-${String(i).padStart(2, '0')}-y${y}.png` });
    if (y === last) break;
    last = y;
    for (let s = 0; s < step; s += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(18); }
    await p.waitForTimeout(1100);
    i++;
    if (i > 40) break;
  }
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  console.log(label, 'quadros:', i + 1, 'altura da página:', H);
  await p.close();
}

try {
  await sweep('d-light-pt', { w: 1440, h: 900, theme: 'light', lang: 'pt', step: 700 });
  await sweep('d-dark-en', { w: 1440, h: 900, theme: 'dark', lang: 'en', step: 1400 });
  await sweep('m-light-pt', { w: 390, h: 844, theme: 'light', lang: 'pt', step: 800, dpr: 1 });
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
