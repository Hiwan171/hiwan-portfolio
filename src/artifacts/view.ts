/**
 * Artefato 3: view SQL de gestão → resultado → exportar .xls.
 * Real: views em SQL Server com joins e CASE, entregues em .xls. Esquema e dados: fictícios.
 */
import { gsap } from 'gsap';
import { currentLang, type Tok } from '../i18n';
import type { Mounted } from '../projects';
import { tokensHtml } from '../qbar';
import { winHtml, reducedMotion } from './win';

const k = (t: string): Tok => ['k', t];
const i = (t: string): Tok => ['i', t];
const p = (t: string): Tok => ['p', t];
const s = (t: string): Tok => ['s', t];
const sp = (t: string): Tok => ['t', t];

const L = {
  pt: {
    title: 'vw_contas_pagar_gestao.sql',
    meta: 'SQL Server',
    view: 'dbo.vw_contas_pagar_gestao',
    cols: ['fornecedor', 'vencimento', 'valor', 'situacao', 'centro_custo'],
    sit: { pago: 'pago', venc: 'vencido', aven: 'a vencer' },
    rows: [
      ['Fornecedor Alfa Ltda', '05/11', 'R$ 12.480,00', 'pago', 'Logística'],
      ['Beta Transportes', '08/11', 'R$ 3.912,50', 'venc', 'Frota'],
      ['Gama Ambiental', '12/11', 'R$ 27.300,00', 'aven', 'Destinação'],
      ['Delta EPIs', '14/11', 'R$ 1.845,90', 'aven', 'SESMT'],
      ['Épsilon Combustíveis', '18/11', 'R$ 9.770,00', 'aven', 'Frota'],
      ['Zeta Laboratório', '21/11', 'R$ 4.200,00', 'aven', 'Qualidade'],
    ],
    exec: 'executando…',
    ok: '6 linhas · 0,021 s',
    export: 'Exportar .xls',
    saved: 'salvo para a diretoria',
    note: 'esquema e dados fictícios',
    sr: 'Simulação: uma view SQL com joins e regras em CASE é criada, consultada e exportada para Excel.',
  },
  en: {
    title: 'vw_payables_management.sql',
    meta: 'SQL Server',
    view: 'dbo.vw_payables_management',
    cols: ['supplier', 'due', 'amount', 'status', 'cost_center'],
    sit: { pago: 'paid', venc: 'overdue', aven: 'upcoming' },
    rows: [
      ['Alpha Supplies Ltd', 'Nov 05', 'R$ 12,480.00', 'pago', 'Logistics'],
      ['Beta Transport', 'Nov 08', 'R$ 3,912.50', 'venc', 'Fleet'],
      ['Gamma Environmental', 'Nov 12', 'R$ 27,300.00', 'aven', 'Disposal'],
      ['Delta PPE', 'Nov 14', 'R$ 1,845.90', 'aven', 'Safety'],
      ['Epsilon Fuels', 'Nov 18', 'R$ 9,770.00', 'aven', 'Fleet'],
      ['Zeta Lab', 'Nov 21', 'R$ 4,200.00', 'aven', 'Quality'],
    ],
    exec: 'running…',
    ok: '6 rows · 0.021 s',
    export: 'Export .xls',
    saved: 'saved for the board',
    note: 'fictional schema and data',
    sr: 'Simulation: a SQL view with joins and CASE rules is created, queried and exported to Excel.',
  },
};

function viewSql(lang: 'pt' | 'en'): Tok[] {
  const c = L[lang].cols;
  const [paid, over, up] = lang === 'pt' ? ['pago', 'vencido', 'a vencer'] : ['paid', 'overdue', 'upcoming'];
  return [
    k('CREATE VIEW'), sp(' '), i(L[lang].view), sp(' '), k('AS'), sp('\n'),
    k('SELECT'), sp('\n'),
    sp('    '), i('f.nome'), sp('            '), k('AS'), sp(' '), i(c[0]), p(','), sp('\n'),
    sp('    '), i('cp.vencimento'), sp('     '), k('AS'), sp(' '), i(c[1]), p(','), sp('\n'),
    sp('    '), i('cp.valor'), sp('          '), k('AS'), sp(' '), i(c[2]), p(','), sp('\n'),
    sp('    '), k('CASE'), sp('\n'),
    sp('        '), k('WHEN'), sp(' '), i('cp.pago'), sp(' '), p('='), sp(' '), s('1'), sp('                '), k('THEN'), sp(' '), s(`'${paid}'`), sp('\n'),
    sp('        '), k('WHEN'), sp(' '), i('cp.vencimento'), sp(' '), p('<'), sp(' '), k('GETDATE'), p('()'), sp(' '), k('THEN'), sp(' '), s(`'${over}'`), sp('\n'),
    sp('        '), k('ELSE'), sp(' '), s(`'${up}'`), sp('\n'),
    sp('    '), k('END'), sp('               '), k('AS'), sp(' '), i(c[3]), p(','), sp('\n'),
    sp('    '), i('cc.descricao'), sp('      '), k('AS'), sp(' '), i(c[4]), sp('\n'),
    k('FROM'), sp(' '), i('dbo.contas_pagar'), sp(' '), i('cp'), sp('\n'),
    k('JOIN'), sp(' '), i('dbo.fornecedores'), sp('  '), i('f'), sp('  '), k('ON'), sp(' '), i('f.id'), sp('  '), p('='), sp(' '), i('cp.fornecedor_id'), sp('\n'),
    k('JOIN'), sp(' '), i('dbo.centros_custo'), sp(' '), i('cc'), sp(' '), k('ON'), sp(' '), i('cc.id'), sp(' '), p('='), sp(' '), i('cp.centro_custo_id'), p(';'),
  ];
}

export function mountView(host: HTMLElement): Mounted {
  const lang = currentLang();
  const s0 = L[lang];
  const sql = viewSql(lang);
  const total = sql.reduce((n, [, t]) => n + t.length, 0);
  const select: Tok[] = [k('SELECT'), sp(' '), p('*'), sp(' '), k('FROM'), sp(' '), i(s0.view), p(';')];

  host.innerHTML = winHtml({
    cls: 'win--view',
    title: s0.title,
    meta: s0.meta,
    note: s0.note,
    sr: s0.sr,
    body: `
      <pre class="v__code" aria-hidden="true"><code data-k="code"></code></pre>
      <div class="v__run" aria-hidden="true"><code data-k="select"></code><span class="v__st" data-k="st"></span></div>
      <div class="v__grid" data-k="grid" aria-hidden="true"></div>
      <div class="v__export">
        <span class="v__file" data-k="file"></span>
        <span class="sbtn sbtn--primary v__btn" data-k="btn" aria-hidden="true">${s0.export}</span>
      </div>`,
  });

  const $ = (key: string) => host.querySelector<HTMLElement>(`[data-k="${key}"]`)!;
  const caret = '<span class="caret"></span>';
  const grid = () =>
    `<table><thead><tr>${s0.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${s0.rows
      .map((r) => `<tr>${r.map((v, j) => (j === 3 ? `<td><span class="v__chip is-${v}">${s0.sit[v as keyof typeof s0.sit]}</span></td>` : `<td>${v}</td>`)).join('')}</tr>`)
      .join('')}</tbody></table>`;

  let tl: gsap.core.Timeline | null = null;
  // R2: o rodapé "Exportar .xls" só existe depois que há resultado para exportar.
  const exportRow = host.querySelector<HTMLElement>('.v__export')!;
  const reset = () => {
    exportRow.classList.remove('is-on');
    $('code').innerHTML = '';
    host.querySelector<HTMLElement>('.v__code')!.scrollTop = 0;
    $('select').innerHTML = '';
    $('st').textContent = '';
    $('grid').innerHTML = '';
    $('file').textContent = '';
    $('btn').classList.remove('is-pressed');
  };
  // O editor rola junto com o cursor: a última linha digitada fica sempre visível.
  const follow = () => {
    const pre = host.querySelector<HTMLElement>('.v__code')!;
    pre.scrollTop = pre.scrollHeight - pre.clientHeight;
  };
  const final = () => {
    $('code').innerHTML = tokensHtml(sql);
    requestAnimationFrame(follow);
    $('select').innerHTML = tokensHtml(select);
    $('st').textContent = `✓ ${s0.ok}`;
    $('grid').innerHTML = grid();
    exportRow.classList.add('is-on');
    $('file').innerHTML = `<b>${s0.view.replace('dbo.', '')}.xlsx</b> · ${s0.saved}`;
  };

  const run = () => {
    tl?.kill();
    reset();
    if (reducedMotion()) return final();
    const t = { n: 0, m: 0 };
    tl = gsap.timeline();
    tl.to(t, { n: total, duration: 3.4, ease: 'none', onUpdate: () => { $('code').innerHTML = tokensHtml(sql, Math.round(t.n)) + caret; follow(); } })
      .call(() => { $('code').innerHTML = tokensHtml(sql); follow(); })
      .to(t, { m: 30, duration: 0.5, ease: 'none', onUpdate: () => ($('select').innerHTML = tokensHtml(select, Math.round(t.m)) + caret) }, '+=0.25')
      .call(() => { $('select').innerHTML = tokensHtml(select); $('st').textContent = s0.exec; })
      .call(() => {
        $('st').textContent = `✓ ${s0.ok}`;
        $('grid').innerHTML = grid();
        exportRow.classList.add('is-on');
        gsap.from(host.querySelectorAll('.v__grid tbody tr'), { opacity: 0, x: -6, duration: 0.4, stagger: 0.06, ease: 'expo.out' });
      }, undefined, '+=0.35')
      .call(() => $('btn').classList.add('is-pressed'), undefined, '+=1')
      .call(() => {
        $('btn').classList.remove('is-pressed');
        $('file').innerHTML = `<b>${s0.view.replace('dbo.', '')}.xlsx</b> · ${s0.saved}`;
        gsap.from($('file'), { opacity: 0, x: 8, duration: 0.5, ease: 'expo.out' });
      }, undefined, '+=0.18');
  };

  // R2: quadro zero = janela de consulta nova, cursor piscando (antes: editor e grade em branco).
  $('code').innerHTML = caret;

  host.querySelector('[data-replay]')!.addEventListener('click', run);
  return { play: run, destroy() { tl?.kill(); host.innerHTML = ''; } };
}
