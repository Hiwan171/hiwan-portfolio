// Abre cada caso (2–5), espera o artefato terminar e captura o painel; roda axe com o caso aberto.
// Uso: node scripts/cases-all.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'cases'}`;
const PORT = 5191;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
// [caso, espera até o fim (ms), quadros intermediários]
const CASES = [[2, 7000, [1500]], [3, 8500, [2500]], [4, 3500, [900]], [5, 3000, [8000]]];

async function run(theme, lang, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=${theme}&lang=${lang}`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('#projetos').scrollIntoView());
  await p.waitForTimeout(2200);
  const report = {};
  for (const [n, wait, mids] of CASES) {
    await p.click(`#row-${n}`);
    let t = 0;
    for (const m of mids) {
      if (m < wait) { await p.waitForTimeout(m - t); t = m; await p.locator(`#case-${n}`).screenshot({ path: `${out}/${theme}-${lang}-${w}-c${n}-mid.png` }); }
    }
    await p.waitForTimeout(Math.max(0, wait - t));
    await p.locator(`#case-${n}`).screenshot({ path: `${out}/${theme}-${lang}-${w}-c${n}.png` });
    if (n === 5) { // segunda captura do navegador, depois de trocar de aba
      await p.waitForTimeout(5000);
      await p.locator(`#case-${n}`).screenshot({ path: `${out}/${theme}-${lang}-${w}-c${n}-tab.png` });
    }
    const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    report[n] = axe.violations.map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0].target.join(' ')}`);
  }
  console.log(theme, lang, w, JSON.stringify(report));
  await ctx.close();
}

try {
  await run('light', 'pt', 1440, 900);
  await run('dark', 'en', 1440, 900);
  await run('light', 'pt', 390, 844);
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
