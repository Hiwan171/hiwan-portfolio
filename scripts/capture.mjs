// Capturas para revisão: estados finais (temas × idiomas × larguras) e quadros da intro.
// Uso: npm run capture -- [nome]    → saída em captures/<nome>/
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const name = process.argv[2] || 'hero';
const out = `captures/${name}`;
const PORT = 5179;
const base = `http://localhost:${PORT}/`;

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve, reject) => {
  server.stdout.on('data', (b) => String(b).includes('Local') && resolve());
  server.on('exit', (c) => reject(new Error(`vite saiu com código ${c}`)));
  setTimeout(() => reject(new Error('vite não subiu em 20 s')), 20000);
});

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

const sizes = [
  ['1440', 1440, 900],
  ['1920', 1920, 1080],
  ['1366', 1366, 768], // notebook comum: tela baixa
  ['390', 390, 844],
];

try {
  for (const theme of ['dark', 'light']) {
    for (const lang of ['pt', 'en']) {
      for (const [label, width, height] of sizes) {
        if (lang === 'en' && label !== '1440') continue; // EN só no desktop principal
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: label === '390' ? 2 : 1 });
        await page.goto(`${base}?theme=${theme}&lang=${lang}&static`);
        await page.waitForFunction(() => window.__introDone === true && window.__portraitReady === true, null, { timeout: 15000 });
        await page.waitForTimeout(250);
        await page.screenshot({ path: `${out}/${theme}-${lang}-${label}.png`, fullPage: label === '390' });
        await page.close();
      }
    }
  }

  // Quadros da intro (estudo de movimento), 1440 escuro
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const t of [0.3, 0.7, 1.1, 1.5, 2.0, 2.6]) {
    await page.goto(`${base}?theme=light&lang=pt&at=${t}`);
    await page.waitForFunction(() => window.__portraitReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/frame-${String(t).replace('.', '_')}s.png` });
  }
  await page.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(`ok → ${out}`);
