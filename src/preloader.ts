import { gsap } from 'gsap';
import { dict, currentLang } from './i18n';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const root = document.documentElement;

type Opts = {
  /** Chamado quando o hero deve começar (junto com o recolhimento). `at` só no modo de estudo. */
  onHero: (at?: number) => void;
  /** ?bootat=t → congela a sequência nesse tempo (estudo de movimento). */
  seekAt?: number;
};

/* Roteiro (s). Orçamento: tela sai em ~3,5 s; headline do hero em ~3,7 s.
   Auditoria 16/11: pausa do Pesquisador encurtada (−0,22 s; mais que isso a árvore não completa). */
const T = {
  login: 0.2, // digita o login
  pass: 0.56, // digita a senha
  press: 0.95, // clica em Conectar
  ready: 1.45, // segura aqui até os assets estarem prontos
  ok: 1.6, // conectado
  explorer: 1.68, // o diálogo vira o Pesquisador de Objetos (prévia da navegação)
  exit: 2.2, // a barra de progresso escapa e vira linha de varredura (árvore completa em ~2,15)
  sweep: 2.5, // a linha sobe revelando o hero
  dock: 3.25, // a linha encaixa na borda da barra
};
const HERO_AT = T.sweep;

const LOG: [key: string, at: number][] = [
  ['boot.log1', 0.12],
  ['boot.log2', T.press + 0.08],
  ['boot.log3', T.press + 0.25],
  ['boot.log4', T.press + 0.45],
  ['boot.log5', T.ok],
];

const assetsReady = () =>
  Promise.all([
    document.fonts.ready,
    document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true })),
  ]);

export function isBooting() {
  return 'boot' in root.dataset;
}

export function runPreloader({ onHero, seekAt }: Opts) {
  const t = dict[currentLang()].text;
  const boot = $<HTMLElement>('.boot');
  const login = $<HTMLElement>('[data-login]');
  const fLogin = $<HTMLElement>('[data-field="login"]');
  const fPass = $<HTMLElement>('[data-field="pass"]');
  const connect = $<HTMLElement>('[data-boot-connect]');
  const status = $<HTMLElement>('[data-boot-status]');
  const progress = $<HTMLElement>('[data-boot-progress]');
  const count = $<HTMLElement>('[data-boot-count]');
  const countWrap = count.parentElement!;
  const log = $<HTMLElement>('[data-boot-log]');
  const dot = $<HTMLElement>('[data-boot-dot]');
  const state = $<HTMLElement>('[data-boot-state]');
  const skipHint = $<HTMLElement>('.boot__skip');
  const title = $<HTMLElement>('[data-boot-title]');
  const view = $<HTMLElement>('[data-boot-view]');
  const form = $<HTMLElement>('[data-boot-form]');
  const tree = $<HTMLElement>('[data-boot-tree]');

  title.textContent = t['boot.title'];
  // [profundidade, glifo, texto, classe]
  const nodes: [number, string, string, string?][] = [
    [0, '●', `hiwan.db <span class="meta">(${t['boot.tree.meta']})</span>`, 'srv'],
    [1, '▾', t['boot.tree.dbs']],
    [2, '▾', 'hiwan'],
    [3, '▾', t['boot.tree.tables']],
    [4, '▦', `dbo.${t['boot.tree.t1']}`, 'tbl'],
    [4, '▦', `dbo.${t['boot.tree.t2']}`, 'tbl'],
    [4, '▦', `dbo.${t['boot.tree.t3']}`, 'tbl'],
  ];
  tree.innerHTML = nodes
    .map(([d, g, text, cls]) => `<li class="${cls ?? ''}" style="--depth:${d}"><span class="g${cls === 'srv' ? ' g--on' : ''}">${g}</span><span>${text}</span></li>`)
    .join('');
  const treeItems = Array.from(tree.children);

  $('[data-boot-sr]').textContent = t['boot.sr'];
  state.textContent = t['boot.off'];
  status.textContent = t['boot.wait'];

  const loginText = t['boot.loginValue'];
  const PASS = 8;
  const typed = { login: 0, pass: 0 };
  const pct = { v: 0 };

  const renderField = (el: HTMLElement, text: string, active: boolean) => {
    el.innerHTML = text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + (active ? '<span class="caret"></span>' : '');
    el.classList.toggle('is-active', active);
  };
  const renderCount = () => {
    const v = Math.round(pct.v);
    count.textContent = String(v).padStart(3, '0');
    progress.style.transform = `scaleX(${v / 100})`;
  };
  // O log é derivado do tempo da timeline: determinístico (estudo de movimento) e coerente no play.
  let shown = -1;
  const renderLog = (time: number) => {
    const n = LOG.filter(([, at]) => at <= time).length;
    if (n === shown) return;
    shown = n;
    log.innerHTML = LOG.slice(0, n)
      .map(([key, at]) => {
        const ms = Math.round(at * 1000);
        const ts = `${String(Math.floor(ms / 1000)).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
        return `<li><span class="ts">${ts}</span>${t[key]}</li>`;
      })
      .join('');
  };
  const setConnected = (on: boolean) => {
    status.textContent = on ? t['boot.ok'] : t['boot.connecting'];
    status.classList.toggle('is-ok', on);
    dot.classList.toggle('dot--off', !on);
    state.textContent = on ? t['boot.on'] : t['boot.off'];
  };

  // Linha de varredura: geometria em px; recorta a tela de conexão na altura da linha.
  const scanEl = $<HTMLElement>('.boot-scan');
  const scan = { x: 0, y: 0, w: 0 };
  const barBottom = () => $<HTMLElement>('.boot__bar').getBoundingClientRect().bottom - 2;
  const drawScan = () => {
    scanEl.style.transform = `translate(${scan.x}px, ${scan.y}px)`;
    scanEl.style.width = `${scan.w}px`;
    boot.style.clipPath = `inset(0 0 ${Math.max(0, innerHeight - scan.y - 1)}px 0)`;
  };
  scanEl.style.left = '0';
  scanEl.style.top = '0';

  const viewH = { from: 0, to: 0 };

  renderField(fLogin, '', false);
  renderField(fPass, '', false);
  renderCount();
  gsap.set(login, { opacity: 0, y: 16, scale: 0.985 });
  gsap.set([log, countWrap], { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true, onUpdate: () => renderLog(tl.time()) });

  tl.to(login, { opacity: 1, y: 0, scale: 1, duration: 0.55 }, 0)
    .to([log, countWrap], { opacity: 1, duration: 0.5 }, 0.05)
    .to(pct, { v: 34, duration: T.press - 0.15, ease: 'power1.out', onUpdate: renderCount }, 0.15)
    .to(typed, {
      login: loginText.length, duration: 0.35, ease: 'none',
      onStart: () => renderField(fLogin, '', true),
      onUpdate: () => renderField(fLogin, loginText.slice(0, Math.round(typed.login)), true),
    }, T.login)
    .to(typed, {
      pass: PASS, duration: 0.32, ease: 'none',
      onStart: () => renderField(fLogin, loginText, false),
      onUpdate: () => renderField(fPass, '•'.repeat(Math.round(typed.pass)), true),
    }, T.pass)
    .call(() => {
      renderField(fPass, '•'.repeat(PASS), false);
      connect.classList.add('is-pressed');
      setConnected(false);
    }, undefined, T.press)
    .call(() => connect.classList.remove('is-pressed'), undefined, T.press + 0.14)
    .to(pct, { v: 92, duration: T.ready - T.press, ease: 'power2.inOut', onUpdate: renderCount }, T.press)
    // Segura em 92% até fontes e página estarem prontas de verdade.
    .addPause(T.ready, () => void assetsReady().then(() => tl.play()))
    .to(pct, { v: 100, duration: T.ok - T.ready, ease: 'power1.out', onUpdate: renderCount }, T.ready)
    .call(() => setConnected(true), undefined, T.ok)
    // Pesquisador de Objetos: o formulário dá lugar à árvore; o cartão muda de altura suavemente.
    .call(() => {
      viewH.from = view.offsetHeight;
      form.hidden = true;
      tree.hidden = false;
      viewH.to = view.offsetHeight;
      view.style.height = `${viewH.from}px`;
      title.textContent = t['boot.explorer'];
      gsap.set(treeItems, { opacity: 0, x: -6 });
    }, undefined, T.explorer)
    .to(view, { height: () => viewH.to, duration: 0.42, ease: 'expo.inOut' }, T.explorer)
    .to(treeItems, { opacity: 1, x: 0, duration: 0.22, stagger: 0.028 }, T.explorer + 0.08)
    // Saída: a barra de progresso "escapa" do diálogo, ocupa a largura e sobe como linha de varredura.
    // A tela de conexão só cobre o que está ACIMA da linha; abaixo dela o hero já está rodando.
    .call(() => {
      const r = progress.getBoundingClientRect();
      Object.assign(scan, { x: r.left, y: r.top, w: r.width });
      drawScan();
      scanEl.style.opacity = '1';
      progress.style.visibility = 'hidden';
    }, undefined, T.exit)
    .to(login, { opacity: 0, scale: 0.98, duration: 0.25, ease: 'power2.in' }, T.exit)
    .to([log, countWrap, skipHint], { opacity: 0, duration: 0.25, ease: 'power2.in' }, T.exit)
    .to(scan, { x: 0, w: () => innerWidth, duration: T.sweep - T.exit, ease: 'expo.inOut', onUpdate: drawScan }, T.exit)
    .to(scan, { y: () => barBottom(), duration: T.dock - T.sweep, ease: 'expo.inOut', onUpdate: drawScan }, T.sweep)
    .to(scanEl, { opacity: 0, duration: 0.3, ease: 'power1.out' }, T.dock)
    .call(() => {
      delete root.dataset.boot;
      try { sessionStorage.setItem('hiwan:connected', '1'); } catch { /* sem storage */ }
    }, undefined, T.dock + 0.3);

  if (seekAt !== undefined) {
    tl.removePause(T.ready);
    tl.seek(seekAt, false).pause();
    renderLog(seekAt);
    if (seekAt >= HERO_AT) onHero(seekAt - HERO_AT);
    return;
  }

  tl.call(() => onHero(), undefined, HERO_AT);

  // Pular: clique ou tecla acelera tudo (a espera por assets continua valendo).
  const skip = () => {
    if (tl.time() < HERO_AT) tl.timeScale(5);
  };
  boot.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });

  tl.play();
}
