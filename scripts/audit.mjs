// Auditoria técnica sobre o build de produção (dist/): FOUC, LCP/CLS, rede lenta, axe, teclado, nome acessível.
// Uso: npx vite build && node scripts/audit.mjs
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = 'captures/audit';
const PORT = 5190;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = {};

const vitals = () =>
  new Promise((resolve) => {
    let lcp = 0, lcpEl = '', cls = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { lcp = e.startTime; lcpEl = e.element ? e.element.className || e.element.tagName : ''; })).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve({ lcp: Math.round(lcp), lcpEl, cls: +cls.toFixed(4) }), 300);
  });

try {
  // 1) Primeira pintura em produção: o loader deve cobrir tudo desde o 1º quadro (sem flash do hero).
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?boot`, { waitUntil: 'commit' });
    await page.waitForTimeout(60);
    await page.screenshot({ path: `${out}/first-paint-60ms.png` });
    await page.waitForFunction(() => window.__introDone === true, null, { timeout: 20000 });
    report.vitalsComBoot = await page.evaluate(vitals);
    await page.close();
  }
  // 2) Visita repetida (sem loader)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}?boot`);
    await page.waitForFunction(() => window.__introDone === true, null, { timeout: 20000 });
    await page.goto(base);
    await page.waitForFunction(() => window.__introDone === true, null, { timeout: 20000 });
    report.vitalsRepetida = await page.evaluate(vitals);
    await ctx.close();
  }
  // 3) Rede lenta (≈ 4G ruim): o loader segura em 92% até os assets chegarem?
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (200 * 1024) / 8 });
    const t0 = Date.now();
    await page.goto(`${base}?boot`, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.__introDone !== undefined || (document.body && !('boot' in document.documentElement.dataset)), null, { timeout: 30000, polling: 50 });
    report.redeLenta = { loaderSaiMs: Date.now() - t0 };
    await page.waitForFunction(() => window.__introDone === true, null, { timeout: 30000 });
    report.redeLenta.heroCompletoMs = Date.now() - t0;
    await page.close();
  }
  // 4) axe (WCAG 2.1 AA) no hero final, claro e escuro, e na tela de conexão
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); // axe exige contexto próprio
    const page = await ctx.newPage();
    await page.goto(`${base}?static&theme=${theme}`);
    await page.waitForFunction(() => window.__introDone === true);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    report[`axe_${theme}`] = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nó(s) — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    await ctx.close();
  }
  // 5) Nome acessível do h1 (o ::after da seleção duplica texto?) e árvore de acessibilidade do hero
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?static`);
    await page.waitForFunction(() => window.__introDone === true);
    report.ariaHero = await page.locator('main').ariaSnapshot();
    // 6) Teclado: ordem de foco e foco visível
    const order = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => {
        const a = document.activeElement;
        return `${a.tagName.toLowerCase()}${a.getAttribute('href') ? `[${a.getAttribute('href')}]` : ''} "${(a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;
      }));
      if (i === 5) await page.screenshot({ path: `${out}/focus-visible.png` });
    }
    report.ordemTab = order;
    // âncoras sem destino
    report.ancorasQuebradas = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => !document.querySelector(h)));
    // metadados
    report.meta = await page.evaluate(() => ({
      favicon: !!document.querySelector('link[rel~="icon"]'),
      ogImage: !!document.querySelector('meta[property="og:image"]'),
      ogTitle: !!document.querySelector('meta[property="og:title"]'),
      canonical: !!document.querySelector('link[rel="canonical"]'),
      themeColor: !!document.querySelector('meta[name="theme-color"]'),
    }));
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(JSON.stringify(report, null, 2));
