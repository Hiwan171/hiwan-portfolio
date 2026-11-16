/**
 * Seção 3 — trajetória (2º e último momento em tela fixa).
 * Desktop: a seção fica fixa e o scroll vertical desliza as "páginas" (um ano cada) na horizontal;
 * a velocidade do scroll inclina as páginas (referência enviada pelo Hiwan) e elas se endireitam ao parar.
 * Mobile e reduced-motion: pilha vertical normal.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { currentLang } from './i18n';
import { pathData } from './path-data';
import { goScene, scenes, currentScene } from './qbar';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderPath() {
  const d = pathData[currentLang()];
  const total = d.years.reduce((n, y) => n + y.items.length, 0);
  $('[data-path-table]').textContent = d.table;
  $('[data-path-count]').textContent = `${d.years.length} ${d.rows} · ${total} ${d.events}`;
  $('[data-path-title]').textContent = d.title;
  $('[data-path-sub]').textContent = d.sub;

  $('[data-path-track]').innerHTML = d.years
    .map((y, i) => {
      const agg = y.items.map((it) => it.title).join(' · ');
      const now = i === d.years.length - 1;
      return `<article class="page${now ? ' page--now' : ''}" aria-labelledby="y-${y.year}" data-i="${i}">
        <div class="page__tab"><span>${d.year} = ${y.year}</span><span>${y.items.length} ${y.items.length === 1 ? d.event : d.events}</span></div>
        <div class="page__body">
          <h3 class="page__year" id="y-${y.year}">${y.year}</h3>
          <ul class="page__items">${y.items
            .map((it) => `<li class="is-${it.kind}"><span class="page__kind">${d.kinds[it.kind]}</span><strong>${esc(it.title)}</strong><span class="page__where">${esc(it.where)}</span></li>`)
            .join('')}</ul>
        </div>
        <div class="page__agg" aria-hidden="true"><span>${d.events}:</span> '${esc(agg)}'</div>
      </article>`;
    })
    .join('');

  $('[data-path-ticks]').innerHTML = d.years.map((y, i) => `<li data-i="${i}">${y.year}</li>`).join('');
}

export function initPath() {
  renderPath();

  // A barra de query reescreve para a consulta da trajetória (em qualquer tamanho de tela).
  ScrollTrigger.create({
    trigger: '#trajetoria',
    start: 'top 35%',
    onEnter: () => goScene(scenes.path),
    onLeaveBack: () => currentScene().id === 'path' && goScene(scenes.projects),
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('has-hpath');
    const path = $<HTMLElement>('[data-path]');
    const track = $<HTMLElement>('[data-path-track]');
    const fill = $<HTMLElement>('.path__fill');
    const distance = () => Math.max(0, track.scrollWidth - path.clientWidth);

    let active = -1;
    const setActive = (p: number) => {
      const n = track.children.length;
      const i = Math.round(p * (n - 1));
      if (i === active) return;
      active = i;
      track.querySelectorAll('.page').forEach((el, j) => el.classList.toggle('is-active', j === i));
      document.querySelectorAll('[data-path-ticks] li').forEach((el, j) => el.classList.toggle('is-active', j === i));
    };

    // Inclinação pela velocidade, com decaimento (ao parar, as páginas se endireitam sozinhas).
    let skewTarget = 0, skew = 0;
    const tick = () => {
      skew += (skewTarget - skew) * 0.14;
      skewTarget *= 0.88;
      gsap.set(track, { skewX: skew });
    };
    gsap.ticker.add(tick);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: path,
        start: 'top top+=92', // abaixo da barra de conexão (52) + barra de query (40)
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          skewTarget = gsap.utils.clamp(-4, 4, self.getVelocity() / -450);
          fill.style.transform = `scaleX(${self.progress})`;
          setActive(self.progress);
        },
      },
    });
    setActive(0);

    return () => {
      gsap.ticker.remove(tick);
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: 'all' });
      document.documentElement.classList.remove('has-hpath');
    };
  });
}
