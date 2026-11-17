import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { goScene, paintQbar, qbarEl, scenes, currentScene } from './qbar';
import { renderProjects, initCases } from './projects';
import { bridgeActive } from './bridge';
import { initPath } from './path';
import { initContact, contactScene } from './contact';
import { jump } from './jump';

/** Cena da barra de query para cada seção (a query que o salto digita). */
const sceneFor = (id: string) =>
  id === 'projetos' ? scenes.projects : id === 'trajetoria' ? scenes.path : id === 'contato' ? contactScene : scenes.hero;
import { initConsole } from './console';
import { openFromHash, goToCase } from './projects';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export let lenis: Lenis | null = null;

export { renderProjects, paintQbar };

export function initSections(opts: { bootDone: Promise<void> }) {
  renderProjects();
  paintQbar();

  // Scroll suave (desligado em reduced-motion). Parado enquanto a tela de conexão estiver ativa.
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    opts.bootDone.then(() => lenis!.start());
  }

  // Âncoras internas passam pelo Lenis. O desconto da barra + barra de query vem do
  // `scroll-margin-top` do CSS (o Lenis já o respeita; somar offset aqui dobrava o desconto).
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute('href')!;
    const caseLink = href.match(/^#(?:projetos|projects)\/(\d+)$/);
    if (caseLink) {
      e.preventDefault();
      goToCase(Number(caseLink[1]) - 1);
      return;
    }
    let target: Element | null = null;
    try {
      target = document.querySelector(href);
    } catch {
      return;
    }
    if (!target) return;
    e.preventDefault();
    const el = target as HTMLElement;
    const dist = Math.abs(el.getBoundingClientRect().top - 92);
    // Hero → projetos rola: a ponte (rosto → dados → resultado) é a transição, e é melhor que um salto.
    const throughBridge = el.id === 'projetos' && bridgeActive() && scrollY < el.offsetTop - innerHeight;
    if (!lenis) el.scrollIntoView();
    else if (throughBridge) lenis.scrollTo(el, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    else if (dist < innerHeight * 1.2) lenis.scrollTo(el, { duration: 1 });
    else jump({ target: el, lenis, scene: sceneFor(el.id) });
  });

  // Barra de query aparece quando o editor do hero sai por baixo da barra de conexão.
  // Medido pelo espaçador (o hero fica grudado durante a ponte): o editor sai quando o fundo do
  // espaçador está a (altura do hero − fundo do editor) abaixo da barra. Sem ponte, dá no mesmo.
  ScrollTrigger.create({
    trigger: '.hero-spacer',
    start: () => {
      const hero = document.querySelector<HTMLElement>('.hero')!;
      const ed = document.querySelector<HTMLElement>('.cell--editor')!;
      const edBottom = ed.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
      return `bottom top+=${52 + hero.offsetHeight - edBottom}`;
    },
    invalidateOnRefresh: true,
    onEnter: () => qbarEl().classList.add('is-on'),
    onLeaveBack: () => qbarEl().classList.remove('is-on'),
  });

  // Entrar em projetos reescreve a query; voltar ao hero desfaz.
  // 35%: a barra mostra a query do hero por ~1/3 de tela antes (continuidade), só então reescreve.
  ScrollTrigger.create({
    trigger: '#projetos',
    start: 'top 35%',
    // Com a ponte em tela fixa (desktop), quem troca a cena é ela; este gatilho vale no mobile.
    onEnter: () => !bridgeActive() && currentScene().id === 'hero' && goScene(scenes.projects),
    onLeaveBack: () => !bridgeActive() && goScene(scenes.hero),
  });

  // Menu: o link da seção visível fica ativo (aria-current), como a tabela selecionada na árvore.
  document.querySelectorAll<HTMLAnchorElement>('.bar__nav a[href^="#"]').forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href')!);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (st) => (st.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')),
    });
  });

  // Linhas do resultado chegam como um result set: em sequência, logo após a query "executar".
  const rows = () => document.querySelectorAll('[data-proj-list] .prow');
  if (!reduced) {
    gsap.set(rows(), { opacity: 0, y: 14 });
    ScrollTrigger.create({
      trigger: '[data-proj-list]',
      start: 'top 80%',
      once: true,
      onEnter: () => gsap.to(rows(), { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07, delay: 0.2, clearProps: 'opacity,transform' }),
    });
    gsap.from('.sec--projects .sec__title', {
      yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.sec--projects', start: 'top 75%', once: true },
    });
  }

  initCases(() => lenis);
  initPath();
  initContact(() => lenis);
  initConsole();
  // Link direto para um caso (#projetos/3): depois da tela de conexão e da intro.
  opts.bootDone.then(() => setTimeout(openFromHash, 600));
}
