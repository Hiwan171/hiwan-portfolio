/**
 * Seção 4 — contato (só links, decisão do Hiwan 17/11/2026) + final do site + rodapé.
 *
 *  - Barra de query: INSERT INTO dbo.contato … VALUES (email), (linkedin), (github) → ✓ 3 linhas afetadas.
 *  - Canais como linhas de resultado (mesma linguagem da lista de projetos); e-mail tem "copiar".
 *  - COMMIT: a barra mostra COMMIT TRANSACTION; a linha lima da tela de conexão volta, sobe e
 *    "desconecta" a sessão (o ponto do topo apaga). O site começa conectando e termina desconectando.
 *  - Rodapé = barra de status do SSMS: tempo real de sessão + quantas queries a navegação executou.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { dict, currentLang, type Tok } from './i18n';
import { goScene, scenes, currentScene, queriesExecuted, type Scene } from './qbar';
import { jump } from './jump';
import { portraitState } from './portrait';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const EMAIL = 'hiwan799@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/hiwan-alves-6bbb58369/';
const GITHUB = 'https://github.com/Hiwan171';

const L = {
  pt: {
    table: 'dbo.contato', cols: ['canal', 'endereco'],
    title: 'A próxima query é sua.',
    sub: 'Sistemas web, mobile e desktop, dashboards, análise de dados e automações. Me conte o problema.',
    affected: '3 linhas afetadas',
    copy: 'copiar', copied: 'copiado ✓',
    commitHint: 'confirma a transação e encerra a sessão',
    endTitle: 'Sessão encerrada.', endText: 'Obrigado pela visita.', reconnect: '↺ reconectar',
    commitOk: '✓ transação confirmada',
    ok: 'Consulta executada com êxito', closed: 'Sessão encerrada', user: 'visitante', queries: 'queries', query1: 'query',
    sr: { email: 'Enviar e-mail para', linkedin: 'Perfil no LinkedIn:', github: 'Perfil no GitHub:' },
  },
  en: {
    table: 'dbo.contact', cols: ['channel', 'address'],
    title: 'The next query is yours.',
    sub: 'Web, mobile and desktop systems, dashboards, data analysis and automation. Tell me the problem.',
    affected: '3 rows affected',
    copy: 'copy', copied: 'copied ✓',
    commitHint: 'commits the transaction and ends the session',
    endTitle: 'Session closed.', endText: 'Thanks for visiting.', reconnect: '↺ reconnect',
    commitOk: '✓ transaction committed',
    ok: 'Query executed successfully', closed: 'Session closed', user: 'guest', queries: 'queries', query1: 'query',
    sr: { email: 'Send an email to', linkedin: 'LinkedIn profile:', github: 'GitHub profile:' },
  },
};

export const CHANNELS = [
  { k: 'email', href: `mailto:${EMAIL}`, value: EMAIL, key: EMAIL, ext: false },
  { k: 'linkedin', href: LINKEDIN, value: 'Hiwan Alves', key: 'in/hiwan-alves', ext: true },
  { k: 'github', href: GITHUB, value: 'hiwan171', key: 'hiwan171', ext: true },
] as const;

const s = () => L[currentLang()];

export const contactScene: Scene = {
  id: 'contact',
  query: () => {
    const d = s();
    const vals = CHANNELS.flatMap((c, i): Tok[] => [
      ...(i ? ([['p', ', ']] as Tok[]) : []),
      ['p', '('], ['s', `'${c.k}'`], ['p', ', '], ['s', `'${c.key}'`], ['p', ')'],
    ]);
    return [
      ['k', 'INSERT INTO'], ['t', ' '], ['i', d.table], ['t', ' '], ['p', '('], ['i', d.cols[0]], ['p', ', '], ['i', d.cols[1]], ['p', ')'],
      ['t', ' '], ['k', 'VALUES'], ['t', ' '], ...vals, ['p', ';'],
    ];
  },
  status: () => `✓ ${s().affected}`,
};

const commitScene: Scene = {
  id: 'commit',
  query: () => [['k', 'COMMIT TRANSACTION'], ['p', ';']],
  status: () => s().commitOk,
};

/* ── Render ───────────────────────────────────────────── */

export function renderContact() {
  const d = s();
  $('[data-contact-table]').textContent = d.table;
  $('[data-contact-count]').textContent = d.affected;
  $('[data-contact-title]').textContent = d.title;
  $('[data-contact-sub]').textContent = d.sub;
  $('[data-contact-hint]').textContent = d.commitHint;
  $('[data-contact-end-title]').textContent = d.endTitle;
  $('[data-contact-end-text]').textContent = d.endText;
  $('[data-reconnect]').textContent = d.reconnect;
  $('[data-contact-rows]').innerHTML = CHANNELS.map(
    (c) => `<li class="crow">
      <a class="crow__link" href="${c.href}"${c.ext ? ' target="_blank" rel="noopener"' : ''}>
        <span class="crow__k">${c.k}</span>
        <span class="crow__v"><span class="sr-only">${d.sr[c.k]} </span>${c.value}</span>
        <span class="crow__go" aria-hidden="true">↗</span>
      </a>
      ${c.k === 'email' ? `<button class="sbtn crow__copy" type="button" data-copy="${EMAIL}">${d.copy}</button>` : ''}
    </li>`,
  ).join('');
  paintStatus();
}

/* ── Rodapé: barra de status ──────────────────────────── */

const t0 = performance.now();
let frozenAt: number | null = null;

function clock() {
  const ms = (frozenAt ?? performance.now()) - t0;
  const sec = Math.floor(ms / 1000);
  const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function paintStatus() {
  const d = s();
  const closed = frozenAt !== null;
  $('[data-status-msg]').textContent = closed ? `■ ${d.closed}` : `✓ ${d.ok}`;
  $('[data-status-user]').textContent = d.user;
  $('[data-status-time]').textContent = clock();
  const n = queriesExecuted();
  $('[data-status-q]').textContent = `${n} ${n === 1 ? d.query1 : d.queries}`;
  $('[data-status-bar]').classList.toggle('is-closed', closed);
}

/* ── COMMIT: desconexão ───────────────────────────────── */

function setConnected(on: boolean) {
  const dot = document.querySelector<HTMLElement>('.bar__conn .dot');
  const state = document.querySelector<HTMLElement>('.bar__conn .bar__state');
  dot?.classList.toggle('dot--off', !on);
  if (state) state.textContent = dict[currentLang()].text[on ? 'boot.on' : 'boot.off'];
}

export function initContact(getLenis: () => Lenis | null) {
  renderContact();
  setInterval(paintStatus, 1000);

  ScrollTrigger.create({
    trigger: '#contato',
    start: 'top 60%',
    onEnter: () => currentScene().id !== 'commit' && goScene(contactScene),
    onLeaveBack: () => ['contact', 'commit'].includes(currentScene().id) && goScene(scenes.path),
  });

  // Copiar e-mail (feedback no próprio botão; sem permissão de clipboard, não finge).
  $('[data-contact-rows]').addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-copy]');
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
    } catch {
      return;
    }
    btn.textContent = s().copied;
    btn.classList.add('is-done');
    setTimeout(() => {
      btn.textContent = s().copy;
      btn.classList.remove('is-done');
    }, 1800);
  });

  const commitBtn = $<HTMLButtonElement>('[data-commit]');
  const end = $<HTMLElement>('[data-contact-end]');
  const scan = $<HTMLElement>('.end-scan');

  const finish = () => {
    setConnected(false);
    frozenAt = performance.now();
    paintStatus();
    end.hidden = false;
    $<HTMLElement>('[data-reconnect]').focus({ preventScroll: true });
  };

  commitBtn.addEventListener('click', () => {
    if (frozenAt !== null) return;
    commitBtn.disabled = true;
    goScene(commitScene);
    if (reduced) return finish();
    // A mesma linha lima da tela de conexão: nasce no botão, cobre a largura e sobe até a barra do topo.
    const r = commitBtn.getBoundingClientRect();
    const barBottom = document.querySelector('.bar')!.getBoundingClientRect().bottom - 2;
    gsap
      .timeline({ delay: 0.9 })
      .set(scan, { display: 'block', opacity: 1, x: r.left, y: r.bottom, width: r.width })
      .to(scan, { x: 0, width: innerWidth, duration: 0.35, ease: 'expo.inOut' })
      .to(scan, { y: barBottom, duration: 0.9, ease: 'expo.inOut' })
      .call(finish)
      .to(scan, { opacity: 0, duration: 0.35 })
      .set(scan, { display: 'none' })
      .fromTo(end, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '<');
  });

  // Reconectar = uma reconexão de verdade: `USE hiwan;` → conectado → topo → o rosto se remonta dos dados.
  // (Antes: rolagem de ~6.000 px em 1,8 s, com a trajetória e a ponte rebobinando no caminho.)
  $('[data-reconnect]').addEventListener('click', () => {
    jump({
      target: 0,
      lenis: getLenis(),
      scene: scenes.hero,
      query: [['k', 'USE'], ['t', ' '], ['i', 'hiwan'], ['p', ';']],
      status: `✓ ${dict[currentLang()].text['boot.on'].replace(/^·\s*/, '')}`,
      onCovered: () => {
        frozenAt = null;
        end.hidden = true;
        commitBtn.disabled = false;
        setConnected(true);
        paintStatus();
        // O rosto se remonta a partir dos dados quando a cortina abre (fator próprio: a ponte não o regrava).
        if (reduced) return;
        gsap.killTweensOf(portraitState, 'a');
        portraitState.a = 0;
        gsap.to(portraitState, { a: 1, duration: 2.6, delay: 0.45, ease: 'power1.out' });
      },
    });
  });
}
