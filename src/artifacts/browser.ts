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
  pt: { open: 'abrir site ↗', alt: 'Página inicial do site', engage: '↕ clique para navegar no site', note: 'capturas reais · clique na janela para rolar o site ou troque de aba', sr: 'Quatro landing pages em React, uma por marca do grupo: Colefar, Ambientec, Colenorte e Biocoletas.' },
  en: { open: 'open site ↗', alt: 'Home page of', engage: '↕ click to browse the site', note: 'real captures · click the window to scroll the site, or switch tabs', sr: 'Four React landing pages, one per group brand: Colefar, Ambientec, Colenorte and Biocoletas.' },
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
      <div class="br__frame">
        <div class="br__view" data-k="view" role="tabpanel" tabindex="-1">
          <img data-k="img" alt="${s.alt} ${SITES[0].name}" decoding="async" />
        </div>
        <button class="br__engage" type="button" data-k="engage"><span class="br__chip">${s.engage}</span></button>
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

  /* R3 — sem armadilha de scroll. Solta, a janela não captura a roda nem o dedo: a página rola por
     trás (no celular ela ocupa ~40% da tela). Um clique/toque/Enter "engata": aí sim o scroll é do
     site dentro da janela (o Lenis ignora via data-lenis-prevent). Tirar o mouse, tocar fora ou Esc solta. */
  const frame = host.querySelector<HTMLElement>('.br__frame')!;
  const engageBtn = $<HTMLButtonElement>('engage');
  const engage = () => {
    stop();
    frame.classList.add('is-engaged');
    view.setAttribute('data-lenis-prevent', '');
    view.tabIndex = 0;
    view.focus({ preventScroll: true });
  };
  const release = () => {
    if (!frame.classList.contains('is-engaged')) return;
    frame.classList.remove('is-engaged');
    view.removeAttribute('data-lenis-prevent');
    view.tabIndex = -1;
  };
  engageBtn.addEventListener('click', engage);
  frame.addEventListener('mouseleave', release);
  const outside = (e: Event) => !frame.contains(e.target as Node) && release();
  document.addEventListener('touchstart', outside, { passive: true });
  view.addEventListener('keydown', (e) => e.key === 'Escape' && (release(), engageBtn.focus()));

  host.querySelector('[data-replay]')!.addEventListener('click', () => { release(); run(); });

  // R2: a janela já nasce com a 1ª marca (antes: preta até rodar).
  // Mas só DEPOIS do load da página: no mobile os artefatos são montados no carregamento para medir
  // a altura, e baixar a captura ali segurava a tela de conexão (rede lenta: 6,8 s → 14,9 s).
  let alive = true;
  const firstPaint = () => alive && !img.getAttribute('src') && show(0);
  if (document.readyState === 'complete') firstPaint();
  else addEventListener('load', firstPaint, { once: true });
  img.addEventListener('load', () => alive && preload(), { once: true }); // desmontado não pré-carrega
  return {
    play: run,
    destroy() {
      alive = false;
      stop();
      removeEventListener('load', firstPaint);
      document.removeEventListener('touchstart', outside);
      host.innerHTML = '';
    },
  };
}
