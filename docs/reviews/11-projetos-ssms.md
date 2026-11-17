# Revisão — Seção 2 v2: projetos como o SSMS (lista | painel com artefato vivo)

Motivo (Hiwan, 16/11): "não tem aspecto premium de uau"; pediu visual **conexo ao tema, impressionante e organizado**. A tabela de 5 colunas escondia os artefatos (o melhor da seção) atrás de um "+".

## Conceito

O result set vira a janela do SSMS:
- **Esquerda — linhas**: nome grande + **número de impacto gigante** (30–60× · 100% · 5 · 3 · 4; só fatos de `01-cases.md`). Linhas fora de foco recuam (cor), a ativa ganha o seletor de linha (barra) e marca-texto lima no número.
- **Direita — painel `EXPLAIN · id = n`** preso ao lado (`sticky`; a lista rola, não é tela fixa: a decisão "tela fixa só na ponte e na trajetória" segue valendo). O artefato **roda ao vivo** ao ativar; troca com **linha de varredura** (gesto da tela de conexão); escala para caber.
- **Faixa do caso** em 3 colunas (problema | solução | resultado) embaixo do artefato.
- **Barra de query** reescreve `SELECT * FROM dbo.projetos WHERE id = n;` conforme a linha ativa (o scroll escreve a query).
- Clique na linha: leva ao meio da tela e ativa.

≤1100px: cada linha traz o próprio artefato (monta ao entrar na tela, desmonta ao sair) e o caso num `<details>` "ler o caso".

## Correções

| Problema | Correção |
|---|---|
| Linhas apagadas por opacidade: axe color-contrast (7) | apagadas por cor: `--ink-dim` só em texto grande (≥3:1), texto pequeno em `--ink-3` (≥4.5:1) |
| Painel subia junto na linha 5 | respiro no fim da lista |

## Verificação

`node scripts/proj-capture.mjs`: axe 0; sem erros; linhas 1–5 ativam por scroll com a query certa; clique ativa a linha 2; painel preso em 92 px até a linha 5; escala do artefato 0,75–1 (1366×768 a 1440×900); mobile monta os artefatos inline. Regressão da ponte ok; build ok (JS gzip 76 KB).

## Nota de jurado (seção)

| Design 9,0 | Usabilidade 8,5 | Criatividade 9,0 | Conteúdo 9,0 | **Ponderada 8,9** |
|---|---|---|---|---|

Aguardando aprovação do Hiwan.
