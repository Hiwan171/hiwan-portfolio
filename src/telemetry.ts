/**
 * Telemetria da visita (monitor de atividade: sys.dm_exec_sessions).
 * Tudo fica na memória desta aba: nada é enviado, gravado ou compartilhado.
 */

const t0 = performance.now();
const loginTime = new Date();
const stats = { clicks: 0, keys: 0, scrollPx: 0 };
let lastY = scrollY;
let fps = 0;

addEventListener('pointerdown', () => stats.clicks++, { passive: true, capture: true });
addEventListener('keydown', () => stats.keys++, { passive: true, capture: true });
addEventListener(
  'scroll',
  () => {
    stats.scrollPx += Math.abs(scrollY - lastY);
    lastY = scrollY;
  },
  { passive: true },
);

// FPS médio (janela de ~1 s), medido só com a aba visível.
let frames = 0;
let since = performance.now();
const loop = (now: number) => {
  frames++;
  if (now - since >= 1000) {
    fps = Math.round((frames * 1000) / (now - since));
    frames = 0;
    since = now;
  }
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

/** SPID estável durante a sessão da aba (como o SQL Server: um número, 51 em diante). */
const spid = (() => {
  try {
    const k = 'hiwan:spid';
    const v = sessionStorage.getItem(k) ?? String(51 + Math.floor(Math.random() * 40));
    sessionStorage.setItem(k, v);
    return Number(v);
  } catch {
    return 52;
  }
})();

function browser() {
  const ua = navigator.userAgent;
  const m =
    ua.match(/Edg\/(\d+)/) ? ['Edge', ua.match(/Edg\/(\d+)/)![1]] :
    ua.match(/OPR\/(\d+)/) ? ['Opera', ua.match(/OPR\/(\d+)/)![1]] :
    ua.match(/Firefox\/(\d+)/) ? ['Firefox', ua.match(/Firefox\/(\d+)/)![1]] :
    ua.match(/Chrome\/(\d+)/) ? ['Chrome', ua.match(/Chrome\/(\d+)/)![1]] :
    ua.match(/Version\/(\d+).*Safari/) ? ['Safari', ua.match(/Version\/(\d+)/)![1]] : ['Browser', ''];
  return `${m[0]} ${m[1]}`.trim();
}

function os() {
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'desconhecido';
}

export const sessionId = () => spid;
export const elapsedMs = () => Math.round(performance.now() - t0);

/** Uma linha de sys.dm_exec_sessions. Nomes iguais aos do SQL Server onde existem; os extras são da web. */
export function sessionRow(queries: number) {
  return {
    session_id: spid,
    login_name: document.documentElement.lang === 'en' ? 'guest' : 'visitante',
    login_time: loginTime.toISOString().replace('T', ' ').slice(0, 19),
    status: 'running',
    host_name: os(),
    program_name: browser(),
    language: navigator.language,
    total_elapsed_time: elapsedMs(),
    reads: queries,
    clicks: stats.clicks,
    keystrokes: stats.keys,
    scroll_px: Math.round(stats.scrollPx),
    viewport: `${innerWidth}×${innerHeight}`,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fps,
  };
}
