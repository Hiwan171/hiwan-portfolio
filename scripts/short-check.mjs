// Janela de notebook com abas/favoritos (viewport ~1376×640): hero, pane, console, filtro após idioma.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5202', '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.on('data', (b) => String(b).includes('Local') && r()));
const b = await chromium.launch();
const errors = [];
for (const [w, h] of [[1376, 640], [1366, 768], [1440, 900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto('http://localhost:5202/?static&theme=light&lang=pt');
  await p.waitForFunction(() => window.__introDone && window.__portraitReady);
  const hero = await p.evaluate(() => Math.round(document.querySelector('.actions').getBoundingClientRect().bottom));
  await p.screenshot({ path: `captures/video/fix-hero-${h}.png` });
  await p.keyboard.press('/'); await p.waitForTimeout(500);
  await p.fill('[data-console-input]', 'SELECT * FROM sys.dm_exec_sessions;'); await p.keyboard.press('F5');
  await p.waitForFunction(() => /s$/.test(document.querySelector('[data-console-status]').textContent || ''));
  const rowsVisible = await p.evaluate(() => { const pane = document.querySelector('[data-console-results]').getBoundingClientRect(); return [...document.querySelectorAll('[data-console-results] tr')].filter((tr) => tr.getBoundingClientRect().bottom <= pane.bottom).length; });
  await p.fill('[data-console-input]', 'SELECT TOP 3 projeto FROM dbo.projetos ORDER BY ano DESC;'); await p.keyboard.press('F5');
  await p.waitForFunction(() => /s$/.test(document.querySelector('[data-console-status]').textContent || ''));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.click('[data-action="lang"]'); await p.waitForTimeout(1500);
  const filt = await p.evaluate(() => ({ banner: !document.querySelector('[data-proj-filter]').hidden, rows: [...document.querySelectorAll('[data-proj-list] .prow')].filter((r) => !r.hidden).length }));
  await p.click('[data-action="lang"]'); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#projetos').scrollIntoView()); await p.waitForTimeout(1200);
  const fit = await p.evaluate(() => document.querySelector('[data-pane-fit]').style.transform);
  await p.screenshot({ path: `captures/video/fix-pane-${h}.png` });
  console.log(`${w}×${h}`, JSON.stringify({ botoesHeroAte: hero, cabe: hero <= h, linhasMonitorVisiveis: rowsVisible, filtroAposIdioma: filt, escalaArtefato: fit }));
  await p.close();
}
await b.close(); server.kill();
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
