/**
 * Seção 3 — trajetória como GRÁFICO: "de aprendiz a sênior" desenhado pelo scroll.
 * Uma linha em degraus (nível × tempo) com área hachurada; a ponta da linha comanda tudo:
 * o ano gigante (odômetro), os rótulos dos cargos, os pontos dos eventos e a linha de resultado
 * (o STRING_AGG do ano em que a ponta está). Tudo é função do progresso: rolar para trás funciona.
 * Desktop: tela fixa. Mobile: desenha ao passar, sem fixar. Reduced-motion: gráfico completo.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { currentLang } from './i18n';
import { pathData, type Kind } from './path-data';
import { goScene, scenes, currentScene } from './qbar';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const NS = 'http://www.w3.org/2000/svg';
const Y0 = 2019;
const Y1 = 2027; // fim do eixo (a banda de 2026 termina aqui)
const END = 2026.9; // ponta da linha: hoje
const LEVELS = 4;

type Geo = {
  len: number;
  x: (yr: number) => number;
  yr: (px: number) => number;
  steps: number[]; // x (px) de cada degrau
  dots: { x: number; y: number; el: SVGCircleElement; year: number; kind: Kind; title: string; where: string }[];
};

let geo: Geo | null = null;
let progress = 0;
let shownYear = -1;
let rowYear = -1;

export function renderPath() {
  const d = pathData[currentLang()];
  const total = d.years.reduce((n, y) => n + y.items.length, 0);
  $('[data-path-table]').textContent = d.table;
  $('[data-path-count]').textContent = `${d.years.length} ${d.rows} · ${total} ${d.events}`;
  $('[data-path-title]').textContent = d.title;
  $('[data-path-sub]').textContent = d.sub;

  // Odômetro: uma coluna com os dois últimos dígitos de cada ano do eixo.
  const yrs = Array.from({ length: Y1 - Y0 }, (_, i) => Y0 + i);
  $('[data-path-roll]').innerHTML = yrs.map((y) => `<span>${String(y).slice(2)}</span>`).join('');

  // Leitor de tela: os dados completos (a tela mostra o gráfico).
  $('[data-path-list]').innerHTML = d.years
    .map((y) => `<li><h3>${y.year}</h3><ul>${y.items
      .map((it) => `<li>${d.kinds[it.kind]}: ${esc(it.title)} (${esc(it.where)})</li>`)
      .join('')}</ul></li>`)
    .join('');

  shownYear = rowYear = -1;
  layout();
}

/** Monta SVG e rótulos para o tamanho atual do palco. */
function layout() {
  const plot = document.querySelector<HTMLElement>('[data-path-plot]');
  if (!plot) return;
  const d = pathData[currentLang()];
  const W = plot.clientWidth;
  const H = plot.clientHeight;
  if (!W || !H) return;
  const narrow = W < 700;

  const padL = narrow ? 16 : Math.max(24, W * 0.02);
  const padR = padL;
  const top = H * (narrow ? 0.12 : 0.2);
  const base = H - (narrow ? 44 : 52); // linha do eixo
  const x = (yr: number) => padL + ((yr - Y0) / (Y1 - Y0)) * (W - padL - padR);
  const yr = (px: number) => Y0 + ((px - padL) / (W - padL - padR)) * (Y1 - Y0);
  const lift = narrow ? 26 : 40; // nível 0 fica um pouco acima do eixo
  const y = (lv: number) => base - lift - (lv / LEVELS) * (base - lift - top);

  // Caminho em degraus.
  const st = d.steps;
  let dPath = `M${x(st[0].x)},${y(st[0].level)}`;
  for (let i = 1; i < st.length; i++) dPath += ` H${x(st[i].x)} V${y(st[i].level)}`;
  dPath += ` H${x(END)}`;
  const area = `${dPath} V${base} H${x(st[0].x)} Z`;
  const levelAt = (yrv: number) => {
    let lv = st[0].level;
    for (const s of st) if (yrv >= s.x) lv = s.level;
    return lv;
  };

  const grid = Array.from({ length: LEVELS + 1 }, (_, lv) => `<line class="climb__grid" x1="${padL}" x2="${W - padR}" y1="${y(lv)}" y2="${y(lv)}"/>`).join('');
  const ticks = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => `<line class="climb__tick" x1="${x(Y0 + i)}" x2="${x(Y0 + i)}" y1="${base}" y2="${base + 6}"/>`).join('');

  const svg = $<SVGSVGElement>('[data-path-svg]');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <pattern id="climb-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" class="climb__hatch"/>
      </pattern>
      <clipPath id="climb-clip"><rect data-clip x="0" y="0" width="0" height="${H}"/></clipPath>
    </defs>
    ${grid}
    <line class="climb__base" x1="${padL}" x2="${W - padR}" y1="${base}" y2="${base}"/>
    ${ticks}
    <g clip-path="url(#climb-clip)"><path class="climb__area" d="${area}"/></g>
    <path class="climb__line" data-line d="${dPath}"/>
    <g data-dots></g>
    <circle class="climb__halo" data-halo r="16"/>
    <circle class="climb__head" data-head r="7"/>`;

  // Eventos que não são cargo viram pontos sobre a linha, espalhados dentro do ano.
  const dotsG = svg.querySelector('[data-dots]')!;
  const dots: Geo['dots'] = [];
  for (const yv of d.years) {
    const items = yv.items.filter((it) => it.kind !== 'role');
    items.forEach((it, k) => {
      const yx = yv.year + (k + 1) / (items.length + 1);
      if (yx > END) return;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', `climb__dot is-${it.kind}`);
      c.setAttribute('cx', String(x(yx)));
      c.setAttribute('cy', String(y(levelAt(yx))));
      c.setAttribute('r', narrow ? '3' : '4.5');
      dotsG.appendChild(c);
      dots.push({ x: x(yx), y: y(levelAt(yx)), el: c, year: yv.year, kind: it.kind, title: it.title, where: it.where });
    });
  }

  // Rótulos (HTML, para tipografia nítida): cargos sobre cada degrau, "hoje" na ponta, eixo de anos.
  // Desktop: acima do trecho, com largura limitada ao trecho (quebra em 2 linhas se preciso) para nunca
  // cruzar o degrau seguinte. Estreito: abaixo da linha (embaixo de um degrau só há área, nunca outra linha).
  const labels = st
    .map((s, i) => {
      const x0 = x(s.x);
      const runEnd = i < st.length - 1 ? x(st[i + 1].x) : x(END);
      const last = i === st.length - 1;
      const room = runEnd - x0 - 18;
      let pos: string;
      if (narrow) pos = `left:${x0 + 6}px;top:${y(s.level) + 8}px;max-width:${W - x0 - 12}px;`;
      else if (last) pos = `right:${W - runEnd}px;top:${y(s.level)}px;text-align:right;`;
      else pos = `left:${x0}px;top:${y(s.level)}px;max-width:${Math.max(room, 120)}px;`;
      return `<div class="climb__label${last ? ' climb__label--top' : ''}${narrow ? ' is-below' : ''}" data-step="${i}" style="${pos}">
        <strong>${esc(s.label)}</strong><span>${esc(s.meta)}</span></div>`;
    })
    .join('');
  const lastRun = x(END) - x(st[st.length - 1].x);
  const now = `<div class="climb__now" data-now style="right:${W - x(END)}px;top:${y(st[st.length - 1].level)}px;max-width:${Math.max(lastRun - 12, 90)}px">
      <b>${esc(d.now.label)}</b><span>${esc(d.now.meta)}</span></div>`;
  const axis = Array.from({ length: Y1 - Y0 }, (_, i) => {
    const yv = Y0 + i;
    const has = d.years.some((r) => r.year === yv);
    return `<span class="climb__yr${has ? '' : ' is-empty'}" data-yr="${yv}" style="left:${x(yv)}px;top:${base + 12}px">${yv}</span>`;
  }).join('');
  $('[data-path-labels]').innerHTML = labels + now + axis + '<div class="climb__tip" data-tip></div>';

  const line = svg.querySelector<SVGPathElement>('[data-line]')!;
  const len = line.getTotalLength();
  line.style.strokeDasharray = `${len}`;
  geo = { len, x, yr, steps: st.map((s) => x(s.x)), dots };
  draw(progress, true);
}

/** Desenha o gráfico no progresso p (0..1). */
function draw(p: number, force = false) {
  progress = p;
  if (!geo) return;
  const svg = $<SVGSVGElement>('[data-path-svg]');
  const line = svg.querySelector<SVGPathElement>('[data-line]')!;
  const pt = line.getPointAtLength(geo.len * p);
  line.style.strokeDashoffset = `${geo.len * (1 - p)}`;
  svg.querySelector('[data-clip]')!.setAttribute('width', String(pt.x));
  for (const sel of ['[data-head]', '[data-halo]']) {
    const c = svg.querySelector(sel)!;
    c.setAttribute('cx', String(pt.x));
    c.setAttribute('cy', String(pt.y));
  }
  svg.classList.toggle('is-done', p > 0.995);
  for (const dt of geo.dots) dt.el.classList.toggle('is-on', pt.x >= dt.x - 0.5);

  const labels = document.querySelectorAll<HTMLElement>('[data-step]');
  labels.forEach((el, i) => el.classList.toggle('is-on', pt.x >= geo!.steps[i] - 0.5 && (i === 0 ? p > 0.002 : true)));
  document.querySelector('[data-now]')?.classList.toggle('is-on', p > 0.995);

  const year = Math.min(Math.floor(geo.yr(pt.x) + 1e-6), Y1 - 1);
  document.querySelectorAll<HTMLElement>('[data-yr]').forEach((el) => el.classList.toggle('is-active', Number(el.dataset.yr) === year));
  setYear(year, force);
  setRow(year, force);
}

/** Odômetro do ano gigante. */
function setYear(year: number, force: boolean) {
  if (year === shownYear && !force) return;
  const instant = shownYear < 0 || force;
  shownYear = year;
  const roll = $<HTMLElement>('[data-path-roll]');
  const h = (roll.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
  gsap.to(roll, { y: -(year - Y0) * h, duration: instant ? 0 : 0.7, ease: 'expo.out', overwrite: true });
}

/** Linha de resultado: o STRING_AGG do último ano com linhas (GROUP BY não retorna 2021). */
function setRow(year: number, force: boolean) {
  const d = pathData[currentLang()];
  const row = [...d.years].reverse().find((r) => r.year <= year) ?? d.years[0];
  if (row.year === rowYear && !force) return;
  rowYear = row.year;
  const agg = row.items.map((it) => esc(it.title)).join(' · ');
  const el = $<HTMLElement>('[data-path-row]');
  el.innerHTML = `<span class="climb__cell climb__cell--k">${d.year}</span><span class="climb__cell climb__cell--y">${row.year}</span>
    <span class="climb__cell climb__cell--k">${d.events}</span><span class="climb__cell climb__cell--v">'${agg}'</span>
    <span class="climb__cell climb__cell--n">${row.items.length} ${row.items.length === 1 ? d.event : d.events}</span>`;
  gsap.fromTo(el.querySelectorAll('.climb__cell--y, .climb__cell--v'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: force ? 0 : 0.5, ease: 'expo.out', stagger: 0.04 });
}

/** Hover nos pontos de evento: dica com o evento (o gráfico é aria-hidden; a lista sr-only tem tudo). */
function initTips() {
  const plot = $<HTMLElement>('[data-path-plot]');
  let hot: Geo['dots'][number] | null = null;
  const hide = () => {
    hot?.el.classList.remove('is-hover');
    hot = null;
    document.querySelector('[data-tip]')?.classList.remove('is-on');
  };
  plot.addEventListener('pointermove', (e) => {
    if (!geo) return;
    const r = plot.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best: Geo['dots'][number] | null = null;
    let bd = 22; // raio de captura (px)
    for (const dt of geo.dots) {
      if (!dt.el.classList.contains('is-on')) continue;
      const dd = Math.hypot(dt.x - px, dt.y - py);
      if (dd < bd) { bd = dd; best = dt; }
    }
    if (best === hot) return;
    hide();
    if (!best) return;
    hot = best;
    best.el.classList.add('is-hover');
    const d = pathData[currentLang()];
    const tip = $<HTMLElement>('[data-tip]');
    tip.innerHTML = `<b>${best.year} · ${esc(d.kinds[best.kind])}</b><strong>${esc(best.title)}</strong><span>${esc(best.where)}</span>`;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(best.x - w / 2, 8), r.width - w - 8)}px`;
    // Perto do topo do gráfico a dica abre para baixo (no vídeo, ela saía cortada por cima).
    const below = best.y - tip.offsetHeight - 24 < 0;
    tip.classList.toggle('is-below', below);
    tip.style.top = `${best.y}px`;
    tip.classList.add('is-on');
  });
  plot.addEventListener('pointerleave', hide);
}

export function initPath() {
  renderPath();
  initTips();

  // A barra de query reescreve para a consulta da trajetória (em qualquer tamanho de tela).
  ScrollTrigger.create({
    trigger: '#trajetoria',
    start: 'top 35%',
    onEnter: () => goScene(scenes.path),
    onLeaveBack: () => currentScene().id === 'path' && goScene(scenes.projects),
  });

  let w = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === w && document.documentElement.classList.contains('has-hpath')) return; // barra do navegador móvel
    w = innerWidth;
    layout();
  });

  const mm = gsap.matchMedia();
  mm.add(
    {
      pin: '(min-width: 761px) and (prefers-reduced-motion: no-preference)',
      flow: '(max-width: 760px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { pin, reduce } = ctx.conditions as Record<string, boolean>;
      const root = document.documentElement;
      if (reduce) {
        layout();
        draw(1, true);
        return;
      }
      if (pin) root.classList.add('has-hpath');
      layout();
      draw(0, true);
      const proxy = { p: 0 };
      // fromTo: com invalidateOnRefresh um .to() regravaria o início no meio da rolagem (refresh no mobile
      // acontece quando um artefato cresce) e o gráfico não voltaria a zero.
      const tween = gsap.fromTo(proxy, { p: 0 }, {
        p: 1,
        ease: 'none',
        onUpdate: () => draw(proxy.p),
        scrollTrigger: pin
          ? {
              trigger: '[data-climb]',
              start: 'top top+=92', // abaixo da barra de conexão (52) + barra de query (40)
              end: () => `+=${innerHeight * 2.4}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onRefresh: () => layout(),
            }
          : {
              trigger: '[data-path-stage]',
              start: 'top 75%',
              // 'bottom 55%' era inalcançável no fim da página: o gráfico parava em 2023 (auditoria 12, B2).
              end: () => {
                const stage = document.querySelector<HTMLElement>('[data-path-stage]')!;
                const top = stage.getBoundingClientRect().top + scrollY;
                const maxScroll = ScrollTrigger.maxScroll(window);
                return Math.min(top + stage.offsetHeight - innerHeight * 0.55, maxScroll - 4);
              },
              invalidateOnRefresh: true,
              scrub: 0.6,
            },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        root.classList.remove('has-hpath');
      };
    },
  );
}
