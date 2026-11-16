/**
 * Seção 2: linhas de projeto que se expandem em um caso completo ("EXPLAIN" da linha).
 * - Uma linha aberta por vez; a barra de query vira `SELECT * FROM dbo.projetos WHERE id = n;`.
 * - Cada caso monta um artefato (terminal, fila, view, BI, navegador) que roda ao abrir.
 */
import { gsap } from 'gsap';
import type Lenis from 'lenis';
import { dict, currentLang, type Artifact } from './i18n';
import { goScene, scenes } from './qbar';
import { mountTerminal } from './artifacts/terminal';
import { mountQueue } from './artifacts/queue';
import { mountView } from './artifacts/view';
import { mountBi } from './artifacts/bi';
import { mountBrowser } from './artifacts/browser';

export type Mounted = { play: () => void; destroy: () => void };
type Mount = (host: HTMLElement) => Mounted;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const ARTIFACTS: Record<Artifact, Mount> = {
  terminal: mountTerminal,
  queue: mountQueue,
  view: mountView,
  bi: mountBi,
  browser: mountBrowser,
};

export function renderProjects() {
  const p = dict[currentLang()].projects;
  const t = dict[currentLang()].text;
  const table = p.query.find(([k, v]) => k === 'i' && v.startsWith('dbo.'))![1];
  document.querySelector('[data-proj-table]')!.textContent = table;
  document.querySelector('[data-proj-name]')!.textContent = table.replace('dbo.', '');
  document.querySelector('[data-proj-count]')!.textContent = `${p.rows.length} ${t['proj.rows']}`;

  document.querySelector('[data-proj-rows]')!.innerHTML =
    `<thead><tr>${p.cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>` +
    `<tbody>${p.rows
      .map((r, i) => {
        const id = i + 1;
        return `<tr class="row" data-i="${i}">
          <td class="n">${String(id).padStart(2, '0')}</td>
          <td class="name"><button class="row__btn" type="button" id="row-${id}" aria-expanded="false" aria-controls="case-${id}">${esc(r.name)}</button></td>
          <td class="area"><span>${esc(r.area)}</span></td>
          <td class="stack">${esc(r.stack)}</td>
          <td class="result"><span>${esc(r.result)}</span><span class="row__go" aria-hidden="true">+</span></td>
        </tr>
        <tr class="detail" hidden><td colspan="5">
          <div class="case" id="case-${id}" role="region" aria-labelledby="row-${id}" hidden>
            <div class="case__grid">
              <div class="case__text">
                <dl class="case__dl">
                  <div class="case__item"><dt>${t['case.problem']}</dt><dd>${esc(r.problem)}</dd></div>
                  <div class="case__item"><dt>${t['case.solution']}</dt><dd>${esc(r.solution)}</dd></div>
                  <div class="case__item case__item--out"><dt>${t['case.outcome']}</dt><dd>${esc(r.outcome)}</dd></div>
                </dl>
                <div class="case__actions">
                  <button class="sbtn" type="button" data-case-close>${t['case.close']} ✕</button>
                  ${i < p.rows.length - 1 ? `<button class="sbtn sbtn--ghost" type="button" data-case-next>${t['case.next']} →</button>` : ''}
                </div>
              </div>
              <div class="case__art" data-art="${r.artifact}"></div>
            </div>
          </div>
        </td></tr>`;
      })
      .join('')}</tbody>`;
}

let open = -1;
let art: Mounted | null = null;

/** Troca de idioma re-renderiza a tabela: fecha o caso aberto sem animação. */
export function resetCases() {
  art?.destroy();
  art = null;
  if (open >= 0) goScene(scenes.projects);
  open = -1;
}

export function initCases(getLenis: () => Lenis | null) {
  const tbody = () => document.querySelector('[data-proj-rows] tbody')!;

  const parts = (i: number) => {
    const row = tbody().querySelector<HTMLElement>(`tr.row[data-i="${i}"]`)!;
    const btn = row.querySelector<HTMLButtonElement>('.row__btn')!;
    const panel = document.getElementById(btn.getAttribute('aria-controls')!)!;
    const detail = panel.closest('tr')!; // fechada, a linha inteira sai da árvore de acessibilidade
    return { row, btn, panel, detail };
  };

  const close = (i: number, instant = false) => {
    const { row, btn, panel, detail } = parts(i);
    btn.setAttribute('aria-expanded', 'false');
    row.classList.remove('is-open');
    art?.destroy();
    art = null;
    gsap.killTweensOf(panel);
    const hide = () => {
      panel.hidden = true;
      detail.hidden = true;
      gsap.set(panel, { clearProps: 'height' });
    };
    if (instant || reduced) return hide();
    gsap.to(panel, { height: 0, duration: 0.55, ease: 'expo.inOut', onComplete: hide });
  };

  const openCase = (i: number) => {
    if (open === i) {
      close(i);
      open = -1;
      goScene(scenes.projects);
      return;
    }
    if (open >= 0) close(open, true); // troca de caso: o anterior fecha seco para não brigar com o scroll
    open = i;
    const { row, btn, panel, detail } = parts(i);
    btn.setAttribute('aria-expanded', 'true');
    row.classList.add('is-open');
    detail.hidden = false;
    panel.hidden = false;
    goScene(scenes.case(i + 1));

    const host = panel.querySelector<HTMLElement>('.case__art')!;
    art = ARTIFACTS[host.dataset.art as Artifact](host);

    // Rolagem até a linha: o Lenis precisa conhecer a altura FINAL da página antes de rolar
    // (com o painel em altura 0 o alvo era cortado pelo limite de rolagem).
    const lenis = getLenis();
    gsap.set(panel, { height: 'auto' });
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(row, { duration: 1 });
    } else row.scrollIntoView({ block: 'start' });

    if (reduced) return art.play();
    const items = panel.querySelectorAll('.case__item, .case__actions');
    gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.9, ease: 'expo.out', onComplete: () => gsap.set(panel, { clearProps: 'height' }) });
    gsap.fromTo(items, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
    gsap.fromTo(host, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.25, onComplete: () => art?.play() });
  };

  // Clique na linha inteira (exceto dentro do painel aberto) abre/fecha o caso.
  tbody().addEventListener('click', (e) => {
    const target = e.target as Element;
    if (target.closest('[data-case-close]')) {
      openCase(open);
      parts(Number(target.closest('tr.detail')!.previousElementSibling!.getAttribute('data-i'))).btn.focus();
      return;
    }
    if (target.closest('[data-case-next]')) {
      const next = open + 1;
      openCase(next);
      parts(next).btn.focus();
      return;
    }
    const row = target.closest('tr.row');
    if (row) openCase(Number(row.getAttribute('data-i')));
  });

  // Esc fecha o caso aberto e devolve o foco à linha.
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || open < 0) return;
    const i = open;
    openCase(i);
    parts(i).btn.focus();
  });
}
