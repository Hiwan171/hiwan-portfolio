/**
 * Ponte hero → projetos em tela fixa (1º dos 2 momentos "pinned"; o resto do site é scroll vertical).
 * Só desktop e sem reduced-motion. Scrub reversível: rolar para cima desfaz tudo.
 *
 * Tempos da timeline (s de timeline; o scroll percorre 0 → 0,8). Auditoria 12 (D1): as fases se
 * sobrepõem para nunca haver quadro vazio — a headline só sai quando o título novo já vem subindo.
 *   0.00–0.36  o editor apaga a query do hero e digita a de projetos; retrato se espalha
 *   0.20–0.44  botões, headline e tabela saem (a headline sai enquanto a query ainda é digitada)
 *   0.36–0.40  ▸ executando… → ✓ 5 linhas
 *   0.38–0.64  "dbo.projetos" sobe no lugar da headline; dados assentam na grade; aviso de passagem
 *   fim        a lista de projetos sobe por cima da faixa do aviso (margem negativa, D2)
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

  // Estado discreto (status, contagem, cena da barra de query) derivado do tempo da timeline.
  const T = { type: 0.02, run: 0.36, done: 0.4, end: 0.8 };
  let phase = '';
  const sync = (p: number) => {
    const next = p < T.type ? 'hero' : p < T.run ? 'typing' : p < T.done ? 'running' : 'done';
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
    // Tela fixa por CSS (`position: sticky` dentro de .hero-spacer), não por pin do GSAP: o pin tirava e
    // devolvia o hero ao DOM a cada refresh e o Chrome contava a headline como conteúdo novo
    // (LCP = fim da intro, 2,8 s; auditoria 12). O GSAP só lê o scroll.
    scrollTrigger: {
      trigger: '.hero-spacer',
      start: 'top top+=52',
      end: () => `+=${bridgeLen()}`, // função: recalculada em todo refresh (sem invalidateOnRefresh, que
      // regravaria os valores iniciais no meio da animação e quebraria a volta ao hero)
      scrub: 0.6,
      // Recalcula ANTES dos gatilhos criados antes dela (barra de query, linhas): eles dependem
      // do espaço que esta tela fixa acrescenta.
      refreshPriority: 1,
      onUpdate: (self) => sync(self.progress * T.end),
    },
  });
  st = tl.scrollTrigger!;

  tl.to(k, { v: lenP, duration: T.run - T.type, onUpdate: renderK }, T.type)
    .to(portraitState, { p: 0.1, duration: 0.34, ease: 'power1.in' }, 0)
    .to('.actions', { opacity: 0, y: -10, duration: 0.12 }, 0.2)
    // De baixo para cima: "funcionam." libera primeiro o lugar onde o título novo entra (sem colisão).
    .to('.headline .line > span', { yPercent: -130, duration: 0.18, stagger: { each: 0.03, from: 'end' }, ease: 'power2.in' }, 0.22)
    // Título novo sobe enquanto as linhas de cima ainda saem: troca, não vazio.
    .to('.bridge-title .line > span', { yPercent: 0, duration: 0.22, ease: 'power3.out' }, 0.39)
    // A tabela do hero só sai quando o aviso de 5 linhas entra (a faixa nunca fica vazia).
    .to('[data-result]', { opacity: 0, duration: 0.08 }, 0.34)
    .fromTo('.bridge-handoff', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.1, immediateRender: false }, T.done)
    // Depois que a query executa, os dados assentam na grade de resultado (5 linhas).
    .to(portraitState, { g: 1, duration: 0.24, ease: 'power1.inOut' }, T.done)
    .fromTo('.bridge-title__sub', { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, 0.5)
    .to({}, { duration: T.end - 0.64 }, 0.64); // respiro: a lista sobe por cima do aviso antes de soltar
}

/** Distância de rolagem da tela fixa (= o antigo end '+=110%'). */
const bridgeLen = () => Math.round(innerHeight * 1.1);

/** Antes de cada refresh: comprimento da tela fixa (padding do espaçador) e altura da faixa do aviso
 *  (célula de resultado sem a aba), por cima da qual a lista de projetos sobe. */
function setBand() {
  root.style.setProperty('--bridge-len', `${bridgeLen()}px`);
  const cell = document.querySelector<HTMLElement>('.cell--result');
  const tab = cell?.querySelector<HTMLElement>('.cell__tab');
  if (!cell || !tab) return;
  root.style.setProperty('--handoff-h', `${cell.offsetHeight - tab.offsetHeight}px`);
}

/** Liga a ponte depois que a intro do hero termina (os tweens partem do estado final da intro). */
export function initBridge() {
  mm?.revert();
  mm = gsap.matchMedia();
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('has-bridge');
    setBand();
    ScrollTrigger.addEventListener('refreshInit', setBand);
    build();
    // Gatilhos criados antes do pin (barra de query, linhas de projetos) precisam recalcular
    // posições com o espaço que a tela fixa acrescenta.
    ScrollTrigger.refresh();
    return () => {
      root.classList.remove('has-bridge');
      ScrollTrigger.removeEventListener('refreshInit', setBand);
      root.style.removeProperty('--handoff-h');
      root.style.removeProperty('--bridge-len');
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
