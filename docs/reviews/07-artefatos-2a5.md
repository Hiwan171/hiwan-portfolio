# Revisão — Artefatos 2 a 5

Diretriz do Hiwan: simular com o máximo de realismo, sem expor a aplicação real.
Landing pages: autorizado mostrar as marcas reais (16/11/2026).

## O que cada artefato mostra

| # | Artefato | Real | Ilustrativo (dito na janela) |
|---|---|---|---|
| 2 | App de envio em massa: campanha, contadores (enviados / na fila / reenviados), lista com status, "serviço terceirizado: dispensado" | serviço pago substituído por app Python interna | volume (1.240), campanha, destinatários (mascarados) |
| 3 | `CREATE VIEW` com JOIN e CASE sendo escrito → `SELECT` → grade de resultado → "Exportar .xls" → arquivo salvo para a diretoria | views SQL Server com joins/CASE, entregues em .xls | esquema e dados |
| 4 | Dashboard "Motivos de Não Coleta": filtros, 3 KPIs, barras por motivo, linha semanal; tooltip por marca; tabela para leitores de tela | o painel existe e está em uso | números (coerentes: 31+22+18+14+8+4 = 97 de 1.284 = 7,6%) |
| 5 | Navegador com 4 abas (Colefar, Ambientec, Colenorte, Biocoletas): troca de marca e rola a página; visitante pode rolar dentro da janela; "abrir site ↗" | capturas reais dos sites no ar | — |

Dataviz (BI): KPIs como blocos (não gráfico); barras horizontais de série única, sem legenda, pontas de 4px, vão de 2px; linha 2px; textos em tokens de texto; tooltip; tabela equivalente `sr-only`.

Peso: capturas em WebP (83–122 KB cada), carregadas só ao abrir o caso 5; demais abas pré-carregadas depois da primeira.

## Correções

| Problema | Correção |
|---|---|
| `min-height: 7 * 30px` sem `calc()` (regra ignorada) | `calc()` |
| BI: rótulos cortados ("Resíduo não segre…") | rótulos curtos |
| BI: `preserveAspectRatio="none"` distorcia textos do eixo | proporção preservada |
| Abas inativas abaixo de 4,5:1 (axe) | `ink-2` |
| Mobile, caso 5: painel mais largo que a tela | `minmax(0, 1fr)` (o `1fr` não encolhia abaixo das abas) |

## Medições

axe WCAG 2.1 AA: 0 em todos os casos abertos (claro/PT, escuro/EN, mobile). JS gzip 70,5 KB, CSS 7,9 KB. Rede lenta: loader 6,7 s / hero 8,3 s. LCP visita repetida 1,8 s; CLS 0,003.

## Nota de jurado (seção 2 completa)

| Design 8,5 | Usabilidade 8,5 | Criatividade 9,0 | Conteúdo 8,5 | **Ponderada 8,6** |
|---|---|---|---|---|

Cinco provas, cinco linguagens visuais (terminal, app, editor SQL, BI, navegador) costuradas por uma só (a tabela e a barra de query). Conteúdo subiu: casos concretos, marcas reais no caso 5.

## Próximo

- Decisão do Hiwan: ponte hero → projetos em tela fixa (pinned) e trajetória horizontal.
- Seção 3 (trajetória, `GROUP BY ano`) e contato (`INSERT INTO contato` / `COMMIT`).
