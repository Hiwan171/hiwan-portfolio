// Estudo de portfólios premiados (CSSDA WOTD): capturas + sinais técnicos. Uso: node scripts/refs-awards.mjs
// Só lê e fotografa páginas públicas; não executa nada delas fora do navegador.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const SITES = [
  ['long-hoang', 'https://longhoang-lyo.com/', 8.96],
  ['arthur-engel', 'https://aengel.io', 8.48],
  ['artemii-lebedev', 'https://artemiilebedev.com', 8.27],
  ['carter-ogunsola', 'https://carterogunsola.com', 8.2],
  ['matteo-courquin', 'https://matteocourquin.com/', 8.2],
  ['maria-vasilyeva', 'https://www.mariavasilyeva.com/', 8.16],
  ['khanh-nguyen', 'https://khanhnguyen.design/', 8.15],
  ['juan-mora-romero', 'https://www.juanmoraromero.com/', 8.04],
  ['cristiana-araujo', 'https://www.cristianaaraujo.com/', 8.01],
  ['wassim-nasr', 'https://wassimnasr.com', 7.58],
];
const out = 'captures/refs-awards';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const [id, url, score] of SITES) {
  const row = { id, url, score };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' });
  const p = await ctx.newPage();
  const t0 = Date.now();
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 45000 });
    row.loadMs = Date.now() - t0;
    await p.waitForTimeout(5000); // preloaders / intros
    await p.screenshot({ path: `${out}/${id}-0.png` });
    await p.mouse.move(720, 450);
    for (let k = 1; k <= 4; k++) {
      for (let s = 0; s < 900; s += 150) { await p.mouse.wheel(0, 150); await p.waitForTimeout(40); }
      await p.waitForTimeout(1600);
      await p.screenshot({ path: `${out}/${id}-${k}.png` });
    }
    Object.assign(row, await p.evaluate(() => {
      const src = [...document.scripts].map((s) => s.src + ' ' + (s.textContent || '').slice(0, 4000)).join(' ').toLowerCase();
      const has = (re) => re.test(src);
      const res = performance.getEntriesByType('resource');
      return {
        title: document.title,
        heightPx: document.documentElement.scrollHeight,
        scrollY: Math.round(scrollY),
        canvases: document.querySelectorAll('canvas').length,
        videos: document.querySelectorAll('video').length,
        cursorNone: getComputedStyle(document.body).cursor === 'none' || getComputedStyle(document.documentElement).cursor === 'none',
        navLinks: document.querySelectorAll('nav a, header a').length,
        libs: { three: has(/three/), gsap: has(/gsap|scrolltrigger/), lenis: has(/lenis/), barba: has(/barba/), framer: has(/framer/), next: !!document.querySelector('#__next, script[src*="_next"]'), webflow: !!document.querySelector('html[data-wf-site]'), nuxt: !!document.querySelector('#__nuxt') },
        fonts: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))].slice(0, 6),
        transferKB: Math.round(res.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024),
        requests: res.length,
      };
    }));
  } catch (e) {
    row.error = String(e).split('\n')[0];
  }
  await ctx.close();
  // mobile
  try {
    const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await m.goto(url, { waitUntil: 'load', timeout: 45000 });
    await m.waitForTimeout(5000);
    await m.screenshot({ path: `${out}/${id}-m.png` });
    await m.close();
  } catch (e) {
    row.mobileError = String(e).split('\n')[0];
  }
  report.push(row);
  console.log(JSON.stringify(row));
}
await browser.close();
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
