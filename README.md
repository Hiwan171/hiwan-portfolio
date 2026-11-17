# SELECT * FROM hiwan

Portfólio de Hiwan — desenvolvedor full stack (SQL Server, Python, Power BI, web). O site inteiro é uma consulta SQL que "executa" conforme o visitante navega.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produção em dist/ (no deploy: SITE_URL=https://dominio npm run build → canonical/og absolutos)
```

Parâmetros úteis na URL: `?boot` (força a tela de conexão), `?static` (pula animações), `?theme=light|dark`, `?lang=pt|en`, `?at=1.5` (congela a intro do hero em 1,5 s), `?bootat=2` (congela a tela de conexão).

## Revisão visual (Playwright)

```bash
npx playwright install chromium        # uma vez por máquina
npm run capture -- <nome>              # hero: temas × idiomas × larguras + quadros da intro
node scripts/boot-capture.mjs <nome>   # tela de conexão
node scripts/bridge-capture.mjs <nome> # ponte hero → projetos (tela fixa)
node scripts/proj-capture.mjs <nome>   # projetos: lista | painel com artefato vivo
node scripts/path-capture.mjs <nome>   # trajetória (gráfico em degraus, tela fixa)
node scripts/hero-final.mjs            # menu mobile, foco, link ativo, tema
npx vite build && node scripts/audit.mjs   # auditoria de produção: LCP/CLS, rede lenta, axe, teclado
node scripts/og-capture.mjs            # imagem de compartilhamento 1200×630 → public/og.png
```

Capturas vão para `captures/` (fora do git).

## Retrato em partículas

O retrato (`public/photo/portrait.png`) é gerado a partir de uma foto:

```bash
python -m venv .venv && .venv/Scripts/python -m pip install -r scripts/photo/requirements.txt
.venv/Scripts/python -I scripts/photo/prepare.py "<foto.jpg>" public/photo --box "x0,y0,x1,y1" --erase "x,y;x,y;..."
```

`--box` recorta o busto e `--erase` apaga objetos (coordenadas da foto original). Prévia em `captures/photo/`.

## Estrutura

- `src/` — `main.ts` (hero + intro), `preloader.ts` (tela de conexão), `portrait.ts` (WebGL), `bridge.ts` (ponte em tela fixa), `qbar.ts` (barra de query), `projects.ts` + `artifacts/` (lista | painel e artefatos), `path.ts` (trajetória), `i18n.ts` e `path-data.ts` (textos PT/EN).
- `docs/` — direção, fatos dos cases e da trajetória, revisões de cada etapa.
- `CLAUDE.md` — contexto completo para continuar com o Claude Code.
