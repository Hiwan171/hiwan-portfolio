// Seção 2 v2 (lista | painel com artefato vivo): linhas ativas por scroll, varredura, barra de query, mobile, axe.
// Uso: node scripts/proj-capture.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'proj'}`;
const PORT = 5195;
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
  active: document.querySelector('.prow.is-active')?.dataset.i,
  tab: document.querySelector('[data-pane-tab]')?.textContent,
  qbar: document.querySelector('[data-qbar-code]').textContent,
  paneTop: Math.round(document.querySelector('[data-proj-pane]').getBoundingClientRect().top),
  fit: document.querySelector('[data-pane-fit]')?.style.transform,
}));
const toRow = (p, i) => p.evaluate((i) => {
  const r = document.querySelector(`.prow[data-i="${i}"]`);
  const y = r.getBoundingClientRect().top + scrollY - innerHeight * 0.55 + r.offsetHeight / 2;
  window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
}, i);

async function desk(theme, lang, w, h, rows) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=${theme}&lang=${lang}`);
  await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
  for (const [i, label, wait] of rows) {
    await toRow(p, i);
    if (label.endsWith('scan')) { await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${theme}-${w}-${label}.png` }); continue; }
    await p.waitForTimeout(wait);
    await p.screenshot({ path: `${out}/${theme}-${w}-${label}.png` });
    console.log(theme, w, label, JSON.stringify(await info(p)));
  }
  return { ctx, p };
}

try {
  {
    const { ctx, p } = await desk('light', 'pt', 1440, 900, [[0, 'r1', 4500], [1, 'r2-scan', 420], [1, 'r2', 4000], [2, 'r3', 6000], [3, 'r4', 4000], [4, 'r5', 4000]]);
    const axe = await new AxeBuilder({ page: p }).include('#projetos').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    console.log('axe', JSON.stringify(axe.violations.map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0].target.join(' ')}`)));
    // clique leva a linha ao meio e ativa
    await p.evaluate(() => document.querySelector('#row-2').click());
    await p.waitForTimeout(2000);
    console.log('clique', JSON.stringify(await info(p)));
    // overview: topo da seção (entrada vinda da ponte)
    await p.evaluate(() => { const s = document.querySelector('#projetos'); const y = s.getBoundingClientRect().top + scrollY - 160; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/light-1440-entry.png` });
    await ctx.close();
  }
  {
    const { ctx } = await desk('dark', 'en', 1366, 768, [[0, 'r1', 4500], [2, 'r3', 6000], [4, 'r5', 4000]]);
    await ctx.close();
  }
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${base}?static&theme=light&lang=pt`);
  await m.waitForFunction(() => window.__introDone === true);
  await m.evaluate(() => document.querySelector('.prow[data-i="0"]').scrollIntoView());
  await m.waitForTimeout(3500);
  await m.screenshot({ path: `${out}/m-r1.png` });
  await m.evaluate(() => document.querySelector('.prow[data-i="3"]').scrollIntoView());
  await m.waitForTimeout(3500);
  await m.screenshot({ path: `${out}/m-r4.png` });
  console.log('mobile', JSON.stringify(await m.evaluate(() => ({ mounted: document.querySelectorAll('[data-inline] .win').length }))));
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
