// Teste de interação do hero: troca de idioma (re-executa a query) e de tema; checa erros de console.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const out = process.argv[2] || 'captures/interact';
const PORT = 5183;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => window.__introDone === true, null, { timeout: 15000 });

  await page.click('[data-action="lang"]');
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/lang-mid.png` });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/lang-done.png` });

  await page.click('[data-action="theme"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/theme-toggled.png` });

  await page.reload();
  await page.waitForFunction(() => window.__introDone === true, null, { timeout: 15000 });
  const state = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, lang: document.documentElement.lang }));
  console.log('persistido após reload:', state);

  // Camada de interação do hero (contexto com permissão de clipboard)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => errors.push(String(e)));
  await p2.goto(`http://localhost:${PORT}/?static&theme=light&lang=pt`);
  await p2.waitForFunction(() => window.__introDone === true);
  const stack = p2.locator('.result td').nth(2);
  await stack.hover();
  await p2.waitForTimeout(350);
  await p2.screenshot({ path: `${out}/hover-col.png`, clip: { x: 0, y: 680, width: 1440, height: 220 } });
  await stack.click();
  await p2.waitForTimeout(120);
  await p2.screenshot({ path: `${out}/copied.png`, clip: { x: 0, y: 680, width: 1440, height: 220 } });
  const clip = await p2.evaluate(() => navigator.clipboard.readText());
  const metaTxt = await p2.locator('.cell--result .cell__tab-meta').textContent();
  console.log('clipboard:', JSON.stringify(clip), '| aviso:', metaTxt);
  // Magnético: cursor perto do botão principal
  const b = await p2.locator('.btn--primary').boundingBox();
  await p2.mouse.move(b.x + b.width + 40, b.y + b.height / 2 - 20, { steps: 8 });
  await p2.waitForTimeout(600);
  const tr = await p2.locator('.btn--primary').evaluate((el) => getComputedStyle(el).transform);
  console.log('botão magnético transform:', tr);
  await p2.screenshot({ path: `${out}/magnetic.png`, clip: { x: 0, y: 780, width: 600, height: 120 } });
  // Retrato: cursor sobre o rosto (repulsão + inclinação)
  await p2.waitForFunction(() => window.__portraitReady === true);
  const blob = await p2.locator('.blob').boundingBox();
  await p2.mouse.move(blob.x + blob.width * 0.5, blob.y + blob.height * 0.38, { steps: 12 });
  await p2.waitForTimeout(700);
  await p2.screenshot({ path: `${out}/portrait-hover.png`, clip: { x: blob.x - 10, y: blob.y - 10, width: blob.width + 20, height: blob.height + 20 } });
  // FPS aproximado com o retrato animando
  const fps = await p2.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : res(n); };
    requestAnimationFrame(f);
  }));
  console.log('fps com retrato ativo (headless):', fps);
  await ctx.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de console');
