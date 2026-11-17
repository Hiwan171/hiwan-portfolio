// Imagem de compartilhamento (LinkedIn/OG) 1200×630 a partir do hero real, tema claro, estado final.
// Uso: node scripts/og-capture.mjs  → public/og.png (o link tem uma imagem só; PT é o padrão)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 5199;
const base = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.on('data', (b) => String(b).includes('Local') && res()));
const browser = await chromium.launch();
try {
  for (const lang of ['pt']) {
    const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await p.goto(`${base}?static&theme=light&lang=${lang}`);
    await p.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
    // Composição para miniatura: sem menu, botões e cursor; a dobra é só query + headline + retrato + resultado.
    await p.addStyleTag({ content: `
      .bar__nav, .bar__tools, .actions, .caret { display: none !important; }
      .hero { min-height: calc(630px - var(--bar-h)) !important; height: calc(630px - var(--bar-h)) !important; }
    ` });
    await p.evaluate(() => window.dispatchEvent(new Event('resize')));
    await p.waitForTimeout(3200); // retrato assentado
    await p.screenshot({ path: 'public/og.png' });
    await p.close();
  }
} finally {
  await browser.close();
  server.kill();
}
