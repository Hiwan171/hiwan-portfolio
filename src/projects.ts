/**
 * Seção 2: o result set de projetos como o SSMS — lista de linhas à esquerda, painel de resultado à direita.
 *
 * Desktop (≥1101px): a lista rola normalmente; o painel fica preso ao lado (sticky, não é tela fixa).
 *   A linha que cruza o meio da tela fica ativa: a barra de query vira `... WHERE id = n;`, o painel troca
 *   de artefato com uma linha de varredura (o mesmo gesto da tela de conexão) e o artefato roda ao vivo.
 * Estreito: cada linha traz o próprio artefato (montado ao entrar na tela) e o caso num <details>.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { dict, currentLang, type Artifact } from './i18n';
import { goScene, scenes, currentScene } from './qbar';
import { mountTerminal } from './artifacts/terminal';
import { mountQueue } from './artifacts/queue';
import { mountView } from './artifacts/view';
import { mountBi } from './artifacts/bi';
import { mountBrowser } from './artifacts/browser';

export type Mounted = { play: () => void; destroy: () => void };
type Mount = (host: HTMLElement) => Mounted;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const pad2 = (n: number) => String(n).padStart(2, '0');
const WIDE = '(min-width: 1101px)';

const ARTIFACTS: Record<Artifact, Mount> = {
  terminal: mountTerminal,
  queue: mountQueue,
  view: mountView,
  bi: mountBi,
  browser: mountBrowser,
};

let getLenis: () => Lenis | null = () => null;
let triggers: ScrollTrigger[] = [];
let active = -1;
let paneArt: Mounted | null = null;
let swapTl: gsap.core.Timeline | null = null;
let fitObs: ResizeObserver | null = null;
let growObs: ResizeObserver | null = null;
const inline = new Map<number, Mounted>();
let started = false;

const rowsEls = () => [...document.querySelectorAll<HTMLElement>('[data-proj-list] .prow')];

export function renderProjects() {
  const p = dict[currentLang()].projects;
  const t = dict[currentLang()].text;
  const table = p.query.find(([k, v]) => k === 'i' && v.startsWith('dbo.'))![1];
  $('[data-proj-table]').textContent = table;
  $('[data-proj-name]').textContent = table.replace('dbo.', '');
  $('[data-proj-count]').textContent = `${p.rows.length} ${t['proj.rows']}`;
  $('[data-proj-pane]').setAttribute('aria-label', t['proj.pane']);
  // A lista é reconstruída (troca de idioma): o filtro do console era de uma consulta no outro idioma.
  // Sem isso o aviso "3 de 5 linhas" ficava na tela com as 5 linhas visíveis (visto no vídeo do Hiwan).
  $<HTMLElement>('[data-proj-filter]').hidden = true;

  $('[data-proj-list]').innerHTML = p.rows
    .map((r, i) => {
      const id = i + 1;
      return `<li class="prow" data-i="${i}">
        <button class="prow__btn" type="button" id="row-${id}" aria-controls="proj-pane" aria-pressed="false">
          <span class="prow__top"><span class="prow__n">${pad2(id)}</span><span class="prow__area">${esc(r.area)}</span><span class="prow__stack">${esc(r.stack)}</span></span>
          <span class="prow__name">${esc(r.name)}</span>
          <span class="prow__kpi"><b>${esc(r.kpi[0])}</b><span>${esc(r.kpi[1])}</span></span>
        </button>
        <div class="prow__inline" data-inline="${r.artifact}"></div>
        <details class="prow__case">
          <summary>${t['proj.read']}</summary>
          <dl>
            <div><dt>${t['case.problem']}</dt><dd>${esc(r.problem)}</dd></div>
            <div><dt>${t['case.solution']}</dt><dd>${esc(r.solution)}</dd></div>
            <div><dt>${t['case.outcome']}</dt><dd>${esc(r.outcome)}</dd></div>
          </dl>
        </details>
      </li>`;
    })
    .join('');

  if (started) {
    const was = active;
    active = -1;
    bind();
    if (matchMedia(WIDE).matches) setActive(Math.max(0, was), false);
  }
}

/** Troca de idioma: desmonta artefatos (o render seguinte remonta). */
export function resetCases() {
  paneArt?.destroy();
  paneArt = null;
  inline.forEach((m) => m.destroy());
  inline.clear();
  if (currentScene().id.startsWith('case:')) goScene(scenes.projects);
}

// ── Painel (desktop) ─────────────────────────────────────

/** Encaixa a janela do artefato no palco (escala para baixo se não couber; nunca amplia). */
function fit() {
  const stage = $<HTMLElement>('[data-pane-stage]');
  const box = $<HTMLElement>('[data-pane-fit]');
  const cs = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  box.style.width = `${availW}px`;
  box.style.transform = '';
  let s = Math.min(1, availH / box.offsetHeight);
  if (s < 1) {
    box.style.width = `${availW / s}px`;
    s = Math.min(1, availH / box.offsetHeight);
  }
  box.style.transform = `scale(${s})`;
  box.style.marginLeft = `${(availW - box.offsetWidth * s) / 2}px`;
}

function setActive(i: number, animate = true) {
  if (i === active) return;
  const p = dict[currentLang()].projects;
  const t = dict[currentLang()].text;
  const r = p.rows[i];
  active = i;

  rowsEls().forEach((el, j) => {
    el.classList.toggle('is-active', j === i);
    el.querySelector('.prow__btn')!.setAttribute('aria-pressed', String(j === i));
  });
  $('[data-pane-tab]').textContent = `explain · id = ${i + 1}`;
  $('[data-copy-link]').textContent = t['proj.copyLink'];
  $('[data-pane-count]').textContent = `${pad2(i + 1)} / ${pad2(p.rows.length)}`;
  const explain = $<HTMLElement>('[data-pane-explain]');
  const box = $<HTMLElement>('[data-pane-fit]');
  const scan = $<HTMLElement>('[data-pane-scan]');

  const mount = () => {
    paneArt?.destroy();
    fitObs?.disconnect();
    paneArt = ARTIFACTS[r.artifact](box);
    explain.innerHTML = `
      <div><dt>${t['case.problem']}</dt><dd>${esc(r.problem)}</dd></div>
      <div><dt>${t['case.solution']}</dt><dd>${esc(r.solution)}</dd></div>
      <div class="is-out"><dt>${t['case.outcome']}</dt><dd>${esc(r.outcome)}</dd></div>`;
    fit();
    // O artefato cresce enquanto roda (ex.: a view mostra o resultado depois da query): reencaixa.
    fitObs = new ResizeObserver(() => fit());
    fitObs.observe(box.firstElementChild ?? box);
  };

  swapTl?.kill();
  if (!animate || reduced) {
    mount();
    gsap.set([box, explain], { clipPath: 'none', opacity: 1 });
    paneArt!.play();
    return;
  }
  // Varredura: a janela atual apaga, a linha lima desce e revela a nova; o artefato roda ao terminar.
  swapTl = gsap
    .timeline()
    .to([box, explain], { opacity: 0, duration: 0.18, ease: 'power1.in' })
    .call(mount)
    .set(box, { opacity: 1, clipPath: 'inset(0 0 100% 0)' })
    .set(scan, { top: '0%', opacity: 1 })
    .to(scan, { top: '100%', duration: 0.62, ease: 'power2.inOut' }, '>')
    .to(box, { clipPath: 'inset(0 0 0% 0)', duration: 0.62, ease: 'power2.inOut' }, '<')
    .to(scan, { opacity: 0, duration: 0.2 }, '>-0.05')
    .fromTo(explain, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '<')
    .call(() => {
      gsap.set(box, { clipPath: 'none' });
      paneArt?.play();
    });
}

// ── Gatilhos ─────────────────────────────────────────────

function bind() {
  triggers.forEach((t) => t.kill());
  triggers = [];
  growObs?.disconnect();
  growObs = null;
  const wide = matchMedia(WIDE).matches;
  const rows = rowsEls();

  if (wide) {
    rows.forEach((row, i) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: row,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (st) => {
            if (!st.isActive) return;
            setActive(i);
            if (!currentScene().id.startsWith('path')) goScene(scenes.case(i + 1));
          },
        }),
      );
    });
    // Acima da primeira linha a barra volta para a lista inteira.
    triggers.push(
      ScrollTrigger.create({
        trigger: rows[0],
        start: 'top 55%',
        onLeaveBack: () => currentScene().id.startsWith('case:') && goScene(scenes.projects),
      }),
    );
    if (active < 0) setActive(0, false);
  } else {
    // Estreito: cada artefato monta quando a linha entra na tela e desmonta quando sai (economia de CPU).
    // A altura de cada janela fica SEMPRE reservada (medida antes, só cresce): sem isso a página
    // encolhia/crescia ~1300 px durante a rolagem e o scroll pulava para trás (auditoria 12, B1).
    let refreshT = 0;
    // Escrita no quadro seguinte: mudar o tamanho dentro do callback gera "ResizeObserver loop".
    growObs = new ResizeObserver((entries) => {
      const els = entries.map((e) => e.target as HTMLElement);
      requestAnimationFrame(() => {
        let grew = false;
        for (const el of els) {
          if (el.offsetHeight > (parseFloat(el.style.minHeight) || 0) + 1) {
            el.style.minHeight = `${el.offsetHeight}px`;
            grew = true;
          }
        }
        // Os gatilhos abaixo dependem dessas alturas.
        if (grew) {
          clearTimeout(refreshT);
          refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 150);
        }
      });
    });
    rows.forEach((row, i) => {
      const host = row.querySelector<HTMLElement>('[data-inline]')!;
      if (!inline.has(i)) {
        const probe = ARTIFACTS[host.dataset.inline as Artifact](host); // mede o estado inicial
        host.style.minHeight = `${host.offsetHeight}px`;
        probe.destroy();
        host.innerHTML = '';
      }
      growObs!.observe(host);
      const on = () => {
        if (inline.has(i)) return;
        const m = ARTIFACTS[host.dataset.inline as Artifact](host);
        inline.set(i, m);
        m.play();
      };
      const off = () => {
        if (!inline.has(i)) return;
        inline.get(i)!.destroy();
        inline.delete(i);
        host.innerHTML = '';
      };
      triggers.push(ScrollTrigger.create({ trigger: host, start: 'top 85%', end: 'bottom 10%', onToggle: (st) => (st.isActive ? on() : off()) }));
    });
  }
}

// ── Link por caso e filtro do console ────────────────────

const caseUrl = (i: number) => `${location.origin}${location.pathname}#projetos/${i + 1}`;

/** Leva ao caso i (0-based): desktop ativa e centraliza a linha; estreito rola até ela. */
export function goToCase(i: number) {
  const row = rowsEls()[i];
  if (!row) return;
  if (row.hidden) setProjectFilter(null);
  const wide = matchMedia(WIDE).matches;
  if (wide) {
    setActive(i);
    goScene(scenes.case(i + 1));
  }
  history.replaceState(null, '', `#projetos/${i + 1}`);
  const offset = wide ? -(innerHeight * 0.55 - row.offsetHeight / 2) : -100;
  const l = getLenis();
  if (l) l.scrollTo(row, { offset, duration: 1.1 });
  else scrollTo({ top: row.getBoundingClientRect().top + scrollY + offset });
}

/** `#projetos/3` (ou `#projects/3`) abre o caso 3. */
export function openFromHash() {
  const m = location.hash.match(/^#(?:projetos|projects)\/(\d+)$/);
  if (m) goToCase(Number(m[1]) - 1);
}

/** Filtro real vindo do console: só as linhas selecionadas pela consulta ficam na lista. */
export function setProjectFilter(ids: number[] | null, query = '') {
  const box = $<HTMLElement>('[data-proj-filter]');
  const rows = rowsEls();
  const t = dict[currentLang()].text;
  if (ids && ids.length === rows.length) ids = null; // a consulta trouxe todas as linhas: não há filtro
  rows.forEach((r, i) => (r.hidden = !!ids && !ids.includes(i + 1)));
  box.hidden = !ids;
  if (ids) {
    $('[data-proj-filter-q]').textContent = query.replace(/\s+/g, ' ').trim();
    $('[data-proj-filter-n]').textContent = t['proj.filterN'].replace('{n}', String(ids.length)).replace('{t}', String(rows.length));
    $('[data-proj-filter-clear]').textContent = t['proj.filterClear'];
  }
  ScrollTrigger.refresh();
  if (matchMedia(WIDE).matches) {
    const first = rows.findIndex((r) => !r.hidden);
    if (first >= 0 && rows[active]?.hidden) setActive(first);
  }
}

export function initCases(lenis: () => Lenis | null) {
  getLenis = lenis;
  started = true;

  // Clique na linha (desktop): leva a linha ao meio da tela; o gatilho de scroll ativa.
  $('[data-proj-list]').addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('.prow__btn');
    if (!btn || !matchMedia(WIDE).matches) return;
    goToCase(Number(btn.closest<HTMLElement>('.prow')!.dataset.i));
  });

  // Copiar link do caso ativo (#projetos/n)
  $('[data-copy-link]').addEventListener('click', async (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(caseUrl(Math.max(0, active)));
    } catch {
      return;
    }
    const t = dict[currentLang()].text;
    b.textContent = t['proj.linkCopied'];
    setTimeout(() => (b.textContent = t['proj.copyLink']), 1800);
  });
  $('[data-proj-filter-clear]').addEventListener('click', () => setProjectFilter(null));
  addEventListener('hashchange', openFromHash);

  const mm = gsap.matchMedia();
  mm.add({ wide: WIDE, narrow: '(max-width: 1100px)' }, () => {
    active = -1;
    bind();
    return () => {
      triggers.forEach((t) => t.kill());
      triggers = [];
      growObs?.disconnect();
      growObs = null;
      rowsEls().forEach((r) => r.querySelector<HTMLElement>('[data-inline]')?.style.removeProperty('min-height'));
      resetCases();
      active = -1;
    };
  });
  addEventListener('resize', () => matchMedia(WIDE).matches && paneArt && fit());
}
