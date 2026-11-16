// Quadros da tela de conexão (?bootat=t congela a sequência). Uso: node scripts/boot-capture.mjs [nome]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'boot'}`;
const PORT = 5184;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

const shots = [
  // [tema, idioma, largura, altura, tempos]
  ['dark', 'pt', 1440, 900, [0.8, 1.2, 1.65, 1.85, 2.0, 2.3, 2.55, 2.9, 3.2, 3.6]],
  ['light', 'en', 1440, 900, [1.2, 2.3]],
  ['dark', 'pt', 390, 844, [1.2, 2.3]],
];

try {
  for (const [theme, lang, w, h, times] of shots) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const t of times) {
      await page.goto(`http://localhost:${PORT}/?theme=${theme}&lang=${lang}&bootat=${t}`);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/${theme}-${lang}-${w}-t${t.toFixed(2).replace('.', '_')}.png` });
    }
    await page.close();
  }

  // Fluxo real (sem congelar): mede quando o loader sai e se a sessão lembra a conexão.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(String(e)));
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}/?boot`);
  await page.waitForFunction(() => !('boot' in document.documentElement.dataset), null, { timeout: 15000 });
  const bootMs = Date.now() - t0;
  await page.waitForFunction(() => window.__introDone === true, null, { timeout: 15000 });
  const totalMs = Date.now() - t0;
  await page.goto(`http://localhost:${PORT}/`);
  const shownAgain = await page.evaluate(() => 'boot' in document.documentElement.dataset);

  // Pular: clique logo no início.
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const t1 = Date.now();
  await p2.goto(`http://localhost:${PORT}/?boot`);
  await p2.waitForTimeout(300);
  await p2.mouse.click(700, 450);
  await p2.waitForFunction(() => !('boot' in document.documentElement.dataset), null, { timeout: 15000 });
  const skippedMs = Date.now() - t1;

  console.log({ bootMs, totalMs, shownAgainInSession: shownAgain, skippedMs });
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
