import { gsap } from 'gsap';
import { dict, currentLang } from './i18n';

const finePointer = matchMedia('(pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tabela de resultado: cruz de coluna no hover; clique copia o valor (feedback na própria aba). */
function resultGrid() {
  const table = document.querySelector<HTMLTableElement>('[data-result]')!;
  const meta = document.querySelector<HTMLElement>('.cell--result .cell__tab-meta')!;
  meta.setAttribute('aria-live', 'polite');
  let col = -1;
  let resetMeta: number | undefined;

  const mark = (i: number) => {
    if (i === col) return;
    col = i;
    table.querySelectorAll('th, td').forEach((c) => {
      c.classList.toggle('is-col', (c as HTMLTableCellElement).cellIndex === i);
    });
  };

  // Delegação: a tabela é re-renderizada na troca de idioma.
  table.addEventListener('pointerover', (e) => {
    const cell = (e.target as Element).closest('th, td') as HTMLTableCellElement | null;
    if (cell) mark(cell.cellIndex);
  });
  table.addEventListener('pointerleave', () => mark(-1));

  table.addEventListener('click', async (e) => {
    const td = (e.target as Element).closest('td') as HTMLTableCellElement | null;
    if (!td) return;
    const value = td.textContent!.trim();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // sem permissão de clipboard: não finge que copiou
    }
    td.classList.remove('is-copied');
    void td.offsetWidth; // reinicia a animação
    td.classList.add('is-copied');
    const t = dict[currentLang()].text;
    meta.textContent = `${t['copy.done']} '${value.length > 24 ? value.slice(0, 22) + '…' : value}'`;
    meta.classList.add('is-msg'); // sem caixa alta: o aviso mostra o valor exatamente como foi copiado
    clearTimeout(resetMeta);
    resetMeta = window.setTimeout(() => {
      meta.textContent = dict[currentLang()].text['result.meta'];
      meta.classList.remove('is-msg');
    }, 1800);
  });
}

/** CTA principal com atração magnética leve (só mouse; nada em reduced-motion). */
function magnetic() {
  if (!finePointer || reduced) return;
  const btn = document.querySelector<HTMLElement>('.btn--primary')!;
  const RADIUS = 90;
  const PULL = 0.22;
  const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
  const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });

  addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const near = Math.hypot(dx, dy) < RADIUS + Math.max(r.width, r.height) / 2;
    xTo(near ? dx * PULL : 0);
    yTo(near ? dy * PULL : 0);
  }, { passive: true });
}

/** Menu mobile: abre/fecha; Esc e clique fora fecham; foco vai para o 1º item e volta ao botão. */
function mobileMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-action="menu"]')!;
  const menu = document.querySelector<HTMLElement>('#menu')!;
  const set = (open: boolean, returnFocus = false) => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector<HTMLElement>('a')?.focus();
    else if (returnFocus) btn.focus();
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => (e.target as Element).closest('a') && set(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && !menu.hidden && set(false, true));
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target as Node) && !btn.contains(e.target as Node)) set(false);
  });
  matchMedia('(min-width: 761px)').addEventListener('change', (m) => m.matches && set(false));
}

/** Troca de tema com revelação circular a partir do botão (View Transitions; sem API = instantâneo). */
export function toggleTheme(origin: HTMLElement, apply: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduced) return apply();
  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  doc.startViewTransition(apply).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  });
}

export function initInteractions() {
  resultGrid();
  magnetic();
  mobileMenu();
}
