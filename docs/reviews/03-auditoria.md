# Auditoria de jurado — Tela de conexão + Hero (16/11/2026)

Tema padrão: **claro** (decisão do Hiwan). Escuro opcional.
Ferramentas: `scripts/audit.mjs` (build de produção), `scripts/capture.mjs`, `scripts/boot-capture.mjs`.

## Medições (produção)

| Item | Resultado |
|---|---|
| JS / CSS (gzip) | 32,5 KB / 4,7 KB · fontes latinas ~41 KB |
| 1ª pintura | Loader cobre desde o 1º quadro (sem flash do hero) |
| LCP (com loader / visita repetida) | 0,14 s / 1,65 s |
| CLS | 0,02 / 0,003 |
| Rede lenta (400 kbps, 300 ms) | loader sai em 5,9 s, hero completo em 7,4 s (segura em 92% até os assets) |
| axe WCAG 2.1 AA (claro e escuro) | **0 violações** (após correções) |
| Dobra | cabe em 1440×900, 1920×1080 e 1366×768 |

## Corrigido nesta auditoria

| Problema | Correção |
|---|---|
| Leitor de tela lia "sistemas que sistemas que funcionam. funcionam." | `content: attr(data-text) / ''` no `::after` da seleção |
| Contraste AA falhando nos tipos de coluna (`opacity:.6`) | Hierarquia por cor (ink-2 / ink-3); tipos `aria-hidden` |
| Nome acessível ≠ texto visível no botão de idioma (WCAG 2.5.3); rótulos só em PT | Texto visível + ação em `sr-only`, traduzidos |
| Anel de foco lima invisível no papel (WCAG 2.2) | Foco em tinta no tema claro |
| 1920: headline ocupava 60% da célula, vazio acima | Container query: fonte pelo espaço real da célula (85px em 1440, 129px em 1920) |
| 1366×768: botões abaixo da dobra | Modo compacto para telas baixas |
| Sem favicon / theme-color | Adicionados |

## Notas de jurado

### Tela de conexão — 7,7
| Design 7,5 | Usabilidade 7,5 | Criatividade 8,5 | Conteúdo 7,5 |
|---|---|---|---|

O momento mais autoral do site até agora. Ponto fraco: duração (4,1 s / 5,6 s até o hero completo) no limite.

### Hero — 7,4
| Design 7,2 | Usabilidade 8,5 | Criatividade 6,5 | Conteúdo 6,5 |
|---|---|---|---|

Execução técnica de nível alto (a11y limpa, leve, responsivo real). Mas, depois que a intro termina, **o hero fica estático**: nenhuma camada de interação, nenhum momento de assinatura, e 1/3 da dobra é placeholder.

## Veredito

- **Tela de conexão: finalizada** (resta decidir a duração).
- **Hero: ~80%.** Faltam foto, camada de interação e copy final de `funcao`/`base`.
- **Nível hoje:** faixa de *Honorable Mention*. SOTD pede média ≥ 7,5 **com um momento memorável** e o **site inteiro**: uma dobra não é submetível.

## Enxugar

1. Pausa do Pesquisador de Objetos: −0,3 s (recomendado).
2. Nada mais: os 4 sinais de progresso do loader têm papéis distintos (contador = escala, barra = vira a transição, status = estado, log = narrativa só no desktop).

## Aplicar (por impacto)

1. **Foto + decodificação em WebGL** no BLOB (Criatividade +1,5 estimado). Bloqueado pela foto.
2. **Camada de interação do hero:** cruz de linha/coluna na tabela de resultado ao passar o mouse; clique na célula "copia" o valor (toast `1 valor copiado`); CTA com leve atração magnética.
3. **Copy final:** `funcao` e `base`.
4. **Ponte para a seção 2** (o scroll escreve a próxima query).
5. **Antes de publicar:** imagem OG 1200×630 (crítica para o LinkedIn), og:title/description, canonical.
