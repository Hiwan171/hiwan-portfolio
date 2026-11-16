// Estudo da ponte hero → projetos: rola com a roda (como o usuário, passando pelo Lenis) e captura.
// Uso: node scripts/scroll-capture.mjs [nome]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'scroll'}`;
const PORT = 5185;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function run(theme, lang, w, h, steps) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${PORT}/?static&theme=${theme}&lang=${lang}`);
  await page.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  await page.mouse.move(w / 2, h / 2);
  let y = 0;
  for (const [label, target, wait] of steps) {
    while (y < target) {
      await page.mouse.wheel(0, 120);
      y += 120;
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${theme}-${lang}-${w}-${label}.png` });
  }
  const state = await page.evaluate(() => ({
    scrollY: Math.round(scrollY),
    qbarOn: document.querySelector('.qbar').classList.contains('is-on'),
    qbar: document.querySelector('[data-qbar-code]').textContent,
    status: document.querySelector('[data-qbar-status]').textContent,
  }));
  console.log(theme, lang, w, JSON.stringify(state));
  await page.close();
}

try {
  // [rótulo, pixels rolados acumulados, espera ms]
  await run('light', 'pt', 1440, 900, [['a-qbar-hero', 360, 900], ['b-rewrite-mid', 640, 450], ['c-projects', 900, 1800], ['d-rows', 1300, 1200]]);
  await run('dark', 'en', 1440, 900, [['c-projects', 900, 1800], ['d-rows', 1300, 1200]]);
  await run('light', 'pt', 390, 844, [['c-projects', 1500, 1800], ['d-rows', 2100, 1200]]);
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
