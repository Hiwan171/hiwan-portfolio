// Verificação das correções R1–R4 (revisão 13). Uso: node scripts/fix-check.mjs
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = 'captures/fix-check';
const PORT = 5196;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const ready = (p) => p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 20000 });
const row = (n) => `#row-${n}`;
// captura sem rolar a página (locator.screenshot rola até o elemento e troca a linha ativa do painel sticky)
// clique realista: rola com a roda até a linha estar visível e clica no ponto (sem o salto nativo do p.click)
const realClick = async (p, sel) => { for (let k = 0; k < 30; k++) { const b = await p.locator(sel).boundingBox(); if (b && b.y > 120 && b.y + b.height < 880) { await p.mouse.click(b.x + 40, b.y + b.height / 2); return; } await p.mouse.wheel(0, b && b.y < 120 ? -150 : 150); await p.waitForTimeout(120); } throw new Error('linha não ficou visível: ' + sel); };
const shot = async (p, sel, path) => { const b = await p.locator(sel).boundingBox(); await p.screenshot({ path, clip: b }); };

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${base}?static&theme=light&lang=pt`);
  await ready(p);

  // R4: cantos somem na grade da ponte e voltam ao topo
  const corner = () => p.evaluate(() => getComputedStyle(document.querySelector('[data-blob] .blob__corner')).opacity);
  await p.mouse.move(400, 450);
  for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); }
  await p.waitForTimeout(1200);
  const cornerGrid = await corner();
  for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, -100); await p.waitForTimeout(16); }
  await p.waitForTimeout(1500);
  console.log('R4 cantos — na grade:', cornerGrid, '| de volta ao topo:', await corner());

  await p.evaluate(() => document.querySelector('#projetos').scrollIntoView());
  await p.waitForTimeout(1500);

  // R1: fila — "concluída" escondida no início, visível no fim
  await realClick(p, row(2));
  await p.waitForTimeout(1400);
  const doneEarly = await p.evaluate(() => getComputedStyle(document.querySelector('.q__done')).display);
  await p.waitForTimeout(6500);
  const doneLate = await p.evaluate(() => getComputedStyle(document.querySelector('.q__done')).display);
  console.log('R1 fila — "concluída" no início:', doneEarly, '| no fim:', doneLate);

  // R2: quadro zero da view (durante a revelação) e do BI
  await realClick(p, row(3));
  await p.waitForTimeout(420);
  await shot(p, '[data-pane-fit]', `${out}/r2-view-zero.png`);
  const viewZero = await p.evaluate(() => ({
    caret: !!document.querySelector('.v__code .caret'),
    exportOpacity: getComputedStyle(document.querySelector('.v__export')).opacity,
  }));
  await p.waitForTimeout(7500);
  const viewEnd = await p.evaluate(() => getComputedStyle(document.querySelector('.v__export')).opacity);
  console.log('R2 view — quadro zero:', JSON.stringify(viewZero), '| export no fim:', viewEnd);

  await realClick(p, row(4));
  await p.waitForTimeout(420);
  await shot(p, '[data-pane-fit]', `${out}/r2-bi-zero.png`);
  const biZero = await p.evaluate(() => ({
    k0: document.querySelector('[data-k="k0"]').textContent,
    fill: getComputedStyle(document.querySelector('.bi__fill')).transform,
  }));
  console.log('R2 BI — quadro zero:', JSON.stringify(biZero));

  // R3: navegador — roda sobre a janela rola a PÁGINA; depois do clique rola o SITE
  await realClick(p, row(5));
  await p.waitForTimeout(1600);
  await shot(p, '[data-pane-fit]', `${out}/r3-browser-idle.png`);
  console.log('estado antes do R3:', JSON.stringify(await p.evaluate(() => ({ y: Math.round(scrollY), tab: document.querySelector('[data-pane-tab]')?.textContent, pressed: [...document.querySelectorAll('.prow__btn')].map((x) => x.getAttribute('aria-pressed')).join(','), win: document.querySelector('[data-pane-fit] .win')?.className }))));
  const box = await p.locator('.br__frame').boundingBox({ timeout: 5000 });
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const y0 = await p.evaluate(() => scrollY);
  for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(30); }
  await p.waitForTimeout(700);
  const y1 = await p.evaluate(() => scrollY);
  console.log('R3 solta — página rolou:', y1 - y0, 'px');
  // volta a linha 5 ao centro e engata
  await realClick(p, row(5));
  await p.waitForTimeout(1400);
  const b2 = await p.locator('.br__frame').boundingBox();
  await p.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
  const s0 = await p.evaluate(() => [scrollY, document.querySelector('.br__view').scrollTop]);
  for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(30); }
  await p.waitForTimeout(700);
  const s1 = await p.evaluate(() => [scrollY, document.querySelector('.br__view').scrollTop]);
  console.log('R3 engatada — página:', s1[0] - s0[0], 'px | site na janela:', s1[1] - s0[1], 'px');
  await shot(p, '[data-pane-fit]', `${out}/r3-browser-engaged.png`);
  await p.mouse.move(20, 450); // tira o mouse: solta
  await p.waitForTimeout(300);
  console.log('R3 mouse fora — engatada?', await p.evaluate(() => document.querySelector('.br__frame').classList.contains('is-engaged')));
  const axe = await new AxeBuilder({ page: p }).include('#projetos').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  console.log('axe projetos:', JSON.stringify(axe.violations.map((v) => `${v.id}:${v.nodes.length}`)));
  await ctx.close();

  // Mobile: a varredura com o "dedo" (roda) sobre os artefatos chega ao fim da página
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${base}?static&theme=light&lang=pt`);
  await ready(m);
  await m.mouse.move(117, 422);
  let last = -1, stuck = 0;
  for (let k = 0; k < 120 && stuck < 6; k++) {
    await m.mouse.wheel(0, 200);
    await m.waitForTimeout(60);
    const y = await m.evaluate(() => Math.round(scrollY));
    stuck = y === last ? stuck + 1 : 0;
    last = y;
  }
  const end = await m.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }));
  console.log('Mobile — parou em', end.y, 'de', end.max, end.max - end.y < 4 ? '(chegou ao fim)' : '(TRAVOU)');
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
