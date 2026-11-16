/**
 * Barra de query fixa. Cada "cena" (hero, lista de projetos, um caso aberto) tem uma query e um status.
 * Trocar de cena = apagar a query atual e digitar a próxima ("o scroll escreve a próxima query").
 */
import { gsap } from 'gsap';
import { dict, currentLang, type Tok } from './i18n';
import { pathData } from './path-data';

export type Scene = { id: string; query: () => Tok[]; status: () => string };

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Query em uma linha (a barra não tem quebras nem indentação de alinhamento). */
export const flat = (q: Tok[]): Tok[] => q.map(([k, t]) => [k, k === 't' ? t.replace(/\n\s*/g, ' ') : t]);
const len = (q: Tok[]) => q.reduce((n, [, t]) => n + t.length, 0);

export function tokensHtml(q: Tok[], n = Infinity) {
  let left = n, out = '';
  for (const [k, t] of q) {
    if (left <= 0) break;
    const part = t.slice(0, left);
    left -= part.length;
    out += k === 't' ? esc(part) : `<span class="${k}">${esc(part)}</span>`;
  }
  return out;
}

const secs = (v: number) => v.toLocaleString(document.documentElement.lang, { minimumFractionDigits: 3 });
const rowsStatus = (n: number, t: number) =>
  dict[currentLang()].text['qbar.done'].replace('{n}', String(n)).replace('{t}', secs(t));

export const scenes = {
  hero: { id: 'hero', query: () => flat(dict[currentLang()].query), status: () => dict[currentLang()].text['status.done'] } as Scene,
  projects: {
    id: 'projects',
    query: () => flat(dict[currentLang()].projects.query),
    status: () => rowsStatus(dict[currentLang()].projects.rows.length, 0.018),
  } as Scene,
  path: {
    id: 'path',
    query: () => pathData[currentLang()].query,
    status: () => rowsStatus(pathData[currentLang()].years.length, 0.007),
  } as Scene,
  /** Um caso aberto: SELECT * FROM dbo.projetos WHERE id = n; */
  case: (id: number): Scene => ({
    id: `case:${id}`,
    query: () => {
      const table = dict[currentLang()].projects.query.find(([k, v]) => k === 'i' && v.startsWith('dbo.'))![1];
      return [['k', 'SELECT'], ['t', ' '], ['p', '*'], ['t', ' '], ['k', 'FROM'], ['t', ' '], ['i', table],
        ['t', ' '], ['k', 'WHERE'], ['t', ' '], ['i', 'id'], ['t', ' '], ['p', '='], ['t', ' '], ['s', String(id)], ['p', ';']];
    },
    status: () => dict[currentLang()].text['qbar.one'].replace('{t}', secs(0.004)),
  }),
};

let current: Scene = scenes.hero;
let tl: gsap.core.Timeline | null = null;

export const qbarEl = () => $<HTMLElement>('.qbar');

/** Desenha a cena atual sem animação (troca de idioma, reduced-motion). */
export function paintQbar() {
  $('[data-qbar-code]').innerHTML = tokensHtml(current.query());
  $('[data-qbar-status]').textContent = current.status();
}

export function goScene(next: Scene) {
  if (next.id === current.id) return;
  const from = current.query();
  const to = next.query();
  current = next;
  tl?.kill();
  if (reduced) return paintQbar();

  const code = $<HTMLElement>('[data-qbar-code]');
  const status = $<HTMLElement>('[data-qbar-status]');
  const s = { del: len(from), add: 0 };
  const caret = '<span class="caret"></span>';
  tl = gsap
    .timeline()
    .call(() => (status.textContent = ''))
    .to(s, { del: 0, duration: 0.25, ease: 'power1.in', onUpdate: () => (code.innerHTML = tokensHtml(from, Math.round(s.del)) + caret) })
    .to(s, { add: len(to), duration: Math.min(0.7, len(to) * 0.012), ease: 'none', onUpdate: () => (code.innerHTML = tokensHtml(to, Math.round(s.add)) + caret) })
    .call(() => (status.textContent = dict[currentLang()].text['status.running']))
    .call(() => paintQbar(), undefined, '+=0.16');
}

export const currentScene = () => current;

/** Troca de cena sem animação (a ponte em tela fixa já mostrou a reescrita no editor do hero). */
export function setScene(next: Scene) {
  if (next.id === current.id) return;
  tl?.kill();
  current = next;
  paintQbar();
}
