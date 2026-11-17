/**
 * Motor do console: SQLite de verdade (sql.js/WebAssembly), carregado só quando o console abre,
 * com sotaque de SQL Server: schema `dbo.`, `TOP n`, `GETDATE()`, `LEN()`, `@@SPID`, `N'…'`,
 * e erros no formato `Msg 207, Nível 16…`. O visitante entra só com permissão de leitura.
 *
 * Tabelas (nomes no idioma da página, iguais às queries da barra):
 *   dbo.hiwan · dbo.projetos/projects · dbo.trajetoria/career · dbo.contato/contact · sys.dm_exec_sessions
 * Dados: os mesmos da página (fatos confirmados). O ano do envio de e-mail não foi informado → NULL.
 */
import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { dict, currentLang, type Lang } from './i18n';
import { pathData } from './path-data';
import { CHANNELS } from './contact';
import { sessionId, sessionRow } from './telemetry';
import { queriesExecuted } from './qbar';

export type ResultSet = { cols: string[]; rows: SqlValue[][] };
export type RunResult = {
  sets: ResultSet[];
  messages: { text: string; error?: boolean }[];
  ms: number;
  /** ids de dbo.projetos que a última consulta selecionou (para filtrar a lista da página). */
  projectIds?: number[];
};

/** Ano de cada caso, na ordem da lista (docs/01-cases.md; e-mail: não informado). */
const PROJECT_YEARS: (number | null)[] = [2026, null, 2024, 2022, 2026];

const T = {
  pt: {
    projects: 'projetos', cols: ['id', 'projeto', 'area', 'stack', 'resultado', 'impacto', 'ano'],
    path: 'trajetoria', pcols: ['ano', 'tipo', 'evento', 'onde'],
    contact: 'contato', ccols: ['canal', 'endereco'],
    focus: ['foco', 'sistemas'],
    affected: (n: number) => `(${n} ${n === 1 ? 'linha afetada' : 'linhas afetadas'})`,
    done: 'Horário de conclusão',
    level: 'Nível', state: 'Estado', line: 'Linha',
    e207: (x: string) => `Nome de coluna '${x}' inválido.`,
    e208: (x: string) => `Nome de objeto '${x}' inválido.`,
    e102: (x: string) => `Sintaxe incorreta próxima a '${x}'.`,
    e102end: 'Sintaxe incorreta: a instrução terminou antes do esperado.',
    e195: (x: string) => `'${x}' não é um nome de função interna reconhecido.`,
    e209: (x: string) => `Nome de coluna ambíguo '${x}'.`,
    e229: (op: string, obj: string) => `A permissão ${op} foi negada no objeto '${obj}', banco de dados 'hiwan', esquema 'dbo'.`,
    e262: (op: string) => `A permissão ${op} foi negada no banco de dados 'hiwan'.`,
    e3701: (x: string) => `Não é possível remover a tabela '${x}' porque ela não existe ou você não tem permissão.`,
    e2812: (x: string) => `Não foi possível encontrar o procedimento armazenado '${x}'.`,
    readonly: "(o visitante tem só permissão de leitura; para falar comigo, use os links da seção dbo.contato)",
    insertNote: '(gravado só nesta aba: nada é enviado. Para falar comigo de verdade, use os links da seção dbo.contato.)',
    version: 'SQLite 3 (WebAssembly) com sotaque de SQL Server — hiwan.db',
  },
  en: {
    projects: 'projects', cols: ['id', 'project', 'area', 'stack', 'outcome', 'impact', 'year'],
    path: 'career', pcols: ['year', 'kind', 'event', 'place'],
    contact: 'contact', ccols: ['channel', 'address'],
    focus: ['focus', 'systems'],
    affected: (n: number) => `(${n} ${n === 1 ? 'row affected' : 'rows affected'})`,
    done: 'Completion time',
    level: 'Level', state: 'State', line: 'Line',
    e207: (x: string) => `Invalid column name '${x}'.`,
    e208: (x: string) => `Invalid object name '${x}'.`,
    e102: (x: string) => `Incorrect syntax near '${x}'.`,
    e102end: 'Incorrect syntax: the statement ended unexpectedly.',
    e195: (x: string) => `'${x}' is not a recognized built-in function name.`,
    e209: (x: string) => `Ambiguous column name '${x}'.`,
    e229: (op: string, obj: string) => `The ${op} permission was denied on the object '${obj}', database 'hiwan', schema 'dbo'.`,
    e262: (op: string) => `${op} permission denied in database 'hiwan'.`,
    e3701: (x: string) => `Cannot drop the table '${x}', because it does not exist or you do not have permission.`,
    e2812: (x: string) => `Could not find stored procedure '${x}'.`,
    readonly: "(guests are read-only; to reach me, use the links in dbo.contact)",
    insertNote: '(stored in this tab only: nothing is sent. To actually reach me, use the links in dbo.contact.)',
    version: 'SQLite 3 (WebAssembly) with a SQL Server accent — hiwan.db',
  },
};

export const tableNames = (lang: Lang = currentLang()) => ({
  projects: `dbo.${T[lang].projects}`,
  path: `dbo.${T[lang].path}`,
  contact: `dbo.${T[lang].contact}`,
  hiwan: 'dbo.hiwan',
  sessions: 'sys.dm_exec_sessions',
});

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dbLang: Lang | null = null;

/** Carrega o sql.js sob demanda (o wasm só baixa quando o console abre). */
export async function loadEngine() {
  if (!SQL) {
    const init = (await import('sql.js')).default;
    SQL = await init({ locateFile: () => wasmUrl });
  }
  if (!db || dbLang !== currentLang()) build();
}

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

function build() {
  const lang = currentLang();
  const t = T[lang];
  const d = dict[lang];
  db?.close();
  db = new SQL!.Database();
  dbLang = lang;
  db.exec("ATTACH DATABASE ':memory:' AS dbo; ATTACH DATABASE ':memory:' AS sys;");

  // Funções com nome de SQL Server
  db.create_function('GETDATE', () => {
    const n = new Date();
    const p = (x: number) => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
  });
  db.create_function('LEN', (s: SqlValue) => (s === null ? null : String(s).length));
  db.create_function('ISNULL', (a: SqlValue, b: SqlValue) => (a === null ? b : a));

  const insert = (table: string, cols: string[], rows: SqlValue[][]) => {
    db!.run(`CREATE TABLE ${table} (${cols.map(q).join(', ')})`);
    const st = db!.prepare(`INSERT INTO ${table} VALUES (${cols.map(() => '?').join(', ')})`);
    rows.forEach((r) => st.run(r));
    st.free();
  };

  // dbo.hiwan — a linha do hero (+ foco, para a query do hero rodar igual aqui)
  insert('dbo.hiwan', [...d.result.cols.map((c) => c.name), t.focus[0]], [[...d.result.row, t.focus[1]]]);

  // dbo.projetos — impacto = ordem da lista (5 → 1), para o ORDER BY impacto DESC da barra
  const n = d.projects.rows.length;
  insert(`dbo.${t.projects}`, t.cols, d.projects.rows.map((r, i) => [i + 1, r.name, r.area, r.stack, r.result, n - i, PROJECT_YEARS[i] ?? null]));

  // dbo.trajetoria — uma linha por evento
  const p = pathData[lang];
  insert(`dbo.${t.path}`, t.pcols, p.years.flatMap((y) => y.items.map((it) => [y.year, p.kinds[it.kind], it.title, it.where])));

  // dbo.contato
  insert(`dbo.${t.contact}`, t.ccols, CHANNELS.map((c) => [c.k, c.k === 'email' ? c.value : c.href]));

  // sys.dm_exec_sessions — atualizada antes de cada execução
  const row = sessionRow(queriesExecuted());
  db.run(`CREATE TABLE sys.dm_exec_sessions (${Object.keys(row).map(q).join(', ')})`);
}

function refreshSession() {
  const row = sessionRow(queriesExecuted());
  db!.run('DELETE FROM sys.dm_exec_sessions');
  db!.run(`INSERT INTO sys.dm_exec_sessions VALUES (${Object.keys(row).map(() => '?').join(', ')})`, Object.values(row) as SqlValue[]);
}

/* ── Tradução T-SQL → SQLite ──────────────────────────── */

function translate(sql: string) {
  let s = sql.replace(/^\s*GO\s*$/gim, '');
  s = s.replace(/@@SPID/gi, String(sessionId()));
  s = s.replace(/@@VERSION/gi, `'${T[currentLang()].version}'`);
  s = s.replace(/\bN'/g, "'");
  // SELECT [DISTINCT] TOP (n) … → SELECT [DISTINCT] … LIMIT n
  const top = s.match(/^\s*SELECT\s+(DISTINCT\s+)?TOP\s*\(?\s*(\d+)\s*\)?\s+/i);
  if (top) {
    s = s.replace(top[0], `SELECT ${top[1] ?? ''}`).replace(/;?\s*$/, '');
    if (!/\bLIMIT\s+\d+\s*$/i.test(s)) s += ` LIMIT ${top[2]}`;
  }
  return s;
}

/* ── Permissões (visitante = leitura) ─────────────────── */

function denied(stmt: string): string | null {
  const t = T[currentLang()];
  const m = stmt.trim().match(/^(\w+)(?:\s+(?:TABLE|INTO|FROM|VIEW|PROCEDURE|PROC|DATABASE))?\s*([\w.[\]"]+)?/i);
  if (!m) return null;
  const op = m[1].toUpperCase();
  const obj = (m[2] ?? '').replace(/[[\]"]/g, '').replace(/^dbo\./i, '');
  if (op === 'SELECT' || op === 'WITH' || op === 'VALUES') return null;
  if (op === 'INSERT' && new RegExp(`^(dbo\\.)?${t.contact}$`, 'i').test((m[2] ?? '').replace(/[[\]"]/g, ''))) return null;
  const line = (n: number, lvl: number, msg: string) => `Msg ${n}, ${t.level} ${lvl}, ${t.state} 1, ${t.line} 1\n${msg}`;
  if (op === 'DROP') return line(3701, 11, t.e3701(obj || '?'));
  if (['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'MERGE'].includes(op)) return line(229, 14, t.e229(op === 'TRUNCATE' ? 'ALTER' : op, obj || '?'));
  if (op === 'CREATE' || op === 'ALTER') return line(262, 14, t.e262(`${op} TABLE`));
  if (op === 'EXEC' || op === 'EXECUTE') return line(2812, 16, t.e2812(obj || '?'));
  return line(102, 15, t.e102(m[1]));
}

function mapError(message: string) {
  const t = T[currentLang()];
  const line = (n: number, lvl: number, msg: string) => `Msg ${n}, ${t.level} ${lvl}, ${t.state} 1, ${t.line} 1\n${msg}`;
  let m: RegExpMatchArray | null;
  if ((m = message.match(/no such column: (.+)/))) return line(207, 16, t.e207(m[1]));
  if ((m = message.match(/no such table: (.+)/))) return line(208, 16, t.e208(m[1]));
  if ((m = message.match(/near "(.+?)": syntax error/))) return line(102, 15, t.e102(m[1]));
  if (/incomplete input/.test(message)) return line(102, 15, t.e102end);
  if ((m = message.match(/no such function: (.+)/))) return line(195, 15, t.e195(m[1]));
  if ((m = message.match(/ambiguous column name: (.+)/))) return line(209, 16, t.e209(m[1]));
  return line(50000, 16, message);
}

/** Divide em instruções no `;` (fora de aspas). */
function split(sql: string) {
  const out: string[] = [];
  let cur = '', inStr = false;
  for (const ch of sql) {
    if (ch === "'") inStr = !inStr;
    if (ch === ';' && !inStr) { if (cur.trim()) out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** Ids de projetos selecionados por uma consulta simples em dbo.projetos (para filtrar a página). */
function projectIdsFor(stmt: string): number[] | undefined {
  const table = T[currentLang()].projects;
  const re = new RegExp(`^\\s*SELECT\\s+(?:DISTINCT\\s+)?(.+?)\\s+FROM\\s+((?:dbo\\.)?${table})\\b([\\s\\S]*)$`, 'i');
  const m = stmt.match(re);
  if (!m || /\b(JOIN|GROUP\s+BY|UNION|HAVING)\b/i.test(m[3]) || /\b(COUNT|SUM|AVG|MIN|MAX|STRING_AGG)\s*\(/i.test(m[1])) return;
  try {
    const r = db!.exec(`SELECT id FROM ${m[2]} ${m[3]}`);
    return r.length ? r[0].values.map((v) => Number(v[0])) : [];
  } catch {
    return;
  }
}

export async function run(sql: string): Promise<RunResult> {
  await loadEngine();
  const t = T[currentLang()];
  const t0 = performance.now();
  const res: RunResult = { sets: [], messages: [], ms: 0 };
  refreshSession();
  for (const raw of split(sql)) {
    const stmt = translate(raw);
    if (!stmt.trim()) continue;
    const deny = denied(stmt);
    if (deny) {
      res.messages.push({ text: deny, error: true });
      if (/^Msg (229|262|3701)/.test(deny)) res.messages.push({ text: t.readonly });
      break; // como no SSMS: erro interrompe o lote
    }
    try {
      const out = db!.exec(stmt);
      out.forEach((r) => {
        res.sets.push({ cols: r.columns, rows: r.values });
        res.messages.push({ text: t.affected(r.values.length) });
      });
      if (!out.length) {
        // getRowsModified() = linhas da ÚLTIMA instrução (não é cumulativo)
        res.messages.push({ text: t.affected(db!.getRowsModified()) });
        if (/^\s*INSERT/i.test(stmt)) res.messages.push({ text: t.insertNote });
      }
      const ids = projectIdsFor(stmt);
      if (ids) res.projectIds = ids;
    } catch (e) {
      res.messages.push({ text: mapError((e as Error).message), error: true });
      break;
    }
  }
  res.ms = performance.now() - t0;
  res.messages.push({ text: `${t.done}: ${new Date().toISOString()}` });
  return res;
}
