// Captura as landing pages reais (autorizadas pelo Hiwan) para o artefato "navegador".
// Uso: node scripts/photo/sites.mjs → captures/sites/<dominio>.png (página inteira, 1280 de largura)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const sites = ['colefar.online', 'ambientecmg.online', 'colenorte.online', 'biocoletas.online'];
await mkdir('captures/sites', { recursive: true });
const browser = await chromium.launch();
try {
  for (const s of sites) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await p.goto(`https://${s}/`, { waitUntil: 'networkidle', timeout: 45000 });
      // rola até o fim para disparar lazy-load/animações de entrada, e volta
      await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        scrollTo(0, 0);
      });
      await p.waitForTimeout(1500);
      const h = await p.evaluate(() => document.documentElement.scrollHeight);
      await p.screenshot({ path: `captures/sites/${s}.png`, fullPage: true });
      await p.screenshot({ path: `captures/sites/${s}-fold.png` });
      console.log(s, 'altura', h);
    } catch (e) {
      console.log(s, 'ERRO', String(e).split('\n')[0]);
    }
    await p.close();
  }
} finally {
  await browser.close();
}
