// Captura avulsa de uma página do dev server. Uso: node scripts/shot.mjs <caminho> <saida.png> [largura] [altura] [full]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [path = '/', out = 'captures/shot.png', w = '1440', h = '900', full] = process.argv.slice(2);
const PORT = 5180;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((res, rej) => {
  server.stdout.on('data', (b) => String(b).includes('Local') && res());
  setTimeout(() => rej(new Error('vite não subiu')), 20000);
});
await mkdir(dirname(out), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(`http://localhost:${PORT}${path}`);
  await page.waitForFunction(() => window.__introDone === true, null, { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: full === 'full' });
} finally {
  await browser.close();
  server.kill();
}
console.log(`ok → ${out}`);
