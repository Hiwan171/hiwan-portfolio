/**
 * Ponte hero → projetos em tela fixa (1º dos 2 momentos "pinned"; o resto do site é scroll vertical).
 * Só desktop e sem reduced-motion. Scrub reversível: rolar para cima desfaz tudo.
 *
 *   0.00–0.32  headline sai por cima; retrato volta a ser dados espalhados; tabela e botões somem
 *   0.15–0.60  o editor apaga a query do hero e digita a de projetos
 *   0.60–0.66  ▸ executando… → ✓ 5 linhas
 *   0.66–0.95  "dbo.projetos" sobe no lugar da headline; aviso de passagem para as linhas
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dict, currentLang, type Tok } from './i18n';
import { portraitState } from './portrait';
import { tokensHtml, setScene, scenes } from './qbar';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const len = (q: Tok[]) => q.reduce((n, [, t]) => n + t.length, 0);
const root = document.documentElement;

let mm: gsap.MatchMedia | null = null;
let st: ScrollTrigger | null = null;

export const bridgeActive = () => root.classList.contains('has-bridge');

function build() {
  const d = dict[currentLang()];
  const heroQ = d.query;
  const projQ = d.projects.editorQuery;
  const lenH = len(heroQ);
  const lenP = len(projQ);
  const table = d.projects.query.find(([k, v]) => k === 'i' && v.startsWith('dbo.'))![1];
  const rowsN = d.projects.rows.length;
  const secs = (0.018).toLocaleString(root.lang, { minimumFractionDigits: 3 });

  $('[data-bridge-name]').textContent = table.replace('dbo.', '');
  $('[data-bridge-count]').textContent = `✓ ${rowsN} ${d.text['proj.rows']}`;

  const code = $<HTMLElement>('[data-query]');
  const status = $<HTMLElement>('[data-status]');
  const meta = $<HTMLElement>('.cell--result .cell__tab-meta');
  const blobLabel = $<HTMLElement>('[data-blob] .cell__tab > span:first-child');
  const blobMeta = $<HTMLElement>('[data-blob] .cell__tab-meta');
  // Texto original ("BLOB · 19.368 pts") é gravado em data-hero quando o retrato carrega.
  const blobMetaHero = () => blobMeta.dataset.hero ?? 'BLOB';
  const cols = d.projects.cols.length - 1; // sem o "#"
  const caret = '<span class="caret"></span>';

  // k < 0: query do hero com |k| caracteres; k ≥ 0: query de projetos com k caracteres.
  const k = { v: -lenH };
  const renderK = () => {
    const v = Math.round(k.v);
    code.innerHTML = v < 0 ? tokensHtml(heroQ, -v) + caret : tokensHtml(projQ, v) + caret;
  };

  // Estado discreto (status, contagem, cena da barra de query) derivado do progresso.
  let phase = '';
  const sync = (p: number) => {
    const next = p < 0.15 ? 'hero' : p < 0.6 ? 'typing' : p < 0.66 ? 'running' : 'done';
    if (next === phase) return;
    phase = next;
    const t = dict[currentLang()].text;
    // A célula da foto vira a grade de resultado quando a query de projetos executa.
    const grid = next === 'done';
    blobLabel.textContent = grid ? t['result.tab'] : t['blob.col'];
    blobMeta.textContent = grid ? `${rowsN} × ${cols}` : blobMetaHero();
    if (next === 'hero') {
      status.textContent = t['status.done'];
      status.dataset.state = 'done';
      meta.textContent = t['result.meta'];
    } else if (next === 'typing') {
      status.textContent = '';
      status.dataset.state = '';
    } else if (next === 'running') {
      status.textContent = t['status.running'];
      status.dataset.state = '';
    } else {
      status.textContent = t['qbar.done'].replace('{n}', String(rowsN)).replace('{t}', secs);
      status.dataset.state = 'done';
      meta.textContent = `${rowsN} ${t['proj.rows']}`;
    }
    setScene(next === 'done' ? scenes.projects : scenes.hero);
  };

  // Estado inicial do título (dentro do contexto do matchMedia: o revert desfaz).
  gsap.set('.bridge-title .line > span', { yPercent: 130 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top+=52',
      end: '+=110%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      // Recalcula ANTES dos gatilhos criados antes dela (barra de query, linhas): eles dependem
      // do espaço que esta tela fixa acrescenta.
      refreshPriority: 1,
      onUpdate: (self) => sync(self.progress),
    },
  });
  st = tl.scrollTrigger!;

  tl.to('.headline .line > span', { yPercent: -130, duration: 0.24, stagger: 0.025, ease: 'power2.in' }, 0)
    .to('.actions', { opacity: 0, y: -10, duration: 0.14 }, 0)
    .to('[data-result]', { opacity: 0, duration: 0.18 }, 0.04)
    .to(portraitState, { p: 0.1, duration: 0.45, ease: 'power1.in' }, 0)
    // Depois que a query executa, os dados assentam na grade de resultado (5 linhas).
    .to(portraitState, { g: 1, duration: 0.3, ease: 'power1.inOut' }, 0.62)
    .to(k, { v: lenP, duration: 0.45, onUpdate: renderK }, 0.15)
    .to('.bridge-title .line > span', { yPercent: 0, duration: 0.2, ease: 'power3.out' }, 0.66)
    .fromTo('.bridge-title__sub', { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, 0.78)
    .fromTo('.bridge-handoff', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.15, immediateRender: false }, 0.72)
    .to({}, { duration: 0.05 }); // respiro no fim antes de soltar a tela
}

/** Liga a ponte depois que a intro do hero termina (os tweens partem do estado final da intro). */
export function initBridge() {
  mm?.revert();
  mm = gsap.matchMedia();
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('has-bridge');
    build();
    // Gatilhos criados antes do pin (barra de query, linhas de projetos) precisam recalcular
    // posições com o espaço que a tela fixa acrescenta.
    ScrollTrigger.refresh();
    return () => {
      root.classList.remove('has-bridge');
      st = null;
    };
  });
}

/** Troca de idioma: re-renderiza o hero e reconstrói a ponte no progresso atual. */
export function rebuildBridge() {
  if (!mm) return;
  initBridge();
  ScrollTrigger.refresh();
}

export const bridgeProgress = () => st?.progress ?? 0;
