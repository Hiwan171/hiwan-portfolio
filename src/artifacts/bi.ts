/**
 * Artefato 4: dashboard "Motivos de Não Coleta" (Power BI recriado).
 * Real: o painel existe e está em uso. Números: fictícios (coerentes entre si: 31+22+18+14+8+4 = 97).
 * Formas (diretrizes de dataviz): KPIs como blocos de destaque; motivos = barras horizontais de série
 * única (sem legenda; o título nomeia); tendência = linha 2px. Tooltip por barra/ponto. Tabela p/ leitores.
 */
import { gsap } from 'gsap';
import { currentLang } from '../i18n';
import type { Mounted } from '../projects';
import { winHtml, reducedMotion, fmt } from './win';

const PLANNED = 1284;
const MISSED = 97;
const WEEKS = [9.8, 9.1, 8.7, 8.9, 8.0, 7.7, 7.3, 6.9];

const L = {
  pt: {
    title: 'Motivos de Não Coleta.pbix',
    meta: 'Power BI',
    filters: ['Mês: Novembro', 'Unidade: Todas', 'Resíduo: Classe I'],
    kpis: ['coletas programadas', 'não realizadas', 'taxa de não coleta'],
    bars: 'Não coletas por motivo',
    line: 'Taxa de não coleta por semana (%)',
    reasons: ['Cliente ausente', 'Acesso bloqueado', 'Não segregado', 'Reagendado', 'Sem veículo', 'Outros'],
    week: 'S',
    note: 'dados fictícios · painel real em uso',
    sr: 'Simulação de dashboard: 1.284 coletas programadas, 97 não realizadas (7,6%). Principal motivo: cliente ausente (31). Taxa semanal caindo de 9,8% para 6,9%.',
  },
  en: {
    title: 'Missed Pickup Reasons.pbix',
    meta: 'Power BI',
    filters: ['Month: November', 'Site: All', 'Waste: Class I'],
    kpis: ['scheduled pickups', 'missed', 'missed rate'],
    bars: 'Missed pickups by reason',
    line: 'Missed rate by week (%)',
    reasons: ['Customer absent', 'Access blocked', 'Not sorted', 'Rescheduled', 'No vehicle', 'Other'],
    week: 'W',
    note: 'fictional data · real dashboard in use',
    sr: 'Dashboard simulation: 1,284 scheduled pickups, 97 missed (7.6%). Top reason: customer absent (31). Weekly rate falling from 9.8% to 6.9%.',
  },
};
const COUNTS = [31, 22, 18, 14, 8, 4];

export function mountBi(host: HTMLElement): Mounted {
  const s = L[currentLang()];
  const max = Math.max(...COUNTS);
  const W = 300, H = 150, PAD = { l: 8, r: 34, t: 14, b: 22 };
  const lo = 6, hi = 10.5;
  const pts = WEEKS.map((v, i) => [
    PAD.l + (i * (W - PAD.l - PAD.r)) / (WEEKS.length - 1),
    PAD.t + ((hi - v) / (hi - lo)) * (H - PAD.t - PAD.b),
  ]);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  host.innerHTML = winHtml({
    cls: 'win--bi',
    title: s.title,
    meta: s.meta,
    note: s.note,
    sr: s.sr,
    body: `
      <div class="bi">
        <div class="bi__filters" aria-hidden="true">${s.filters.map((f) => `<span>${f} ▾</span>`).join('')}</div>
        <div class="bi__kpis" aria-hidden="true">
          <div><b data-k="k0">0</b><span>${s.kpis[0]}</span></div>
          <div><b data-k="k1">0</b><span>${s.kpis[1]}</span></div>
          <div><b data-k="k2">0</b><span>${s.kpis[2]}</span></div>
        </div>
        <div class="bi__charts" aria-hidden="true">
          <figure class="bi__card">
            <figcaption>${s.bars}</figcaption>
            <ul class="bi__bars">${COUNTS.map((c, i) => `
              <li data-tip="${s.reasons[i]} · ${c} (${fmt((c / MISSED) * 100)}%)">
                <span class="bi__label">${s.reasons[i]}</span>
                <span class="bi__track"><span class="bi__fill" style="--w:${(c / max) * 100}%"></span></span>
                <span class="bi__val">${c}</span>
              </li>`).join('')}
            </ul>
          </figure>
          <figure class="bi__card">
            <figcaption>${s.line}</figcaption>
            <svg class="bi__line" viewBox="0 0 ${W} ${H}">
              ${[7, 8, 9, 10].map((g) => {
                const y = PAD.t + ((hi - g) / (hi - lo)) * (H - PAD.t - PAD.b);
                return `<line class="bi__grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y}" y2="${y}"/><text class="bi__ax" x="${W - PAD.r + 6}" y="${y + 3}">${g}</text>`;
              }).join('')}
              <path class="bi__path" d="${path}" pathLength="1"/>
              ${pts.map(([x, y], i) => `<circle class="bi__hit" cx="${x}" cy="${y}" r="10" data-tip="${s.week}${i + 1} · ${fmt(WEEKS[i], 1)}%"/>`).join('')}
              <circle class="bi__dot" cx="${last[0]}" cy="${last[1]}" r="4"/>
              ${pts.map(([x], i) => `<text class="bi__ax" x="${x}" y="${H - 6}" text-anchor="middle">${s.week}${i + 1}</text>`).join('')}
            </svg>
          </figure>
        </div>
        <div class="bi__tip" data-k="tip" hidden></div>
        <table class="sr-only"><caption>${s.bars}</caption><tbody>${COUNTS.map((c, i) => `<tr><th scope="row">${s.reasons[i]}</th><td>${c}</td></tr>`).join('')}</tbody></table>
      </div>`,
  });

  const $ = (k: string) => host.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
  const bi = host.querySelector<HTMLElement>('.bi')!;
  const tip = $('tip');

  // Tooltip por marca (alvo maior que a marca: a linha inteira da barra; raio 10 nos pontos)
  bi.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest('[data-tip]') as HTMLElement | null;
    if (!el) return (tip.hidden = true);
    const r = el.getBoundingClientRect(), b = bi.getBoundingClientRect();
    tip.textContent = el.dataset.tip!;
    tip.hidden = false;
    tip.style.left = `${r.left - b.left + r.width / 2}px`;
    tip.style.top = `${r.top - b.top}px`;
  });
  bi.addEventListener('pointerleave', () => (tip.hidden = true));

  const fills = host.querySelectorAll<HTMLElement>('.bi__fill');
  const line = host.querySelector<SVGPathElement>('.bi__path')!;
  const dot = host.querySelector<SVGCircleElement>('.bi__dot')!;
  let tl: gsap.core.Timeline | null = null;

  const setK = (a: number, b: number, c: number) => {
    $('k0').textContent = fmt(a);
    $('k1').textContent = fmt(b);
    $('k2').textContent = `${fmt(c, 1)}%`;
  };

  const run = () => {
    tl?.kill();
    if (reducedMotion()) {
      setK(PLANNED, MISSED, (MISSED / PLANNED) * 100);
      gsap.set(fills, { scaleX: 1 });
      gsap.set(line, { strokeDashoffset: 0 });
      gsap.set(dot, { opacity: 1 });
      return;
    }
    const k = { a: 0, b: 0, c: 0 };
    gsap.set(fills, { scaleX: 0 });
    gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(dot, { opacity: 0 });
    tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(k, { a: PLANNED, b: MISSED, c: (MISSED / PLANNED) * 100, duration: 1.6, ease: 'power3.out', onUpdate: () => setK(Math.round(k.a), Math.round(k.b), k.c) })
      .to(fills, { scaleX: 1, duration: 1.1, stagger: 0.08 }, 0.3)
      .to(line, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.5)
      .to(dot, { opacity: 1, duration: 0.3 }, '-=0.1');
  };

  // R2: "quadro zero" coerente enquanto a varredura revela a janela (antes: KPIs 0 com barras cheias).
  if (!reducedMotion()) {
    setK(0, 0, 0);
    gsap.set(fills, { scaleX: 0 });
    gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(dot, { opacity: 0 });
  }

  host.querySelector('[data-replay]')!.addEventListener('click', run);
  return { play: run, destroy() { tl?.kill(); host.innerHTML = ''; } };
}
