// Mede caixas de elementos. Uso: node scripts/measure.mjs <largura> <altura> <seletor...>
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const [w, h, ...sels] = process.argv.slice(2);
const PORT = 5181;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(`http://localhost:${PORT}/?static`);
  await page.waitForFunction(() => window.__introDone === true);
  const out = await page.evaluate((sels) => {
    const r = { scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight };
    for (const s of sels) {
      r[s] = [...document.querySelectorAll(s)].map((el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), pl: cs.paddingLeft, fs: cs.fontSize };
      });
    }
    return r;
  }, sels);
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
  server.kill();
}
