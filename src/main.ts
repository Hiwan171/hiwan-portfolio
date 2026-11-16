import '@fontsource-variable/geist-mono';
import '@fontsource-variable/funnel-display';
import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/boot.css';
import './styles/sections.css';
import './styles/case.css';
import './styles/artifacts.css';
import './styles/path.css';

import { gsap } from 'gsap';
import { dict, currentLang, type Lang, type Tok } from './i18n';
import { isBooting, runPreloader } from './preloader';
import { initInteractions, toggleTheme } from './interact';
import { initPortrait, portraitState } from './portrait';
import { initSections, renderProjects, paintQbar } from './sections';
import { resetCases } from './projects';
import { initBridge, rebuildBridge, bridgeActive, bridgeProgress } from './bridge';
import { renderPath } from './path';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const $$ = <T extends Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isStatic = reduced || params.has('static');
const seekAt = params.get('at'); // ?at=1.2 → congela a intro nesse tempo (estudo de movimento)

/* ── Preferências ─────────────────────────────────────── */

function savePrefs() {
  try {
    localStorage.setItem('hiwan:prefs', JSON.stringify({ theme: root.dataset.theme, lang: currentLang() }));
  } catch {
    /* storage indisponível: segue sem persistir */
  }
}

/* ── Render ───────────────────────────────────────────── */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function queryLength(q: Tok[]) {
  return q.reduce((n, [, t]) => n + t.length, 0);
}

/** Renderiza os primeiros `n` caracteres da query, com destaque de sintaxe e cursor. */
function renderQuery(q: Tok[], n: number) {
  let left = n;
  let html = '';
  for (const [kind, text] of q) {
    if (left <= 0) break;
    const part = text.slice(0, left);
    left -= part.length;
    html += kind === 't' ? esc(part) : `<span class="${kind}">${esc(part)}</span>`;
  }
  $('[data-query]').innerHTML = html + '<span class="caret"></span>';
}

function renderStatic(lang: Lang) {
  const d = dict[lang];

  $$<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = d.text[el.dataset.i18n!] ?? '';
  });
  $('[data-lang-label]').textContent = `'${lang.toUpperCase()}'`;

  const lines = d.query.reduce((n, [, t]) => n + (t.match(/\n/g)?.length ?? 0), 1);
  $('[data-gutter]').textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');

  $('[data-headline]').innerHTML = d.headline
    .map(
      (line) =>
        `<span class="line"><span>${line
          .map((p) => (p.mark ? `<span class="mark" data-text="${esc(p.text)}">${esc(p.text)}</span>` : esc(p.text)))
          .join('')}</span></span>`,
    )
    .join('');

  const { cols, row } = d.result;
  $('[data-result]').innerHTML =
    `<thead><tr>${cols.map((c) => `<th scope="col">${c.name}<span class="type" aria-hidden="true">${c.type}</span></th>`).join('')}</tr></thead>` +
    `<tbody><tr>${row
      .map((v, i) =>
        cols[i].name === 'status'
          ? `<td data-col="${cols[i].name}"><span class="status">${esc(v)}</span></td>`
          : `<td data-col="${cols[i].name}">${esc(v)}</td>`,
      )
      .join('')}</tr></tbody>`;
}

function setStatus(key: 'status.running' | 'status.done' | '') {
  const el = $<HTMLElement>('[data-status]');
  el.textContent = key ? dict[currentLang()].text[key] : '';
  el.dataset.state = key === 'status.done' ? 'done' : '';
}

/* ── Intro ────────────────────────────────────────────── */

/** Deslocamento das linhas escondidas. Precisa passar da folga de descendentes (.2em) da máscara,
 *  senão o topo das ascendentes aparece antes da hora. */
const HIDDEN = 140;

/** Monta a intro do hero pausada, já com os estados iniciais aplicados (nada pisca por baixo do loader). */
function buildIntro(booted: boolean) {
  const q = dict[currentLang()].query;
  const total = queryLength(q);
  const typing = { n: 0 };

  const bar = $('.bar');
  const lines = $$('.headline .line > span');
  const mark = $$('.mark');
  const cells = $$('.result th, .result td');
  const blob = $('[data-blob] .blob');
  const actions = $('.actions');

  // Vindo da tela de conexão, a barra já está "no lugar" (a réplica se recolhe sobre ela).
  gsap.set(bar, { opacity: booted ? 1 : 0 });
  gsap.set(lines, { yPercent: HIDDEN });
  gsap.set(mark, { '--sweep': '100%' });
  gsap.set(cells, { opacity: 0 });
  gsap.set(blob, { opacity: 0 });
  portraitState.p = 0;
  gsap.set(actions, { opacity: 0, y: 12 });
  renderQuery(q, 0);
  setStatus('');

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      (window as any).__introDone = true;
      initBridge(); // a ponte parte do estado final da intro
    },
  });

  // Orçamento: headline começa antes de 1,2 s; intro inteira ≤ 2,6 s.
  tl.to(bar, { opacity: 1, duration: 0.6 }, 0)
    // Retrato: partículas espalhadas se organizam no rosto ("dados espalhados → sistema").
    .to(blob, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.1)
    .to(portraitState, { p: 1, duration: 2.6, ease: 'none' }, 0.1)
    .to(typing, { n: total, duration: 0.85, ease: 'power1.in', onUpdate: () => renderQuery(q, Math.round(typing.n)) }, 0.2)
    // Posições explícitas: .call() sem posição vai para o FIM da timeline (depois do blob).
    .addLabel('typed', 1.05)
    .call(() => setStatus('status.running'), undefined, 'typed')
    .call(() => setStatus('status.done'), undefined, 'typed+=0.16')
    .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 'typed+=0.16')
    .to(cells, { opacity: 1, duration: 0.45, stagger: 0.025 }, '<0.2')
    .to(mark, { '--sweep': '0%', duration: 0.7, ease: 'expo.inOut', stagger: 0.12 }, '<0.3')
    .to(actions, { opacity: 1, y: 0, duration: 0.7 }, '<0.15');

  return tl;
}

/** Toca a intro, ou congela em `at` (s) para estudo de movimento. */
function playIntro(tl: gsap.core.Timeline, at?: number) {
  if (at === undefined) tl.play();
  else tl.seek(at, false).pause(); // false: dispara onUpdate/call no seek
}

/** Troca de idioma = a query é executada de novo. `done` roda quando o hero chega ao estado final. */
function rerun(done?: () => void) {
  const q = dict[currentLang()].query;
  const typing = { n: 0 };
  const lines = $$('.headline .line > span');
  const cells = $$('.result th, .result td');

  setStatus('');
  gsap
    .timeline({ defaults: { ease: 'expo.out' }, onComplete: done })
    .set(lines, { yPercent: HIDDEN })
    .set(cells, { opacity: 0 })
    .set('.mark', { '--sweep': '0%' })
    .to(typing, { n: queryLength(q), duration: 0.6, ease: 'none', onUpdate: () => renderQuery(q, Math.round(typing.n)) })
    .call(() => setStatus('status.done'))
    .to(lines, { yPercent: 0, duration: 0.9, stagger: 0.06 })
    .to(cells, { opacity: 1, duration: 0.4, stagger: 0.02 }, '<0.15');
}

/** Hero no estado final, sem animação (troca de idioma com a ponte já em andamento). */
function settleHero() {
  gsap.set($$('.headline .line > span'), { yPercent: 0 });
  gsap.set('.mark', { '--sweep': '0%' });
  gsap.set($$('.result th, .result td'), { opacity: 1 });
  renderQuery(dict[currentLang()].query, Infinity);
  setStatus('status.done');
}

/* ── Controles ────────────────────────────────────────── */

$('[data-action="lang"]').addEventListener('click', () => {
  const next: Lang = currentLang() === 'pt' ? 'en' : 'pt';
  root.lang = next === 'en' ? 'en' : 'pt-BR';
  renderStatic(next);
  resetCases();
  renderProjects();
  renderPath();
  ScrollTrigger.refresh(); // larguras das páginas mudam com o idioma
  paintQbar();
  savePrefs();
  // A ponte em tela fixa precisa partir do estado FINAL do hero (senão registra valores do meio
  // da animação e o hero volta "quebrado" ao rolar para cima).
  if (isStatic || (bridgeActive() && bridgeProgress() > 0.01)) {
    settleHero();
    rebuildBridge();
  } else rerun(() => bridgeActive() && rebuildBridge());
});

$('[data-action="theme"]').addEventListener('click', (e) => {
  toggleTheme(e.currentTarget as HTMLElement, () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    savePrefs();
  });
});

/* ── Boot ─────────────────────────────────────────────── */

renderStatic(currentLang());
initInteractions();

// Resolve quando a tela de conexão termina (ou na hora, se ela não aparecer).
const bootDone = new Promise<void>((resolve) => {
  if (!isBooting()) return resolve();
  const mo = new MutationObserver(() => {
    if (!isBooting()) {
      mo.disconnect();
      resolve();
    }
  });
  mo.observe(root, { attributes: true, attributeFilter: ['data-boot'] });
});
initSections({ bootDone });

const blobEl = $<HTMLElement>('[data-blob] .blob');
initPortrait(blobEl)
  .then((n) => {
    if (!n) return;
    const meta = $<HTMLElement>('[data-blob] .cell__tab-meta');
    meta.dataset.hero = `BLOB · ${n.toLocaleString(root.lang)} pts`;
    // Se a ponte já estiver no estado de grade, ela mantém o rótulo dela.
    if (!bridgeActive() || bridgeProgress() < 0.66) meta.textContent = meta.dataset.hero;
  })
  .catch((e) => console.error('retrato:', e));

const booted = isBooting();
const intro = buildIntro(booted);
const num = (v: string | null) => (v === null ? undefined : parseFloat(v));

if (isStatic) {
  intro.progress(1);
} else if (booted) {
  // Espera curta pelas fontes (evita troca de fonte no diálogo); o loader segura o resto.
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]).then(() =>
    runPreloader({ onHero: (at) => playIntro(intro, at), seekAt: num(params.get('bootat')) }),
  );
} else {
  document.fonts.ready.then(() => playIntro(intro, num(seekAt)));
}
