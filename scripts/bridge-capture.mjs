// Ponte em tela fixa: quadros por fase, reversão completa, troca de idioma no meio, mobile sem pin.
// Uso: node scripts/bridge-capture.mjs [nome]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'pin'}`;
const PORT = 5192;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

const state = (p) => p.evaluate(() => ({
  y: Math.round(scrollY),
  bridge: document.documentElement.classList.contains('has-bridge'),
  query: document.querySelector('[data-query]').textContent.replace(/\s+/g, ' ').slice(0, 48),
  status: document.querySelector('[data-status]').textContent,
  qbar: document.querySelector('[data-qbar-code]').textContent.slice(0, 36),
  qbarOn: document.querySelector('.qbar').classList.contains('is-on'),
  heroTop: Math.round(document.querySelector('.hero').getBoundingClientRect().top),
}));

async function wheelTo(p, target, cur) {
  while (Math.abs(target - cur.y) > 60) {
    const d = target > cur.y ? 120 : -120;
    await p.mouse.wheel(0, d);
    cur.y += d;
    await p.waitForTimeout(16);
  }
}

try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=light&lang=pt`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  await p.mouse.move(700, 450);
  const cur = { y: 0 };
  for (const y of [0, 240, 480, 640, 760, 960, 1300]) {
    await wheelTo(p, y, cur);
    await p.waitForTimeout(1100);
    await p.screenshot({ path: `${out}/d-${String(y).padStart(4, '0')}.png` });
    console.log('desce', y, JSON.stringify(await state(p)));
  }
  // Reversão: de volta ao topo
  await wheelTo(p, 0, cur);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/d-back-to-top.png` });
  console.log('volta', JSON.stringify(await state(p)));
  // Troca de idioma no meio da ponte
  await wheelTo(p, 700, cur);
  await p.waitForTimeout(1100);
  await p.click('[data-action="lang"]');
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${out}/d-lang-mid.png` });
  console.log('idioma no meio', JSON.stringify(await state(p)));
  await wheelTo(p, 0, cur);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/d-lang-back-top.png` });
  console.log('idioma, volta', JSON.stringify(await state(p)));
  await p.close();

  // Mobile: sem tela fixa
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${base}?static&theme=light&lang=pt`);
  await m.waitForFunction(() => window.__introDone === true);
  console.log('mobile', JSON.stringify(await state(m)));
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
