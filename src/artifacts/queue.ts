/**
 * Artefato 2: aplicação de envio de e-mail em massa (Python).
 * Real: o envio era terceirizado e pago; hoje é interno. Volume, destinatários e campanha são
 * ilustrativos (e-mails mascarados, como um sistema real faria ao exibir dados de clientes).
 */
import { gsap } from 'gsap';
import { currentLang } from '../i18n';
import type { Mounted } from '../projects';
import { winHtml, reducedMotion, fmt } from './win';

const TOTAL = 1240;

const L = {
  pt: {
    title: 'envio_em_massa.py — campanha',
    meta: 'smtp · interno',
    camp: 'Comunicado de coleta · novembro',
    list: 'lista: clientes_ativos.xlsx',
    sent: 'enviados', queue: 'na fila', retry: 'reenviados',
    st: { q: 'na fila', s: 'enviando', ok: 'entregue', rt: 'reenviado' },
    done: 'campanha concluída',
    vendor: 'serviço terceirizado',
    vendorOff: 'dispensado',
    note: 'volume e destinatários ilustrativos · e-mails mascarados',
    sr: `Simulação: ${TOTAL} e-mails enviados por uma aplicação interna em Python, no lugar de um serviço terceirizado pago.`,
  },
  en: {
    title: 'bulk_sender.py — campaign',
    meta: 'smtp · in-house',
    camp: 'Pickup notice · November',
    list: 'list: active_customers.xlsx',
    sent: 'sent', queue: 'queued', retry: 'retried',
    st: { q: 'queued', s: 'sending', ok: 'delivered', rt: 'retried' },
    done: 'campaign finished',
    vendor: 'third-party service',
    vendorOff: 'no longer needed',
    note: 'illustrative volume and recipients · masked emails',
    sr: `Simulation: ${TOTAL} emails sent by an in-house Python application instead of a paid third-party service.`,
  },
};

// Destinatários mascarados, determinísticos (sem dados reais).
const USERS = ['financeiro', 'contato', 'compras', 'adm', 'operacao', 'diretoria', 'faturamento', 'logistica', 'sesmt', 'qualidade', 'meioambiente', 'rh'];
const mask = (i: number) => {
  const u = USERS[i % USERS.length];
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(3, u.length - 2))}@${'•'.repeat(5 + (i % 4))}.com.br`;
};

export function mountQueue(host: HTMLElement): Mounted {
  const s = L[currentLang()];
  host.innerHTML = winHtml({
    cls: 'win--queue',
    title: s.title,
    meta: s.meta,
    note: s.note,
    sr: s.sr,
    body: `
      <div class="q__head">
        <div class="q__camp"><strong>${s.camp}</strong><span>${s.list} · ${fmt(TOTAL)}</span></div>
        <div class="q__stats">
          <div><b data-k="sent">0</b><span>${s.sent}</span></div>
          <div><b data-k="queue">${fmt(TOTAL)}</b><span>${s.queue}</span></div>
          <div><b data-k="retry">0</b><span>${s.retry}</span></div>
        </div>
        <div class="q__bar"><span data-k="bar"></span></div>
      </div>
      <ol class="q__list" data-k="list" aria-hidden="true"></ol>
      <div class="q__done" data-k="done" hidden>
        <span class="q__ok">✓ ${s.done} · ${fmt(TOTAL)} ${s.sent}</span>
        <span class="q__vendor">${s.vendor}: <mark>${s.vendorOff}</mark></span>
      </div>`,
  });

  const $ = (k: string) => host.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
  const list = $('list');
  const ROWS = 7;
  let tl: gsap.core.Timeline | null = null;

  const row = (i: number, st: keyof typeof s.st) =>
    `<li class="q__row is-${st}"><span class="q__n">${String(i + 1).padStart(4, '0')}</span><span class="q__to">${mask(i)}</span><span class="q__st">${s.st[st]}</span></li>`;

  const paint = (sent: number, retry: number) => {
    $('sent').textContent = fmt(sent);
    $('queue').textContent = fmt(TOTAL - sent);
    $('retry').textContent = fmt(retry);
    $('bar').style.transform = `scaleX(${sent / TOTAL})`;
    // Janela de 7 linhas em torno do envio atual: entregues acima, "enviando" no meio, fila abaixo.
    const start = Math.max(0, Math.min(TOTAL - ROWS, sent - 3));
    let html = '';
    for (let i = start; i < start + ROWS; i++) {
      const st = i < sent ? (i % 97 === 41 ? 'rt' : 'ok') : i === sent ? 's' : 'q';
      html += row(i, st as keyof typeof s.st);
    }
    list.innerHTML = html;
  };

  const run = () => {
    tl?.kill();
    $('done').hidden = true;
    if (reducedMotion()) {
      paint(TOTAL, 12);
      $('done').hidden = false;
      return;
    }
    const k = { v: 0 };
    tl = gsap.timeline();
    // Primeiros envios devagar (dá para ler), depois acelera, como um lote real ganhando ritmo.
    tl.to(k, { v: 12, duration: 2.2, ease: 'none', onUpdate: () => paint(Math.floor(k.v), Math.floor(k.v / 97)) })
      .to(k, { v: TOTAL, duration: 3.2, ease: 'power2.in', onUpdate: () => paint(Math.floor(k.v), Math.floor(k.v / 97)) })
      .call(() => {
        paint(TOTAL, Math.floor(TOTAL / 97));
        $('done').hidden = false;
        gsap.from($('done'), { opacity: 0, y: 8, duration: 0.6, ease: 'expo.out' });
      });
  };

  paint(0, 0);
  host.querySelector('[data-replay]')!.addEventListener('click', run);
  return { play: run, destroy() { tl?.kill(); host.innerHTML = ''; } };
}
