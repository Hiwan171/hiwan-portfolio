/**
 * Retrato em partículas (WebGL2 puro, sem biblioteca).
 * Conceito: "dados espalhados" (partículas soltas no espaço) se organizam no rosto.
 * - `portraitState.p` (0→1) é animado pela intro do hero (GSAP), então é determinístico no seek.
 * - Cursor: repulsão local + leve inclinação 3D. Ocioso: deriva mínima (o hero nunca fica morto).
 * - Tema claro: pontos de tinta, tamanho pela escuridão (meio-tom). Escuro: pontos claros pelo brilho.
 * - reduced-motion: retrato montado e parado. Sem WebGL2: imagem estática de fallback.
 */

/** p: dados espalhados (0) → rosto (1). g: → grade de resultado (1), usada pela ponte em tela fixa. */
// a: fator de montagem do reconectar (independente de p, que a ponte controla com scrub)
export const portraitState = { p: 0, g: 0, a: 1 };

/* Grade de resultado (5 linhas × 5 colunas de "texto" em pontos), em coordenadas do modelo.
   Larguras relativas espelham a tabela de projetos: # · projeto · area · stack · resultado. */
const GRID_ROWS = 5;
const GRID_COLS = [0.07, 0.36, 0.14, 0.18, 0.25];

const SRC = '/photo/portrait.png';
// portrait.png já vem em meia resolução (scripts/photo/prepare.py): 1 partícula por pixel.
const STEP = 1;
const ALPHA_MIN = 0.12;

const VERT = /* glsl */ `#version 300 es
in vec2 aPos; in float aLum; in float aMask; in float aSeed; in vec3 aGrid; // xy destino na grade, z = coluna
uniform vec2 uRes; uniform float uFit; uniform float uP; uniform float uG; uniform float uTime;
uniform vec2 uMouse; uniform float uMouseOn; uniform vec2 uTilt;
uniform float uSpacing; uniform float uDark;
out float vAlpha; out float vAccent;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  float k = uDark > 0.5 ? aLum : 1.0 - aLum;            // "quantidade de tinta" do ponto
  vec3 scatter = vec3((hash(aSeed * 1.31) - 0.5) * 2.6,
                      (hash(aSeed * 7.17) - 0.5) * 1.9,
                      (hash(aSeed * 3.71) - 0.5) * 1.6);
  // Atraso por partícula (aleatório + de cima para baixo) e ease-out: sai rápido, assenta devagar,
  // então o rosto emerge cedo e o pouso continua suave.
  float d = clamp(hash(aSeed * 11.3) * 0.32 + (0.5 - aPos.y) * 0.18, 0.0, 0.48);
  float t = clamp((uP - d) / (1.0 - d), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);

  vec3 target = vec3(aPos, (k - 0.5) * 0.14);
  target.xy += 0.0022 * vec2(sin(uTime * 0.9 + aSeed * 6.0), cos(uTime * 0.7 + aSeed * 5.0));
  vec3 p = mix(scatter, target, e);

  // Grade de resultado: depois que a query de projetos executa, os dados assentam em linhas.
  float gd = clamp((uG - hash(aSeed * 2.7) * 0.35) / 0.65, 0.0, 1.0);
  float ge = 1.0 - pow(1.0 - gd, 3.0);
  vec3 gp = vec3(aGrid.xy, 0.0);
  gp.xy += 0.0015 * vec2(sin(uTime * 0.8 + aSeed * 4.0), cos(uTime * 0.6 + aSeed * 3.0));
  p = mix(p, gp, ge);
  float settled = max(e, ge);

  vec2 dm = p.xy - uMouse;
  float f = uMouseOn * smoothstep(0.12, 0.0, length(dm)) * settled;
  p.xy += normalize(dm + 1e-5) * f * 0.055;
  p.z += f * 0.1;

  float cy = cos(uTilt.x), sy = sin(uTilt.x);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(uTilt.y), sx = sin(uTilt.y);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);

  float persp = 2.4 / (2.4 - p.z);
  vec2 clip = p.xy * persp * uFit;
  clip.x *= uRes.y / uRes.x;
  gl_Position = vec4(clip, 0.0, 1.0);
  // Na grade, todos os pontos têm o mesmo peso (é texto, não meio-tom) e a coluna "#" fica em lima.
  // (pontos finos e translúcidos: lê como texto pontilhado, não como tarja preta)
  gl_PointSize = mix(mix(0.5, 1.55, k * k), 0.62, ge) * uSpacing * persp;
  float faceAlpha = aMask * mix(0.35, 1.0, e) * smoothstep(0.02, 0.16, k);
  vAlpha = mix(faceAlpha, 0.55, ge);
  vAccent = mix(step(0.976, hash(aSeed * 5.3)), aGrid.z < 0.5 ? 1.0 : 0.0, ge);
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha; in float vAccent;
uniform vec3 uInk; uniform vec3 uAccent;
out vec4 o;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float a = smoothstep(0.5, 0.36, r) * vAlpha;
  vec3 c = mix(uInk, uAccent, vAccent);
  o = vec4(c * a, a);
}`;

function cssColor(name: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
  probe.remove();
  return [m[0] / 255, m[1] / 255, m[2] / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

async function loadPoints() {
  const img = new Image();
  img.src = SRC;
  await img.decode();
  const { width: w, height: h } = img;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, w, h).data;

  const pos: number[] = [], lum: number[] = [], mask: number[] = [], seed: number[] = [];
  let n = 0;
  for (let y = 0; y < h; y += STEP) {
    for (let x = 0; x < w; x += STEP) {
      const i = (y * w + x) * 4;
      const a = px[i + 3] / 255;
      if (a < ALPHA_MIN) continue;
      const jx = (Math.random() - 0.5) * STEP * 0.6;
      const jy = (Math.random() - 0.5) * STEP * 0.6;
      pos.push((x + jx - w / 2) / h, (h / 2 - (y + jy)) / h);
      lum.push(px[i] / 255);
      mask.push(a);
      seed.push(Math.random() * 1000);
      n++;
    }
  }
  return { n, aspect: w / h, srcH: h, pos, lum, mask, seed, grid: gridTargets(n, w / h) };
}

/** Destino de cada partícula na grade: "palavras" de pontos por célula + linhas divisórias. */
function gridTargets(n: number, aspect: number) {
  const out: number[] = [];
  const width = aspect * 0.9;
  const x0 = -width / 2;
  const gap = width * 0.025;
  const top = 0.4;
  const rowH = 0.8 / GRID_ROWS;
  const total = GRID_COLS.reduce((a, b) => a + b, 0);
  const colX: number[] = [];
  const colW: number[] = [];
  let acc = 0;
  for (const c of GRID_COLS) {
    colX.push(x0 + (acc / total) * width);
    colW.push((c / total) * width - gap);
    acc += c;
  }
  // Comprimento do "texto" em cada célula (determinístico): parece conteúdo real, não blocos.
  const fill = (r: number, c: number) => (c === 0 ? 0.55 : 0.45 + 0.55 * Math.abs(Math.sin(r * 12.9898 + c * 78.233)));
  const weights: number[] = [];
  for (let r = 0; r < GRID_ROWS; r++) for (let c = 0; c < GRID_COLS.length; c++) weights.push(colW[c] * fill(r, c));
  const wSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.08) {
      // linha divisória (inclui topo e base)
      const r = Math.floor(Math.random() * (GRID_ROWS + 1));
      out.push(x0 + Math.random() * width, top - rowH * r, 9);
      continue;
    }
    let pick = Math.random() * wSum, cell = 0;
    while (pick > weights[cell] && cell < weights.length - 1) pick -= weights[cell++];
    const r = Math.floor(cell / GRID_COLS.length);
    const c = cell % GRID_COLS.length;
    const thick = c === 1 ? 0.024 : 0.014; // coluna "projeto" é mais grossa (fonte de display)
    out.push(
      colX[c] + Math.random() * colW[c] * fill(r, c),
      top - rowH * (r + 0.5) + (Math.random() - 0.5) * thick,
      c,
    );
  }
  return out;
}

export async function initPortrait(host: HTMLElement): Promise<number> {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'blob__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });

  if (!gl) {
    const img = new Image();
    img.src = SRC;
    img.alt = '';
    img.className = 'blob__fallback';
    host.appendChild(img);
    host.classList.add('has-portrait');
    portraitState.p = 1;
    return 0;
  }

  const data = await loadPoints();
  host.appendChild(canvas);
  host.classList.add('has-portrait');

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const attr = (name: string, arr: number[], size: number) => {
    const loc = gl.getAttribLocation(prog, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  gl.bindVertexArray(gl.createVertexArray());
  attr('aPos', data.pos, 2);
  attr('aLum', data.lum, 1);
  attr('aMask', data.mask, 1);
  attr('aSeed', data.seed, 1);
  attr('aGrid', data.grid, 3);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    res: U('uRes'), fit: U('uFit'), p: U('uP'), time: U('uTime'), mouse: U('uMouse'), mouseOn: U('uMouseOn'),
    tilt: U('uTilt'), spacing: U('uSpacing'), dark: U('uDark'), ink: U('uInk'), accent: U('uAccent'), g: U('uG'),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let W = 0, H = 0, fit = 1, dpr = 1;
  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    fit = Math.min(1.9, (1.9 * W) / (data.aspect * H)); // "contain" com 5% de respiro
    gl.viewport(0, 0, W, H);
    draw();
  };

  const theme = () => {
    gl.uniform3fv(u.ink, cssColor('--ink'));
    gl.uniform3fv(u.accent, cssColor('--accent'));
    gl.uniform1f(u.dark, document.documentElement.dataset.theme === 'dark' ? 1 : 0);
    draw();
  };

  // Cursor (suavizado) em coordenadas do modelo
  const mouse = { x: 9, y: 9, tx: 9, ty: 9, on: 0, ton: 0 };
  if (!reduced) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      const cx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const cy = 1 - ((e.clientY - r.top) / r.height) * 2;
      mouse.tx = (cx * (W / H)) / fit;
      mouse.ty = cy / fit;
      mouse.ton = 1;
    });
    host.addEventListener('pointerleave', () => (mouse.ton = 0));
  }

  const t0 = performance.now();
  const draw = () => {
    const time = reduced ? 0 : (performance.now() - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.on += (mouse.ton - mouse.on) * 0.08;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, W, H);
    gl.uniform1f(u.fit, fit);
    gl.uniform1f(u.p, reduced ? 1 : portraitState.p * portraitState.a);
    gl.uniform1f(u.g, portraitState.g);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.mouse, mouse.x, mouse.y);
    gl.uniform1f(u.mouseOn, mouse.on);
    gl.uniform2f(u.tilt, mouse.on * mouse.x * 0.35, -mouse.on * mouse.y * 0.25);
    gl.uniform1f(u.spacing, (STEP / data.srcH) * fit * (H / 2));
    gl.drawArrays(gl.POINTS, 0, data.n);
  };

  // Loop só quando visível (aba ativa + elemento na tela)
  let visible = true, raf = 0;
  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(loop);
    else draw();
  };
  new IntersectionObserver(([en]) => ((visible = en.isIntersecting), sync())).observe(host);
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(host);
  new MutationObserver(theme).observe(document.documentElement, { attributeFilter: ['data-theme'] });

  theme();
  resize();
  sync();
  (window as any).__portraitReady = true;
  return data.n;
}
