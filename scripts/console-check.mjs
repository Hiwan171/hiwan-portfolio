// Console SQL, monitor, atalhos e link por caso (revisão 16). Uso: node scripts/console-check.mjs [nome]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = `captures/${process.argv[2] || 'console'}`;
const PORT = 5200;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const ready = (p) => p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 20000 });
const runSql = async (p, sql) => {
  await p.fill('[data-console-input]', sql);
  await p.keyboard.press('F5');
  await p.waitForFunction(() => /s$/.test(document.querySelector('[data-console-status]').textContent || ''), null, { timeout: 20000 });
  return p.evaluate(() => ({
    status: document.querySelector('[data-console-status]').textContent,
    cols: [...document.querySelectorAll('[data-console-results] thead th')].map((t) => t.textContent).filter(Boolean).join(','),
    rows: document.querySelectorAll('[data-console-results] tbody tr').length,
    first: document.querySelector('[data-console-results] tbody tr')?.textContent?.slice(0, 90),
    msg: [...document.querySelectorAll('[data-console-messages] p')].map((x) => x.textContent).join(' | ').slice(0, 220),
    queries: document.querySelector('[data-status-q]').textContent,
  }));
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=light&lang=pt`);
  await ready(p);
  await p.mouse.click(700, 500); // foco na página
  await p.keyboard.press('/');
  await p.waitForTimeout(700);
  console.log('abriu com /:', await p.evaluate(() => !document.querySelector('[data-console]').hidden), '| editor:', (await p.inputValue('[data-console-input]')).slice(0, 50));
  await p.screenshot({ path: `${out}/d-open.png` });

  const Q = [
    ['hero', "SELECT * FROM hiwan WHERE foco IN ('dados', 'automação', 'sistemas');"],
    ['barra projetos', 'SELECT projeto, area, stack, resultado FROM dbo.projetos ORDER BY impacto DESC;'],
    ['barra trajetória', "SELECT ano, STRING_AGG(evento, ' · ') AS eventos FROM dbo.trajetoria GROUP BY ano ORDER BY ano;"],
    ['TOP + NULL', 'SELECT TOP 3 projeto, ano FROM dbo.projetos ORDER BY ano;'],
    ['@@VERSION', 'SELECT @@VERSION AS versao, GETDATE() AS agora, LEN(N\'hiwan\') AS n;'],
    ['207', 'SELECT nope FROM dbo.projetos;'],
    ['208', 'SELECT * FROM dbo.clientes;'],
    ['102', 'SELEC * FROM dbo.projetos;'],
    ['3701', 'DROP TABLE dbo.projetos;'],
    ['229', "UPDATE dbo.projetos SET area = 'x';"],
    ['INSERT contato', "INSERT INTO dbo.contato (canal, endereco) VALUES ('teste', 'x');"],
  ];
  for (const [label, sql] of Q) console.log(label, JSON.stringify(await runSql(p, sql)));

  // Filtro real da lista
  const f = await runSql(p, "SELECT * FROM dbo.projetos WHERE area = 'automação';");
  const vis = await p.evaluate(() => ({
    visiveis: [...document.querySelectorAll('[data-proj-list] .prow')].filter((r) => !r.hidden).length,
    banner: document.querySelector('[data-proj-filter]').hidden ? null : document.querySelector('[data-proj-filter]').textContent.replace(/\s+/g, ' ').trim(),
  }));
  console.log('filtro', JSON.stringify(f.rows), JSON.stringify(vis));
  await p.screenshot({ path: `${out}/d-filter-console.png` });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  console.log('Esc fechou:', await p.evaluate(() => document.querySelector('[data-console]').hidden));
  await p.evaluate(() => document.querySelector('#projetos').scrollIntoView());
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/d-filter-page.png` });
  await p.click('[data-proj-filter-clear]');
  await p.waitForTimeout(400);
  console.log('limpar filtro:', await p.evaluate(() => [...document.querySelectorAll('[data-proj-list] .prow')].filter((r) => !r.hidden).length));

  // Monitor (rodapé)
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(1200);
  await p.click('[data-monitor]');
  await p.waitForFunction(() => /s$/.test(document.querySelector('[data-console-status]').textContent || ''), null, { timeout: 20000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/d-monitor.png` });
  console.log('monitor:', await p.evaluate(() => [...document.querySelectorAll('.console__grid--v tr')].map((r) => r.textContent).slice(0, 15).join(' | ')));
  const axe = await new AxeBuilder({ page: p }).include('[data-console]').include('[data-status-bar]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  console.log('axe console:', JSON.stringify(axe.violations.map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0].target.join(' ')}`)));

  // ? atalhos, Ctrl+R
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  await p.mouse.click(700, 300);
  await p.keyboard.press('Shift+Slash');
  await p.waitForTimeout(700);
  console.log('atalhos:', await p.evaluate(() => document.querySelector('[data-console-messages]').textContent.slice(0, 120)));
  await p.screenshot({ path: `${out}/d-shortcuts.png` });
  await p.focus('[data-console-input]');
  await p.keyboard.press('Control+r');
  await p.waitForTimeout(300);
  console.log('Ctrl+R recolheu:', await p.evaluate(() => document.querySelector('[data-console]').classList.contains('is-collapsed')), '| página ainda aqui:', await p.evaluate(() => !!window.__introDone));
  await ctx.close();

  // Link por caso
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const q = await c2.newPage();
  q.on('pageerror', (e) => errors.push(String(e)));
  await q.goto(`${base}?static&theme=light&lang=pt#projetos/3`);
  await ready(q);
  await q.waitForTimeout(2600);
  console.log('#projetos/3:', JSON.stringify(await q.evaluate(() => ({ tab: document.querySelector('[data-pane-tab]').textContent, qbar: document.querySelector('[data-qbar-code]').textContent, rowTop: Math.round(document.querySelector('#row-3').getBoundingClientRect().top) }))));
  await q.screenshot({ path: `${out}/d-deeplink.png` });
  const lb = await q.locator('[data-copy-link]').boundingBox();
  await q.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await q.waitForTimeout(200);
  console.log('copiar link:', await q.evaluate(() => navigator.clipboard.readText()), '|', await q.textContent('[data-copy-link]'));
  await c2.close();

  // EN + mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${base}?static&theme=dark&lang=en`);
  await ready(m);
  await m.click('[data-action="menu"]');
  await m.waitForTimeout(300);
  await m.click('#menu [data-action="console"]');
  await m.waitForTimeout(700);
  await m.click('[data-example]');
  await m.waitForFunction(() => /s$/.test(document.querySelector('[data-console-status]').textContent || ''), null, { timeout: 20000 });
  await m.waitForTimeout(300);
  await m.screenshot({ path: `${out}/m-en.png` });
  console.log('mobile EN:', await m.evaluate(() => ({ status: document.querySelector('[data-console-status]').textContent, rows: document.querySelectorAll('[data-console-results] tbody tr').length, q: document.querySelector('[data-console-input]').value })));
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
