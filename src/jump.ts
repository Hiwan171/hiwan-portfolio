/**
 * "Query jump": navegação de longa distância como uma consulta (revisão 18).
 * Uma linha lima desce cobrindo a tela (gesto da tela de conexão), a query da seção é digitada no centro
 * e executa; por trás da cortina a página salta direto ao destino; a linha desce de novo revelando-o.
 * Substitui a rolagem rápida que atravessava a página (ponte e trajetória rebobinando no caminho).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { dict, currentLang, type Tok } from './i18n';
import { tokensHtml, setScene, flat, type Scene } from './qbar';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const len = (q: Tok[]) => q.reduce((n, [, t]) => n + t.length, 0);

export type JumpOpts = {
  target: HTMLElement | 0;
  lenis: Lenis | null;
  /** Cena que a barra de query mostra no destino (a query digitada na cortina vem dela). */
  scene: Scene;
  /** Query alternativa para a cortina (ex.: `USE hiwan;` no reconectar). */
  query?: Tok[];
  status?: string;
  /** Roda com a tela coberta, logo depois do salto. */
  onCovered?: () => void;
  onDone?: () => void;
};

let busy = false;

function land(o: JumpOpts) {
  if (o.target === 0) {
    if (o.lenis) o.lenis.scrollTo(0, { immediate: true, force: true });
    else scrollTo({ top: 0 });
  } else if (o.lenis) o.lenis.scrollTo(o.target, { immediate: true, force: true });
  else o.target.scrollIntoView();
  ScrollTrigger.update();
  o.onCovered?.();
  setScene(o.scene);
  // Foco no destino (teclado e leitor de tela continuam de onde a navegação levou).
  if (o.target !== 0) {
    if (!o.target.hasAttribute('tabindex')) o.target.setAttribute('tabindex', '-1');
    o.target.focus({ preventScroll: true });
  }
}

export function jump(o: JumpOpts) {
  if (busy) return;
  if (reduced || !o.lenis) {
    land(o);
    o.onDone?.();
    return;
  }
  busy = true;
  const wrap = $<HTMLElement>('[data-jump]');
  const veil = $<HTMLElement>('.jump');
  const scan = $<HTMLElement>('.jump__scan');
  const code = $<HTMLElement>('[data-jump-code]');
  const status = $<HTMLElement>('[data-jump-status]');
  const q = o.query ?? flat(o.scene.query());
  const n = len(q);
  const t = { n: 0 };
  const caret = '<span class="caret"></span>';
  const text = dict[currentLang()].text;

  code.innerHTML = caret;
  status.textContent = '';
  wrap.hidden = false;
  o.lenis.stop();

  gsap
    .timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        wrap.hidden = true;
        busy = false;
        o.lenis?.start();
        o.onDone?.();
      },
    })
    // 1) a linha desce cobrindo a tela
    .set(veil, { clipPath: 'inset(0% 0% 100% 0%)' })
    .set(scan, { top: '0%', opacity: 1 })
    .to(veil, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'power3.inOut' }, 0)
    .to(scan, { top: '100%', duration: 0.42, ease: 'power3.inOut' }, 0)
    .to(scan, { opacity: 0, duration: 0.1 }, 0.42)
    // 2) a query é digitada e executa
    .to(t, { n, duration: Math.min(0.6, Math.max(0.25, n * 0.008)), ease: 'none', onUpdate: () => (code.innerHTML = tokensHtml(q, Math.round(t.n)) + caret) }, 0.28)
    .call(() => {
      code.innerHTML = tokensHtml(q);
      status.textContent = text['status.running'];
      status.dataset.state = '';
    })
    // 3) salto (tela coberta; as animações com scrub alcançam o destino por trás)
    .call(() => {
      o.lenis!.start();
      land(o);
      o.lenis!.stop();
    }, undefined, '+=0.08')
    .call(() => {
      status.textContent = o.status ?? o.scene.status();
      status.dataset.state = 'done';
    }, undefined, '+=0.28')
    // 4) a linha desce de novo revelando o destino
    .set(scan, { top: '0%', opacity: 1 }, '+=0.22')
    .to(veil, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6 })
    .to(scan, { top: '100%', duration: 0.6 }, '<')
    .to(scan, { opacity: 0, duration: 0.12 });
}
