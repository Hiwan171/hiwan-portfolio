// Seção 3 (trajetória): tela fixa horizontal, inclinação por velocidade, eixo de anos, mobile, axe.
// Uso: node scripts/path-capture.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'path'}`;
const PORT = 5194;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const info = (p) => p.evaluate(() => ({
  y: Math.round(scrollY),
  hpath: document.documentElement.classList.contains('has-hpath'),
  active: document.querySelector('[data-path-ticks] li.is-active')?.textContent,
  qbar: document.querySelector('[data-qbar-code]').textContent.slice(0, 40),
  status: document.querySelector('[data-qbar-status]').textContent,
  pathTop: Math.round(document.querySelector('[data-path]').getBoundingClientRect().top),
  skew: getComputedStyle(document.querySelector('[data-path-track]')).transform.slice(0, 40),
}));

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=light&lang=pt`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('#trajetoria').scrollIntoView());
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/d-0-head.png` });
  console.log('cabeçalho', JSON.stringify(await info(p)));
  await p.mouse.move(700, 500);
  const wheel = async (px, step = 100, wait = 16) => { for (let s = 0; s < px; s += step) { await p.mouse.wheel(0, step); await p.waitForTimeout(wait); } };
  await wheel(700);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/d-1-start.png` });
  console.log('início', JSON.stringify(await info(p)));
  await wheel(1500);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/d-2-mid.png` });
  console.log('meio', JSON.stringify(await info(p)));
  // rolagem rápida: captura no meio do movimento para ver a inclinação; mede se a barra "pula"
  await wheel(900, 300, 8);
  await p.screenshot({ path: `${out}/d-3-fast.png` });
  const jumps = [];
  for (let k = 0; k < 12; k++) {
    await p.mouse.wheel(0, 300);
    jumps.push(await p.evaluate(() => [Math.round(document.querySelector('.bar').getBoundingClientRect().top), Math.round(document.querySelector('[data-path]').getBoundingClientRect().top)]));
    await p.waitForTimeout(30);
  }
  console.log('rápido', JSON.stringify(await info(p)), 'barra/path top durante:', JSON.stringify(jumps));
  await p.waitForTimeout(1500);
  await wheel(2500);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/d-4-end.png` });
  console.log('fim', JSON.stringify(await info(p)));
  const axe = await new AxeBuilder({ page: p }).include('#trajetoria').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  console.log('axe', JSON.stringify(axe.violations.map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0].target.join(' ')}`)));
  await ctx.close();

  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${base}?static&theme=dark&lang=en`);
  await m.waitForFunction(() => window.__introDone === true);
  await m.evaluate(() => document.querySelector('#trajetoria').scrollIntoView());
  await m.waitForTimeout(1200);
  await m.locator('#trajetoria').screenshot({ path: `${out}/m-section.png` });
  console.log('mobile', JSON.stringify(await info(m)));
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
