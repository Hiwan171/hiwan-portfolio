/**
 * Artefato 1: terminal do cadastrador (view SQL → API do Uplog).
 * Números: o único dado real é ~10 s por registro vs 5–10 min manual. O lote de 50, ids e endpoint
 * são ilustrativos (dito na própria janela). Tempo acelerado.
 */
import { gsap } from 'gsap';
import { dict, currentLang } from '../i18n';
import type { Mounted } from '../projects';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = 50;
// Tempos por registro (s), determinísticos, média exata de 10,0 s → total 8 min 20 s.
const TIMES = Array.from({ length: N }, (_, i) => 10 + [-0.2, 0.1, -0.1, 0.3, -0.3, 0.2][i % 6]);

const L = {
  pt: {
    title: 'terminal — cadastrador.py',
    cmd: 'python cadastrador.py --origem dbo.vw_cadastro_migracao --lote 50',
    ep: '/clientes',
    conn: 'conectando ao SQL Server',
    read: 'lendo dbo.vw_cadastro_migracao',
    regs: 'registros',
    auth: 'autenticando na API do Uplog',
    fast: '⋯ acelerando a exibição',
    done: 'registros cadastrados',
    time: 'tempo',
    manual: 'manual estimado (5–10 min cada)',
    faster: '≈ 30 a 60× mais rápido',
  },
  en: {
    title: 'terminal — loader.py',
    cmd: 'python loader.py --source dbo.vw_migration_records --batch 50',
    ep: '/customers',
    conn: 'connecting to SQL Server',
    read: 'reading dbo.vw_migration_records',
    regs: 'records',
    auth: 'authenticating with the Uplog API',
    fast: '⋯ fast-forwarding output',
    done: 'records created',
    time: 'time',
    manual: 'manual estimate (5–10 min each)',
    faster: '≈ 30 to 60× faster',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');
const num = (v: number) => v.toLocaleString(document.documentElement.lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function mountTerminal(host: HTMLElement): Mounted {
  const lang = currentLang();
  const s = L[lang];
  const t = dict[lang].text;
  // Telas estreitas: pontilhados curtos e resumo quebrado em pontos pensados (não no meio de "8 h 20 min").
  const compact = host.clientWidth < 520;
  const dots = (label: string) => label + ' ' + '.'.repeat(Math.max(2, (compact ? 0 : 38) - label.length)) + ' ';

  host.innerHTML = `
    <div class="win win--term">
      <div class="win__bar"><span>${s.title}</span><span>python 3.12</span></div>
      <pre class="term" aria-hidden="true"></pre>
      <p class="sr-only">${s.done}: ${N}. ${s.faster}.</p>
      <div class="win__foot">
        <span class="win__note">${t['case.note']}</span>
        <button class="sbtn sbtn--ghost" type="button" data-replay>${t['case.replay']}</button>
      </div>
    </div>`;
  const term = host.querySelector<HTMLElement>('.term')!;
  let tl: gsap.core.Timeline | null = null;

  const line = (html = '') => {
    const el = document.createElement('div');
    el.className = 'term__l';
    el.innerHTML = html || '&nbsp;';
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    return el;
  };
  const rec = (i: number) =>
    `<span class="d">[${pad(i + 1)}/${N}]</span> POST ${s.ep}  <span class="d">#${10482 + i * 7}</span>  <span class="ok">✓ 201</span>  <span class="d">${num(TIMES[i])} s</span>`;
  const bar = (k: number) => {
    const w = 24, f = Math.round((k / N) * w);
    return `<span class="ok">${'█'.repeat(f)}</span><span class="d">${'░'.repeat(w - f)}</span>  ${pad(k)}/${N}`;
  };
  const summary = () => {
    line();
    if (compact) {
      line(`<span class="ok">✓ ${N} ${s.done}</span>`);
      line(`  <span class="d">${s.time}:</span> 8 min 20 s`);
      line(`  <span class="d">${s.manual}:</span>`);
      line(`  4 h 10 min – 8 h 20 min`);
    } else {
      line(`<span class="ok">✓ ${N} ${s.done}</span>   <span class="d">${s.time}:</span> 8 min 20 s`);
      line(`  <span class="d">${s.manual}:</span> 4 h 10 min – 8 h 20 min`);
    }
    line(`  <span class="acc">${s.faster}</span>`);
    line(`<span class="pr">$</span> <span class="caret"></span>`);
  };

  const run = () => {
    tl?.kill();
    term.innerHTML = '';
    if (reduced) {
      line(`<span class="pr">$</span> ${s.cmd}`);
      line(`<span class="d">→</span> ${dots(s.conn)}<span class="ok">ok</span>`);
      line(`<span class="d">→</span> ${dots(s.read)}${N} ${s.regs}`);
      line(`<span class="d">→</span> ${dots(s.auth)}<span class="ok">ok</span>`);
      for (let i = 0; i < 3; i++) line(rec(i));
      line(bar(N));
      return summary();
    }
    const cmd = { n: 0 };
    let cmdEl: HTMLElement;
    let barEl: HTMLElement;
    tl = gsap.timeline();
    tl.call(() => (cmdEl = line(`<span class="pr">$</span> <span class="caret"></span>`)))
      .to(cmd, {
        n: s.cmd.length, duration: 0.9, ease: 'none',
        onUpdate: () => (cmdEl.innerHTML = `<span class="pr">$</span> ${s.cmd.slice(0, Math.round(cmd.n))}<span class="caret"></span>`),
      })
      .call(() => (cmdEl.innerHTML = `<span class="pr">$</span> ${s.cmd}`), undefined, '+=0.15')
      .call(() => line(`<span class="d">→</span> ${dots(s.conn)}<span class="ok">ok</span>`), undefined, '+=0.25')
      .call(() => line(`<span class="d">→</span> ${dots(s.read)}${N} ${s.regs}`), undefined, '+=0.3')
      .call(() => line(`<span class="d">→</span> ${dots(s.auth)}<span class="ok">ok</span>`), undefined, '+=0.3')
      .call(() => line(), undefined, '+=0.1');
    for (let i = 0; i < 6; i++) tl.call(() => line(rec(i)), undefined, '+=0.26');
    tl.call(() => line(`<span class="d">${s.fast}</span>`), undefined, '+=0.3')
      .call(() => (barEl = line(bar(6))), undefined, '+=0.2');
    const k = { v: 6 };
    tl.to(k, { v: N, duration: 1.8, ease: 'power1.inOut', onUpdate: () => (barEl.innerHTML = bar(Math.round(k.v))) })
      .call(summary, undefined, '+=0.2');
  };

  // R2: antes de rodar, um prompt esperando (não uma janela preta vazia).
  line(`<span class="pr">$</span> <span class="caret"></span>`);

  host.querySelector('[data-replay]')!.addEventListener('click', run);
  return {
    play: run,
    destroy() {
      tl?.kill();
      host.innerHTML = '';
    },
  };
}
