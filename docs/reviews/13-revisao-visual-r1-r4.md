# Revisão 13 — Varredura visual completa + correções R1–R4 (17/11/2026)

Varredura: `node scripts/review-sweep.mjs <nome>` (rola com a roda do início ao fim: 1440 claro PT, 1440 escuro EN, 390 claro PT). Verificação: `node scripts/fix-check.mjs`.

## Achados (não estavam na auditoria 12)

| # | Onde | Problema | Correção | Verificação |
|---|---|---|---|---|
| R1 | Fila de e-mail | "✓ campanha concluída · 1.240 enviados" visível desde o início (o `display:flex` anulava `hidden`) | `.q__done[hidden] { display:none }` | início `none`, fim `flex` |
| R2 | View SQL, BI, terminal, navegador | "Quadro zero" incoerente durante a varredura de troca: view vazia com "Exportar .xls"; BI com KPIs 0 e barras cheias; terminal preto; navegador preto | view: cursor num editor vazio + rodapé de exportação só com resultado; BI: KPIs, barras, linha e ponto zerados; terminal: prompt `$ ▌`; navegador: já nasce com a 1ª marca | capturas `r2-view-zero`, `r2-bi-zero` |
| R3 | Navegador (caso 5) | **Armadilha de scroll**: a roda/dedo sobre a janela rolava o site de dentro (`data-lenis-prevent` + `overscroll-behavior: contain`); no mobile a varredura travava em 4.800 de 5.314 px | solta = `overflow:hidden` (scroll passa para a página; o auto-scroll usa `scrollTop`); clique/toque/Enter **engata** (chip "↕ clique para navegar no site"); mouse fora, toque fora ou Esc solta | solta: página rolou 398 px; engatada: página 0 / site 400 px; mobile chega ao fim |
| R4 | Ponte → projetos | Cantos da moldura da foto sobravam como caixa vazia ao rolar | cantos somem quando o rosto vira grade (na timeline da ponte: reversível) | opacidade 0 na grade, 1 no topo |

## Regressão causada e corrigida na mesma sessão

O `show(0)` do R2 fazia o navegador baixar a captura da Colefar **no carregamento** (no mobile os artefatos são montados para medir a altura — correção B1), e o `preload` puxava as outras 3. A tela de conexão espera o `load`: rede lenta foi de 6,8 s para **14,9 s**. Correção: a imagem só é pedida após o `load`; artefato desmontado não pré-carrega. Resultado: **6,4 s / 8,1 s**.

## Regressão geral

`bridge-capture` (desce, volta, idioma no meio, mobile), `proj-capture`, `audit.mjs` (axe 0 claro/escuro, LCP 0,14 s / 1,55 s), `fix-check` (axe 0 em projetos). Sem erros de console.

## Lições de teste (Playwright)

- `locator.screenshot()` rola a página até o elemento: com o painel `sticky`, isso trocava a linha ativa. Usar `page.screenshot({ clip: boundingBox })`.
- `page.click()` faz um salto de scroll nativo antes de clicar e briga com o Lenis; para simular usuário, rolar com a roda até ver o alvo e usar `page.mouse.click()`.

## Ideias registradas (diretor criativo, a decidir com o Hiwan)

1. **Final = desconexão**: contato `INSERT INTO dbo.contato` → `(1 linha afetada)` → `COMMIT TRANSACTION;` → a linha de varredura da tela de conexão volta e "desconecta"; o ponto verde do topo apaga.
2. **Rodapé = barra de status do SSMS** com o tempo real no site e quantas queries a navegação executou.
3. **Console opcional (`/`)** filtrando a lista com SQL de verdade (sql.js), com erros do SQL Server.
4. Microlegenda na trajetória: "● passe o mouse nos eventos".

## Notas

| Seção | Antes | Depois |
|---|---|---|
| Projetos — desktop | 8,5 | 8,8 (sem quadros incoerentes) |
| Projetos — mobile | 8,1 | 8,5 (sem armadilha de scroll) |
| **Site inteiro** | 7,9 | **8,0** — Usabilidade ainda limitada pela falta de contato/fechamento |
