# Revisão — Hero (v1 → v6)

Capturas: `captures/hero-v6/` (estados finais) · `captures/hero-v6/frame-*.png` (intro) · `captures/interact/` (toggles).

## Histórico de correções

| Versão | Problema encontrado | Correção |
|---|---|---|
| v1 | "que" lido como "aue" | Não era a fonte: a máscara (`overflow:hidden` + `line-height:.92`) cortava descendentes. Folga de .2em. Fonte testada contra 6 alternativas (`lab/fonts.html`); Funnel Display mantida. |
| v1 | Scroll horizontal no mobile (página com 477px em 390) | Query em 5 linhas; `overflow-x: clip` no html. |
| v1 | Headline só aparecia após 2,3 s | Digitação 0,85 s; foto revela junto. |
| v1 | Coluna `stack` truncada | Larguras por coluna. |
| v1 | `ink-3` abaixo de AA | Tokens ajustados (≥ 4.5:1) nos dois temas. |
| v2 | Botões abaixo da dobra em 1440×900 | `--fs-display` limitado por altura (`9.4svh`). Página = 900px exatos. |
| v2 | Headline deslocada 21px no mobile | `align-self: end` da grade vazava para o flex. |
| v3 | Topo das ascendentes vazando na máscara | Deslocamento inicial 140%. |
| v3 | Quadros de estudo não mostravam a digitação | `seek(t, false)` (ferramenta, não animação). |
| v4 | Headline começava em 1,7 s, não 1,2 s | `.call()` sem posição ia para o fim da timeline; label `typed`. |
| v5 | Texto marcado escurecia antes do realce | Realce virou seleção real: fundo + texto escuro com o mesmo recorte (`--sweep`). |

## Crítica de jurado (v6)

| Critério | Nota | Leitura |
|---|---|---|
| Design (40%) | 7.0 | Hierarquia clara, par tipográfico forte, acento usado com disciplina. Risco: lê como uma UI muito bem feita, não ainda como direção de arte. O BLOB vazio ocupa 1/3 da dobra. |
| Usabilidade (30%) | 8.0 | Cabe na dobra, CTA óbvio, AA, mobile limpo, reduced-motion, preferências persistem. Âncoras do menu ainda sem destino. |
| Criatividade (20%) | 6.0 | Conceito legível (query → resultado, seleção de editor), mas falta o **momento de assinatura**. |
| Conteúdo (10%) | 7.0 | Headline específica e verdadeira. `funcao` e `base` ainda genéricos. |
| **Ponderada** | **7.1** | Passa no corte (7), mas **não é nível de prêmio ainda**. |

## O que leva o hero a 8+

1. **Foto como assinatura (WebGL):** a coluna BLOB "decodifica" a foto: pixels/dither em tons do tema que se resolvem na imagem; reage ao cursor. Precisa da foto.
2. **Transição para a próxima query** pelo scroll (é a ponte para a seção 2).
3. **Microinterações da tabela:** hover de linha/coluna, cursor que vira seleção.
4. **Preloader** curto (`connecting…` → `connected`), só na 1ª visita.

## Pendências de conteúdo

- Título de `funcao` (como você quer ser chamado).
- `base`: cidade/estado ou só "Brasil".
- Foto (ver orientação no relatório ao Hiwan).
