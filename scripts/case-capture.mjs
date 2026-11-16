// Estudo do caso aberto (seção 2): abre a linha 1, captura o terminal rodando, testa Esc/foco/axe.
// Uso: node scripts/case-capture.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'case'}`;
const PORT = 5187;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function session(theme, lang, w, h, shots) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=${theme}&lang=${lang}`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('#projetos').scrollIntoView());
  await p.waitForTimeout(2200); // linhas do result set chegam
  await p.click('#row-1');
  for (const [label, ms] of shots) {
    await p.waitForTimeout(ms);
    await p.screenshot({ path: `${out}/${theme}-${lang}-${w}-${label}.png` });
  }
  const state = await p.evaluate(() => ({
    expanded: document.querySelector('#row-1').getAttribute('aria-expanded'),
    qbar: document.querySelector('[data-qbar-code]').textContent,
    status: document.querySelector('[data-qbar-status]').textContent,
    rowTop: Math.round(document.querySelector('tr.row').getBoundingClientRect().top),
  }));
  return { ctx, p, state };
}

try {
  {
    const { ctx, p, state } = await session('light', 'pt', 1440, 900, [['t1-opening', 450], ['t2-running', 2600], ['t3-done', 5200]]);
    const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    await p.keyboard.press('Escape');
    await p.waitForTimeout(800);
    const afterEsc = await p.evaluate(() => ({
      expanded: document.querySelector('#row-1').getAttribute('aria-expanded'),
      focus: document.activeElement.id,
      qbar: document.querySelector('[data-qbar-code]').textContent.slice(0, 40),
    }));
    await p.screenshot({ path: `${out}/light-pt-1440-t4-closed.png` });
    console.log('light/pt:', JSON.stringify({ state, axe: axe.violations.map((v) => `${v.id}:${v.nodes.length}`), afterEsc }));
    await ctx.close();
  }
  {
    const { ctx, state } = await session('dark', 'en', 1440, 900, [['t3-done', 8200]]);
    console.log('dark/en:', JSON.stringify(state));
    await ctx.close();
  }
  {
    const { ctx, p, state } = await session('light', 'pt', 390, 844, [['t3-done', 8200]]);
    await p.screenshot({ path: `${out}/light-pt-390-full.png`, fullPage: true });
    console.log('mobile:', JSON.stringify(state));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
