// Seção 4 (contato) + final (COMMIT desconecta) + rodapé de status. Uso: node scripts/contact-capture.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'contact'}`;
const PORT = 5198;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const ready = (p) => p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 20000 });
const state = (p) => p.evaluate(() => ({
  y: Math.round(scrollY),
  contactTop: Math.round(document.querySelector('#contato').getBoundingClientRect().top),
  qbar: document.querySelector('[data-qbar-code]').textContent.replace(/\s+/g, ' ').slice(0, 70),
  qstatus: document.querySelector('[data-qbar-status]').textContent,
  dotOff: document.querySelector('.bar__conn .dot').classList.contains('dot--off'),
  barState: document.querySelector('.bar__conn .bar__state').textContent,
  status: [...document.querySelectorAll('[data-status-bar] > span')].map((s) => s.textContent).join(' | '),
  endHidden: document.querySelector('[data-contact-end]').hidden,
}));

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=light&lang=pt`);
  await ready(p);
  // Link do menu leva à seção
  await p.click('.bar__nav a[href="#contato"]');
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${out}/d-light-pt.png` });
  console.log('menu → contato', JSON.stringify(await state(p)));
  // Copiar e-mail
  await p.click('[data-copy]');
  await p.waitForTimeout(200);
  console.log('copiar →', await p.evaluate(() => navigator.clipboard.readText()), '| botão:', await p.textContent('[data-copy]'));
  // Hover numa linha
  const row = await p.locator('.crow__link').nth(1).boundingBox();
  await p.mouse.move(row.x + 300, row.y + row.height / 2);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/d-hover.png`, clip: { x: 0, y: row.y - 120, width: 1440, height: 360 } });
  const axe = await new AxeBuilder({ page: p }).include('#contato').include('[data-status-bar]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  console.log('axe:', JSON.stringify(axe.violations.map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0].target.join(' ')}`)));
  // COMMIT, quadro a quadro
  const btn = await p.locator('[data-commit]').boundingBox();
  await p.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2);
  for (const [label, ms] of [['a-query', 700], ['b-sweep', 750], ['c-done', 1400]]) {
    await p.waitForTimeout(ms);
    await p.screenshot({ path: `${out}/d-commit-${label}.png` });
    console.log('commit', label, JSON.stringify(await state(p)));
  }
  await p.waitForTimeout(2200);
  const frozen1 = await p.textContent('[data-status-time]');
  await p.waitForTimeout(1500);
  console.log('relógio congelado?', frozen1 === (await p.textContent('[data-status-time]')), frozen1);
  // Reconectar
  await p.click('[data-reconnect]');
  await p.waitForTimeout(2600);
  console.log('reconectar', JSON.stringify(await state(p)));
  await ctx.close();

  for (const [label, w, h, theme, lang] of [['d-dark-en', 1440, 900, 'dark', 'en'], ['m-light-pt', 390, 844, 'light', 'pt']]) {
    const q = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    q.on('pageerror', (e) => errors.push(String(e)));
    await q.goto(`${base}?static&theme=${theme}&lang=${lang}`);
    await ready(q);
    await q.evaluate(() => document.querySelector('#contato').scrollIntoView());
    await q.waitForTimeout(1800);
    await q.screenshot({ path: `${out}/${label}.png`, fullPage: false });
    console.log(label, JSON.stringify(await state(q)));
    await q.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
