# Revisão — Ponte hero → projetos em tela fixa (1º dos 2 momentos "pinned")

Decisão do Hiwan (16/11/2026): fluxo vertical; tela fixa só na ponte hero → projetos e na trajetória.

## Roteiro (scroll = 110% da altura da tela; scrub reversível)

| Progresso | Tela |
|---|---|
| 0–0,32 | headline sai por cima; retrato volta a ser dados espalhados; tabela e botões somem |
| 0,15–0,60 | o editor apaga `SELECT * FROM hiwan…` e digita `SELECT projeto, area, stack, resultado FROM dbo.projetos ORDER BY impacto DESC;` |
| 0,60–0,66 | `▸ executando…` → `✓ 5 linhas · 0,018 s`; aba do resultado "5 linhas" |
| 0,66–0,95 | `dbo.projetos` sobe no lugar da headline; "✓ 5 linhas · role para ver o resultado ↓" |
| fim | a tela solta; o hero transformado vira o cabeçalho da tabela de projetos |

Só desktop e sem reduced-motion (`gsap.matchMedia`). No mobile vale o comportamento vertical anterior (título e aba da seção visíveis). Com a ponte ativa, título e aba da seção de projetos ficam só para leitores de tela (o visual vem do hero).

## Correções

| Problema | Causa | Correção |
|---|---|---|
| Título `dbo.projetos` nunca aparecia | `transform` no CSS virava px no GSAP; o `yPercent` animava por cima | estado inicial via `gsap.set` no contexto do matchMedia |
| Barra de query visível durante a tela fixa (query duplicada) | gatilho da barra recalculado antes da ponte | `pinnedContainer` + `refreshPriority: 1` na ponte + `refresh` |
| Três "5 linhas" seguidos no fim | aba da seção duplicava a do hero | aba da seção oculta com a ponte ativa |
| Troca de idioma no meio da ponte | a ponte registraria valores do meio da animação | hero vai ao estado final (`settleHero`) e a ponte é reconstruída no progresso atual |

## Verificação (`scripts/bridge-capture.mjs`)

Desce: hero fixo em todas as fases; query reescrita; status e cena da barra corretos; barra oculta durante a tela fixa e visível depois. Volta ao topo: hero restaurado por inteiro (rosto, headline, tabela, botões, query). Idioma no meio: reconstrói em EN e volta certo. Mobile: sem tela fixa. Regressão: casos (axe 0, rolagem 92px), menu mobile, auditoria de produção (axe 0 nos dois temas).

Observação: no desktop, o link "projetos" para a seção a 404px do topo apenas porque a página ainda termina logo depois dela (rolagem máxima 1.499px; seção em 1.890px). Resolve-se com as seções 3 e 4.

## Adendo: a célula da foto vira a grade de resultado

Pedido do Hiwan: no fim da ponte, a célula "FOTO · BLOB" ficava com pontos soltos sem função.
Solução: as partículas ganham um 3º destino. Arco completo: dados espalhados → rosto (o sistema) → dados → **grade de resultado** (5 linhas × colunas espelhando a tabela de projetos; marcadores `#` em lima; linhas divisórias). A aba vira `RESULTADO · 5 × 4` e volta a `FOTO · BLOB · 19.368 PTS` ao rolar para cima. O cursor continua afastando os pontos na grade.

Ajuste: primeira versão parecia tarja de censura (pontos densos e opacos); pontos mais finos e translúcidos leem como texto pontilhado.

Referência guardada para a trajetória (enviada pelo Hiwan): páginas deslizando na horizontal com leve distorção por velocidade.

## Nota de jurado (hero + ponte + projetos)

| Design 8,5 | Usabilidade 8,5 | Criatividade 9,0 | Conteúdo 8,5 | **Ponderada 8,6** |
|---|---|---|---|---|

A ponte é o momento em que o conceito vira experiência: o visitante *vê* a consulta mudar e o resultado chegar.
