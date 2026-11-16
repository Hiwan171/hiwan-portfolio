/**
 * Artefato 5: navegador com as 4 landing pages reais (autorizado pelo Hiwan, 16/11/2026).
 * Capturas reais (scripts/photo/sites.mjs), carregadas só quando o caso abre.
 * Roda: mostra cada marca e rola a página; o visitante pode rolar dentro da janela ou trocar de aba,
 * e qualquer interação dele interrompe a rolagem automática.
 */
import { gsap } from 'gsap';
import { currentLang } from '../i18n';
import type { Mounted } from '../projects';
import { winHtml, reducedMotion } from './win';

const SITES = [
  { id: 'colefar', name: 'Colefar', url: 'colefar.online', color: '#3fa36b' },
  { id: 'ambientecmg', name: 'Ambientec', url: 'ambientecmg.online', color: '#2f74c0' },
  { id: 'colenorte', name: 'Colenorte', url: 'colenorte.online', color: '#1f8f84' },
  { id: 'biocoletas', name: 'Biocoletas', url: 'biocoletas.online', color: '#7a8b3a' },
];

const L = {
  pt: { open: 'abrir site ↗', alt: 'Página inicial do site', note: 'capturas reais · role dentro da janela ou troque de aba', sr: 'Quatro landing pages em React, uma por marca do grupo: Colefar, Ambientec, Colenorte e Biocoletas.' },
  en: { open: 'open site ↗', alt: 'Home page of', note: 'real captures · scroll inside the window or switch tabs', sr: 'Four React landing pages, one per group brand: Colefar, Ambientec, Colenorte and Biocoletas.' },
};

export function mountBrowser(host: HTMLElement): Mounted {
  const s = L[currentLang()];
  host.innerHTML = winHtml({
    cls: 'win--browser',
    title: '',
    meta: '',
    note: s.note,
    sr: s.sr,
    body: `
      <div class="br__tabs" role="tablist">${SITES.map((x, i) => `
        <button class="br__tab" role="tab" type="button" aria-selected="${i === 0}" data-i="${i}">
          <span class="br__fav" style="--c:${x.color}"></span>${x.name}
        </button>`).join('')}
      </div>
      <div class="br__url">
        <span class="br__lock" aria-hidden="true">●</span>
        <span>https://<b data-k="url">${SITES[0].url}</b></span>
        <a class="br__open" data-k="open" href="https://${SITES[0].url}" target="_blank" rel="noopener">${s.open}</a>
      </div>
      <div class="br__view" data-k="view" data-lenis-prevent tabindex="0" role="tabpanel">
        <img data-k="img" alt="${s.alt} ${SITES[0].name}" decoding="async" />
      </div>`,
  });
  host.querySelector('.win__bar')!.remove(); // a barra de abas já é o "título"

  const $ = <T extends HTMLElement>(k: string) => host.querySelector<T>(`[data-k="${k}"]`)!;
  const view = $('view');
  const img = $<HTMLImageElement>('img');
  const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('.br__tab'));
  let tl: gsap.core.Timeline | null = null;
  let cur = 0;

  const show = (i: number) => {
    cur = i;
    const x = SITES[i];
    tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
    $('url').textContent = x.url;
    $<HTMLAnchorElement>('open').href = `https://${x.url}`;
    img.alt = `${s.alt} ${x.name}`;
    img.src = `/sites/${x.id}.webp`;
    view.scrollTop = 0;
  };

  // Pré-carrega as outras abas depois da primeira (só quando o caso já está aberto).
  const preload = () => SITES.slice(1).forEach((x) => (new Image().src = `/sites/${x.id}.webp`));

  const stop = () => tl?.kill();
  const run = () => {
    stop();
    show(0);
    if (reducedMotion()) return;
    tl = gsap.timeline({ delay: 0.4 });
    SITES.forEach((_, i) => {
      if (i) tl!.call(() => show(i), undefined, '+=0.2');
      tl!.to(view, {
        scrollTop: () => Math.min(view.scrollHeight - view.clientHeight, 900),
        duration: 3.2,
        ease: 'power2.inOut',
      }, '+=0.5');
    });
  };

  tabs.forEach((t) => t.addEventListener('click', () => { stop(); show(Number(t.dataset.i)); }));
  // O visitante assumiu: rolagem automática para.
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => view.addEventListener(ev, stop, { passive: true }));
  host.querySelector('[data-replay]')!.addEventListener('click', run);

  img.addEventListener('load', preload, { once: true });
  return { play: run, destroy() { stop(); host.innerHTML = ''; } };
}
