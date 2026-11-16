// Verificação de fechamento do hero: menu mobile, foco, link ativo, transição de tema, axe com menu aberto.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = 'captures/hero-final';
const PORT = 5186;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const ready = (p) => p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });

try {
  // Mobile: menu
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${base}?static&theme=light&lang=pt`);
    await ready(p);
    await p.screenshot({ path: `${out}/m-header.png`, clip: { x: 0, y: 0, width: 390, height: 120 } });
    await p.click('[data-action="menu"]');
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${out}/m-menu-open.png`, clip: { x: 0, y: 0, width: 390, height: 360 } });
    const focusOpen = await p.evaluate(() => document.activeElement.textContent.trim());
    const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    await p.keyboard.press('Escape');
    const afterEsc = await p.evaluate(() => ({
      hidden: document.querySelector('#menu').hidden,
      focus: document.activeElement.getAttribute('data-action'),
    }));
    await p.click('[data-action="menu"]');
    await p.click('#menu a[href="#projetos"]');
    await p.waitForTimeout(1800);
    const afterNav = await p.evaluate(() => ({
      hidden: document.querySelector('#menu').hidden,
      projTop: Math.round(document.querySelector('#projetos').getBoundingClientRect().top),
    }));
    await p.screenshot({ path: `${out}/m-after-nav.png` });
    console.log('mobile:', JSON.stringify({ focusOpen, afterEsc, afterNav, axeMenuOpen: axe.violations.map((v) => v.id) }));
    await ctx.close();
  }
  // Desktop: link ativo + BH + transição de tema
  {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${base}?static&theme=light&lang=pt`);
    await ready(p);
    await p.screenshot({ path: `${out}/d-result-row.png`, clip: { x: 0, y: 680, width: 1440, height: 130 } });
    await p.click('[data-action="theme"]');
    await p.waitForTimeout(280);
    await p.screenshot({ path: `${out}/d-theme-mid.png` });
    await p.waitForTimeout(700);
    await p.click('.bar__nav a[href="#projetos"]');
    await p.waitForTimeout(1900);
    const current = await p.evaluate(() => document.querySelector('.bar__nav a[aria-current="true"]')?.getAttribute('href'));
    const projTopDesktop = await p.evaluate(() => Math.round(document.querySelector('#projetos').getBoundingClientRect().top));
    console.log('desktop projTop (esperado 92):', projTopDesktop);
    await p.screenshot({ path: `${out}/d-nav-active.png`, clip: { x: 0, y: 0, width: 1440, height: 100 } });
    console.log('desktop:', JSON.stringify({ navAtivo: current, tema: await p.evaluate(() => document.documentElement.dataset.theme) }));
    await p.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros de página');
