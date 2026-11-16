# Revisão — Seção 2: estrutura de casos + artefato 1 (terminal)

## Modelo de interação (decidido)

Clicar numa linha a expande como um `EXPLAIN` **dentro da tabela** (sem modal, sem página nova): à esquerda `problema → solução → resultado`; à direita o artefato rodando. Um caso aberto por vez. A barra de query vira `SELECT * FROM dbo.projetos WHERE id = n;` → `✓ 1 linha`; ao fechar, volta à lista.

Acessibilidade: cada linha é um `<button aria-expanded aria-controls>`; painel `role=region` rotulado pela linha; Esc fecha e devolve o foco; linhas de painel fechadas ficam `hidden` (fora da árvore de acessibilidade).

Arquitetura: `src/qbar.ts` (cenas da barra de query), `src/projects.ts` (linhas + casos), `src/artifacts/*.ts` (um módulo por artefato, interface `{ play, destroy }`).

## Artefato 1 — terminal do cadastrador

Sempre escuro (no papel vira pontuação forte; no tema escuro, um degrau mais escuro que a página). Roda ao abrir; `↻ executar de novo`; reduced-motion mostra o estado final.

Roteiro: comando → conexão SQL Server → leitura da view (50 registros) → autenticação na API → 6 `POST ✓ 201` com ~10 s cada → "acelerando a exibição" → barra 50/50 → resumo: **8 min 20 s vs 4 h 10 min – 8 h 20 min manual, ≈ 30 a 60× mais rápido**.

Honestidade: o único dado real é ~10 s vs 5–10 min por registro; o lote de 50, ids e endpoint são ilustrativos, e a janela diz isso no rodapé. As contas derivam do dado real.

## Correções durante a revisão

| Versão | Problema | Correção |
|---|---|---|
| v1 | Página não rolava até o caso (resumo do terminal abaixo da dobra) | Lenis conhece a altura final antes de rolar (`resize` com o painel em `auto`) |
| v1 | Contraste 4,41:1 no número da linha aberta | `ink-2` sobre fundo de hover (e no cabeçalho do hero) |
| v2 | 4 falhas de contraste no painel | Causa real: o hover das linhas também pintava a linha do painel. Hover só em `tr.row` |
| v3 | Comando `$ python …` rolava para fora do terminal | Janela de 400px: as 18 linhas cabem |
| v3 | Terminal sumia no tema escuro | Fundo um degrau mais escuro |
| v3 | Mobile: título sob o botão ×; barra de seleção sobre o "01" | Recuo do título; barra na borda da linha |
| v4 | Mobile: "8 h / 20 min" e "50 / registros" partidos; rodapé em 3 linhas | Modo compacto: pontilhados curtos, resumo quebrado em pontos pensados, botão sem quebra |
| v5 | Leitor de tela anunciava linhas vazias (painéis fechados) | `tr.detail` com `hidden` quando fechado |

## Medições

axe WCAG 2.1 AA: 0 (claro, escuro, caso aberto). JS gzip: 64,7 KB. Rede lenta: loader 6,5 s / hero 8,2 s. Rolagem até o caso: 92px exatos (desktop e mobile).

## Nota de jurado (seção 2 com o caso 1)

| Design 8,5 | Usabilidade 8,5 | Criatividade 8,5 | Conteúdo 8,0 | **Ponderada 8,5** |
|---|---|---|---|---|

O caso aberto é o ponto mais forte do site até agora: prova, não promessa.

## Próximos artefatos

2. Fila de e-mail (queue) · 3. View SQL + exportar .xls · 4. Dashboard BI (Motivos de Não Coleta) · 5. Navegador com landing page.
