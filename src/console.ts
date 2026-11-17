/**
 * Console SQL (`/`): uma janela de consulta do SSMS que sobe da base da tela.
 * O visitante escreve T-SQL de verdade contra as tabelas do site (sqlengine.ts, SQLite no navegador).
 * - Consultas em dbo.projetos filtram a lista da página.
 * - Monitor de atividade: sys.dm_exec_sessions (rodapé → clique no relógio).
 * - Atalhos do SSMS: F5 / Ctrl+Enter executam, Ctrl+R mostra/oculta resultados, Esc fecha, ? lista atalhos.
 */
import { gsap } from 'gsap';
import { currentLang, type Tok } from './i18n';
import { tokensHtml, setScene, currentScene, flat, paintQbar } from './qbar';
import { setProjectFilter } from './projects';
import type { RunResult } from './sqlengine';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const MONITOR_SQL = 'SELECT * FROM sys.dm_exec_sessions WHERE session_id = @@SPID;';

const L = {
  pt: {
    open: 'query', title: 'SQLQuery1.sql · hiwan.db (visitante)', close: 'Fechar console',
    keys: 'F5 executar · Esc fechar · ? atalhos', run: 'Executar', label: 'Consulta SQL',
    results: 'Resultados', messages: 'Mensagens', loading: 'conectando ao motor (SQLite em WebAssembly, ~690 KB)…',
    ok: '✓ Consulta executada com êxito.', err: '✕ Consulta concluída com erros.', rows: (n: number) => `${n} ${n === 1 ? 'linha' : 'linhas'}`,
    placeholder: '-- escreva uma consulta e aperte F5', vertical: '1 linha · exibida na vertical',
    filtered: '↳ a lista dbo.projetos da página foi filtrada por esta consulta.',
    tables: 'tabelas: dbo.hiwan · dbo.projetos · dbo.trajetoria · dbo.contato · sys.dm_exec_sessions',
    examples: [
      ["SELECT * FROM dbo.projetos WHERE area = 'automação';", 'filtrar projetos'],
      ['SELECT ano, COUNT(*) AS eventos FROM dbo.trajetoria GROUP BY ano;', 'agrupar'],
      ['SELECT TOP 3 projeto, ano FROM dbo.projetos ORDER BY ano DESC;', 'TOP 3'],
      [MONITOR_SQL, 'sua sessão'],
      ['DROP TABLE dbo.projetos;', 'tente quebrar'],
    ],
    shortcutsTitle: 'Atalhos (os do SSMS)',
    shortcuts: [
      ['/', 'abrir o console'],
      ['F5 · Ctrl+Enter', 'executar a consulta'],
      ['Ctrl+R', 'mostrar/ocultar resultados'],
      ['Esc', 'fechar o console'],
      ['F5 (fora do console)', 'executar de novo o artefato do projeto visível'],
      ['?', 'esta lista'],
    ],
    monitor: 'Monitor de atividade: dados da sua visita (ficam só nesta aba)',
  },
  en: {
    open: 'query', title: 'SQLQuery1.sql · hiwan.db (guest)', close: 'Close console',
    keys: 'F5 run · Esc close · ? shortcuts', run: 'Execute', label: 'SQL query',
    results: 'Results', messages: 'Messages', loading: 'connecting to the engine (SQLite on WebAssembly, ~690 KB)…',
    ok: '✓ Query executed successfully.', err: '✕ Query completed with errors.', rows: (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`,
    placeholder: '-- write a query and press F5', vertical: '1 row · shown vertically',
    filtered: '↳ the page’s dbo.projects list was filtered by this query.',
    tables: 'tables: dbo.hiwan · dbo.projects · dbo.career · dbo.contact · sys.dm_exec_sessions',
    examples: [
      ["SELECT * FROM dbo.projects WHERE area = 'automation';", 'filter projects'],
      ['SELECT year, COUNT(*) AS events FROM dbo.career GROUP BY year;', 'group'],
      ['SELECT TOP 3 project, year FROM dbo.projects ORDER BY year DESC;', 'TOP 3'],
      [MONITOR_SQL, 'your session'],
      ['DROP TABLE dbo.projects;', 'try to break it'],
    ],
    shortcutsTitle: 'Shortcuts (the SSMS ones)',
    shortcuts: [
      ['/', 'open the console'],
      ['F5 · Ctrl+Enter', 'run the query'],
      ['Ctrl+R', 'show/hide results'],
      ['Esc', 'close the console'],
      ['F5 (outside the console)', 'rerun the visible project’s artifact'],
      ['?', 'this list'],
    ],
    monitor: 'Activity monitor: your visit’s data (stays in this tab only)',
  },
};
const s = () => L[currentLang()];

/* ── Realce de sintaxe (mesmos tokens da barra de query) ── */

const KW = /^(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|AS|ON|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|UNION|ALL|DISTINCT|TOP|LIMIT|OFFSET|ASC|DESC|CASE|WHEN|THEN|ELSE|END|WITH|INSERT|INTO|VALUES|UPDATE|SET|DELETE|DROP|TABLE|CREATE|ALTER|COUNT|SUM|AVG|MIN|MAX|STRING_AGG|LEN|UPPER|LOWER|GETDATE|ISNULL|COALESCE|EXEC|TRUNCATE|GO)$/i;

export function tokenize(sql: string): Tok[] {
  const out: Tok[] = [];
  const re = /(--[^\n]*)|('(?:[^']|'')*'?)|(@@\w+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_À-ſ][\w.À-ſ]*)|(\s+)|([^\s])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    if (m[1]) out.push(['p', m[1]]);
    else if (m[2]) out.push(['s', m[2]]);
    else if (m[3]) out.push(['k', m[3]]);
    else if (m[4]) out.push(['s', m[4]]);
    else if (m[5]) out.push([KW.test(m[5]) ? 'k' : 'i', m[5]]);
    else if (m[6]) out.push(['t', m[6]]);
    else out.push(['p', m[7]]);
  }
  return out;
}

/* ── Render ───────────────────────────────────────────── */

const cell = (v: unknown) => (v === null ? '<td class="is-null">NULL</td>' : `<td>${esc(String(v))}</td>`);

function renderResult(res: RunResult) {
  const out = $<HTMLElement>('[data-console-results]');
  if (!res.sets.length) {
    out.innerHTML = '';
    return;
  }
  out.innerHTML = res.sets
    .map((set) => {
      // 1 linha com muitas colunas (ex.: o monitor) fica legível na vertical.
      if (set.rows.length === 1 && set.cols.length > 6) {
        return `<p class="console__note">${s().vertical}</p><table class="console__grid console__grid--v"><tbody>${set.cols
          .map((c, i) => `<tr><th scope="row">${esc(c)}</th>${cell(set.rows[0][i])}</tr>`)
          .join('')}</tbody></table>`;
      }
      return `<table class="console__grid"><thead><tr><th class="n"></th>${set.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${set.rows
        .map((r, i) => `<tr><td class="n">${i + 1}</td>${r.map(cell).join('')}</tr>`)
        .join('')}</tbody></table>`;
    })
    .join('');
}

function renderMessages(res: RunResult, extra: string[] = []) {
  $('[data-console-messages]').innerHTML = [...res.messages.map((m) => `<p class="${m.error ? 'is-err' : ''}">${esc(m.text).replace(/\n/g, '<br>')}</p>`), ...extra.map((e) => `<p>${esc(e)}</p>`)].join('');
}

function showTab(which: 'results' | 'messages') {
  document.querySelectorAll<HTMLButtonElement>('[data-console-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.consoleTab === which)));
  $<HTMLElement>('[data-console-results]').hidden = which !== 'results';
  $<HTMLElement>('[data-console-messages]').hidden = which !== 'messages';
}

function renderShortcuts() {
  const d = s();
  $('[data-console-messages]').innerHTML = `<p class="console__note">${d.shortcutsTitle}</p><table class="console__grid console__grid--v"><tbody>${d.shortcuts
    .map(([k, v]) => `<tr><th scope="row"><kbd>${esc(k)}</kbd></th><td>${esc(v)}</td></tr>`)
    .join('')}</tbody></table>`;
  showTab('messages');
}

export function renderConsole() {
  const d = s();
  $('[data-console-title]').textContent = d.title;
  $('[data-console-keys]').textContent = d.keys;
  $('[data-console-run-label]').textContent = d.run;
  $('[data-console-close]').setAttribute('aria-label', d.close);
  $('[data-console-input]').setAttribute('aria-label', d.label);
  $<HTMLTextAreaElement>('[data-console-input]').placeholder = d.placeholder;
  $('[data-console-tables]').textContent = d.tables;
  document.querySelectorAll<HTMLElement>('[data-console-tab]').forEach((b) => (b.textContent = b.dataset.consoleTab === 'results' ? d.results : d.messages));
  document.querySelectorAll<HTMLElement>('[data-console-open-label]').forEach((el) => (el.textContent = d.open));
  $('[data-console-examples]').innerHTML = d.examples
    .map(([q, label]) => `<button class="sbtn sbtn--ghost console__ex" type="button" data-example="${esc(q).replace(/"/g, '&quot;')}">${esc(label)}</button>`)
    .join('');
  $('[data-monitor]').setAttribute('aria-label', d.monitor);
  paintEditor();
}

/* ── Abrir / executar ─────────────────────────────────── */

let lastTrigger: HTMLElement | null = null;
let runs = 0;
let resultsHidden = false;

const panel = () => $<HTMLElement>('[data-console]');
const input = () => $<HTMLTextAreaElement>('[data-console-input]');
export const consoleOpen = () => !panel().hidden;

function paintEditor() {
  $('[data-console-hl]').innerHTML = tokensHtml(tokenize(input().value)) + '\n';
}

export function openConsole(sql?: string, autorun = false) {
  lastTrigger = document.activeElement as HTMLElement;
  const p = panel();
  if (sql !== undefined) input().value = sql;
  else if (!input().value) input().value = flat(currentScene().query()).map(([, t]) => t).join('').replace(/ {2,}/g, ' ');
  paintEditor();
  if (p.hidden) {
    p.hidden = false;
    document.documentElement.classList.add('has-console');
    if (!reduced) gsap.fromTo(p, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' });
    // Pré-aquece o motor enquanto o visitante lê/escreve.
    import('./sqlengine').then((m) => m.loadEngine()).catch(() => {});
  }
  input().focus({ preventScroll: true });
  if (autorun) runQuery();
}

export function closeConsole() {
  const p = panel();
  if (p.hidden) return;
  const done = () => {
    p.hidden = true;
    document.documentElement.classList.remove('has-console');
    gsap.set(p, { clearProps: 'transform' });
    lastTrigger?.focus?.({ preventScroll: true });
  };
  if (reduced) done();
  else gsap.to(p, { yPercent: 100, duration: 0.35, ease: 'power2.in', onComplete: done });
}

async function runQuery() {
  const sql = input().value;
  if (!sql.trim()) return;
  const d = s();
  const status = $<HTMLElement>('[data-console-status]');
  status.textContent = d.loading;
  status.dataset.state = 'run';
  // A barra de query mostra a consulta do visitante (e conta como uma query executada).
  setScene({ id: `console:${++runs}`, query: () => flat(tokenize(sql)), status: () => status.textContent ?? '' });
  try {
    const engine = await import('./sqlengine');
    const res = await engine.run(sql);
    const failed = res.messages.some((m) => m.error);
    const total = res.sets.reduce((n, set) => n + set.rows.length, 0);
    const extra: string[] = [];
    if (res.projectIds && !failed) {
      setProjectFilter(res.projectIds, sql);
      if (!document.querySelector<HTMLElement>('[data-proj-filter]')!.hidden) extra.push(d.filtered);
    }
    renderResult(res);
    renderMessages(res, extra);
    showTab(failed || !res.sets.length ? 'messages' : 'results');
    status.textContent = `${failed ? d.err : d.ok}  ·  ${d.rows(total)}  ·  ${(res.ms / 1000).toFixed(3)} s`;
    status.dataset.state = failed ? 'err' : 'ok';
  } catch (e) {
    status.textContent = `${d.err} ${(e as Error).message}`;
    status.dataset.state = 'err';
  }
  paintQbar(); // status final na barra (sem contar outra query)
}

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function initConsole() {
  renderConsole();

  input().addEventListener('input', paintEditor);
  input().addEventListener('scroll', () => {
    const hl = $<HTMLElement>('.console__hl');
    hl.scrollTop = input().scrollTop;
    hl.scrollLeft = input().scrollLeft;
  });
  $('[data-console-run]').addEventListener('click', runQuery);
  $('[data-console-close]').addEventListener('click', closeConsole);
  $('[data-console-examples]').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-example]');
    if (b) openConsole(b.dataset.example!, true);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-console-tab]').forEach((b) =>
    b.addEventListener('click', () => showTab(b.dataset.consoleTab as 'results' | 'messages')),
  );
  document.querySelectorAll('[data-action="console"]').forEach((b) => b.addEventListener('click', () => (consoleOpen() ? closeConsole() : openConsole())));
  $('[data-monitor]').addEventListener('click', () => openConsole(MONITOR_SQL, true));

  addEventListener('keydown', (e) => {
    const open = consoleOpen();
    const inConsole = open && panel().contains(document.activeElement);
    if (open && (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter'))) {
      e.preventDefault();
      runQuery();
      return;
    }
    if (inConsole && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      resultsHidden = !resultsHidden;
      panel().classList.toggle('is-collapsed', resultsHidden);
      return;
    }
    if (open && e.key === 'Escape') {
      e.preventDefault();
      closeConsole();
      return;
    }
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') {
      e.preventDefault();
      openConsole();
    } else if (e.key === '?') {
      e.preventDefault();
      openConsole();
      renderShortcuts();
    } else if (e.key === 'F5' && !open) {
      // Fora do console, F5 é "executar" (como no SSMS) só se há um artefato de projeto na tela.
      const replay = [...document.querySelectorAll<HTMLElement>('#projetos [data-replay]')].find((b) => {
        const r = b.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && b.offsetParent !== null;
      });
      if (replay) {
        e.preventDefault();
        replay.click();
      }
    }
  });
}
