// Query jump (revisão 18): navegação pelo menu, CTA pela ponte e reconectar. Uso: node scripts/jump-check.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = 'captures/jump';
const PORT = 5203;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.on('data', (b) => String(b).includes('Local') && r()));
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1376, height: 640 } });
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await p.goto(`http://localhost:${PORT}/?static&theme=light&lang=pt`);
await p.waitForFunction(() => window.__introDone && window.__portraitReady);
const st = () => p.evaluate(() => ({
  y: Math.round(scrollY),
  top: (id) => 0,
  qbar: document.querySelector('[data-qbar-code]').textContent.replace(/\s+/g, ' ').slice(0, 44),
  qstatus: document.querySelector('[data-qbar-status]').textContent,
  veil: !document.querySelector('[data-jump]').hidden,
  focus: document.activeElement?.id || document.activeElement?.tagName,
  dot: document.querySelector('.bar__conn .dot').classList.contains('dot--off') ? 'off' : 'on',
}));
const frames = async (label, times) => {
  let t = 0;
  for (const ms of times) { await p.waitForTimeout(ms - t); t = ms; await p.screenshot({ path: `${out}/${label}-${String(ms).padStart(4, '0')}.png` }); }
};

// 1) menu → trajetória (do hero): salto
await p.click('.bar__nav a[href="#trajetoria"]');
await frames('a-traj', [150, 380, 700, 1100, 1500, 2000]);
console.log('trajetória', JSON.stringify(await st()), 'secTop', await p.evaluate(() => Math.round(document.querySelector('#trajetoria').getBoundingClientRect().top)));
// 2) menu → contato (da trajetória: perto → rolagem suave ou salto)
await p.click('.bar__nav a[href="#contato"]');
await p.waitForTimeout(2200);
console.log('contato', JSON.stringify(await st()));
// 3) COMMIT → reconectar
await p.click('[data-commit]');
await p.waitForTimeout(3200);
console.log('commit', JSON.stringify(await st()));
await p.click('[data-reconnect]');
await frames('b-reconn', [200, 600, 1000, 1500, 2200, 3500]);
console.log('reconectar', JSON.stringify(await st()), 'p', await p.evaluate(() => document.querySelector('[data-blob] .cell__tab-meta').textContent));
// 4) Ver projetos (do hero): rola pela ponte
await p.click('.actions a[href="#projetos"]');
await frames('c-cta', [600, 1300, 2800]);
console.log('ver projetos', JSON.stringify(await st()), 'secTop', await p.evaluate(() => Math.round(document.querySelector('#projetos').getBoundingClientRect().top)));
await b.close(); server.kill();
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
