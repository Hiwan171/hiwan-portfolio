# Revisão — Retrato em partículas, camada de interação e ponte para projetos

## 1. Retrato em partículas (WebGL2 puro, sem biblioteca)

Conceito: as partículas começam **espalhadas** pela moldura e se **organizam no rosto**, o que é literalmente a headline ("transformo dados espalhados em sistemas que funcionam").

**Pipeline** (`scripts/photo/prepare.py`, rembg `u2net_human_seg`, MIT): segmentação → recorte de busto → apaga celular/mão (polígono) → **espelha** (selfie de espelho é invertida; o olhar passa a apontar para a headline) → nitidez local (traços sobrevivem às partículas) → degradê na base → PNG cinza+alfa em meia resolução (**25 KB**). Para trocar a foto: rodar o script com a nova imagem, ajustando `--box`/`--erase`.

**Comportamento:** meio-tom de tinta no claro (tamanho pela escuridão), pontos claros no escuro; ~2,4% das partículas em lima ("dados"); cursor afasta partículas e inclina o rosto em 3D; deriva mínima em repouso; render só quando visível; reduced-motion = retrato montado e parado; sem WebGL2 = imagem estática. A aba mostra `BLOB · 19.368 PTS`.

| Versão | Problema | Correção |
|---|---|---|
| v10 | Fantasma do celular ao lado do rosto | Borda do polígono 9px à direita do real (medido no canal alfa) |
| v10 | Rosto ilegível (olhos/óculos sumiam) | Nitidez local + densidade dobrada + tamanho de ponto quadrático |
| v10 | Enquadramento pequeno, 30% vazio | Recorte em cabeça e ombros |
| v12 | Rosto só aparecia aos ~2,3 s | Ease-out por partícula + atrasos menores: forma surge aos ~1,5 s |
| v13 | Quadros de estudo mostravam o loader | `?at=` pula a tela de conexão |
| v14 | Rede lenta: loader de 5,9 s → 9,6 s | PNG de 210 KB → 25 KB (LA, meia resolução); prévia fora de `public/` |

## 2. Camada de interação do hero

- Cruz de coluna na tabela de resultado (linha de seleção no cabeçalho).
- Clique copia o valor; a célula pisca em lima e a aba mostra `✓ copiado: '…'` (anunciado via `aria-live`). Sem permissão de clipboard, não finge que copiou.
- CTA principal magnético (só mouse; desligado em reduced-motion).
- Corrigido: aviso em caixa alta mostrava o valor diferente do copiado.

## 3. Ponte hero → projetos

- O editor do hero sai da tela → a **barra de query fixa** desce de dentro da barra de conexão com **a mesma query** (continuidade).
- A seção ocupa ~65% da tela → a barra **apaga e redigita** `SELECT projeto, area, stack, resultado FROM dbo.projetos ORDER BY impacto DESC;` → `▸ executando…` → `✓ 5 linhas · 0,018 s`; as linhas chegam como result set.
- Scroll suave (Lenis), parado durante a tela de conexão; âncoras do menu passam pelo Lenis.
- Dados: só o confirmado em `docs/01-cases.md`.

| Versão | Problema | Correção |
|---|---|---|
| v1 | Reescrita disparava junto com o aparecimento da barra (continuidade perdida) | Gatilho em 35% |
| v1 | "dbo . projetos" | Prefixo colado na linha de base |
| v1 | Hover "grudava" no toque (mobile) | Hover só em `(hover: hover)` |

## Medições (produção)

| Item | Antes | Agora |
|---|---|---|
| JS gzip | 32,5 KB | 60,1 KB (GSAP ScrollTrigger + Lenis + retrato) |
| axe WCAG 2.1 AA | 0 | 0 (claro e escuro) |
| Rede lenta: loader / hero | 5,9 / 7,4 s | 6,4 / 8,1 s |
| FPS do retrato | — | 46 headless (render por software); esperado 60 com GPU |

## Notas de jurado (hero agora)

| Design 8,0 | Usabilidade 8,5 | Criatividade 8,0 | Conteúdo 7,0 | **Ponderada 8,0** |
|---|---|---|---|---|

O hero deixou de ser "UI bem feita": o retrato é o momento de assinatura e está amarrado ao conceito. Conteúdo segue limitado por `funcao`/`base` genéricos.

## Pendências

- Função e cidade do Hiwan.
- Linguagem do cadastrador (Python?) para a coluna `stack`.
- Foto definitiva (parede lisa, de frente, sem celular) quando houver: mesmo pipeline.
- Próximo: janela de artefato ao clicar numa linha (começar pelo terminal do cadastrador).
