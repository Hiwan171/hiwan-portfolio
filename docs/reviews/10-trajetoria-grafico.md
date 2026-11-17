# Revisão — Seção 3 v2: trajetória como gráfico

Motivo (Hiwan, 16/11): as seções 2 e 3 tinham "muito texto, muita fonte, pouca sensação de prêmio". Os 7 cartões eram quase vazios e repetiam o mesmo layout.

## Conceito

O título vira imagem: **uma linha em degraus** (estudante → aprendiz → auxiliar → assistente → sênior) desenhada pelo scroll, em tela fixa, com área hachurada (linguagem de BI). A ponta da linha comanda tudo:
- **ano gigante vazado** ao fundo, como odômetro;
- **rótulos dos cargos** (5, os únicos textos grandes) surgem quando a ponta chega ao degrau;
- **eventos** (formação, certificação, construiu) viram pontos que "brotam" na linha;
- **linha de resultado** embaixo: o `STRING_AGG` do ano atual (2021 não tem linha: `GROUP BY`).
No fim, a ponta lima pulsa e aparece `HOJE + projetos para outras empresas`.

Mobile: sem tela fixa, desenha ao passar; rótulos abaixo da linha. Reduced-motion: gráfico completo. Leitor de tela: lista completa dos 7 anos / 18 eventos (o gráfico é `aria-hidden`).

## Correções

| Problema | Correção |
|---|---|
| Rótulo "Auxiliar de TI" cortado pelo degrau seguinte | largura do rótulo limitada ao trecho (quebra em 2 linhas) |
| Chip "HOJE" atravessava o último degrau | em coluna, alinhado à direita, limitado ao último trecho |
| Anéis vazios dos eventos futuros pareciam sujeira | pontos ocultos até a ponta passar; surgem com mola |
| Hachura + ano vazado carregados no fim | hachura com `--line` |
| Rótulos colidindo no mobile | no estreito, rótulos abaixo da linha (abaixo de um degrau só há área) |

## Verificação

`node scripts/path-capture.mjs`: axe 0; sem erros; barra/seção estáveis no scroll rápido (0/92 px em 12 quadros); 1440 claro, 1280 escuro, 390 escuro EN.

## Nota de jurado (seção)

| Design 9,0 | Usabilidade 8,5 | Criatividade 9,0 | Conteúdo 8,5 | **Ponderada 8,8** |
|---|---|---|---|---|

Aguardando aprovação do Hiwan. Próximo: seção 2 (lista gigante + artefato vivo).
