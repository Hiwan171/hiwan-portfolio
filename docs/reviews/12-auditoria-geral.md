# Auditoria geral de jurado — site inteiro (16/11/2026)

Escopo: tela de conexão → hero → ponte → projetos → trajetória → fim da página. Build de produção.
Configurações vistas: 1440×900 claro PT, 1440×900 escuro EN, 1920×1080, 1366×768, 390×844 claro e escuro.
Ferramentas: `scripts/audit.mjs` + varredura própria em `captures/full-audit/` (`sweep.mjs`, `mobile-check.mjs`).

## Medições

| Item | Hoje | Auditoria 03 | Situação |
|---|---|---|---|
| JS / CSS (gzip) | 76,4 KB / 9,3 KB | 32,5 / 4,7 | ok (artefatos + GSAP) |
| LCP 1ª visita (com tela de conexão) | **5,45 s** (headline) | 0,14 s | ruim (> 4 s) |
| LCP visita repetida | **2,82 s** | 1,65 s | precisa melhorar (> 2,5 s) |
| CLS desktop | 0,05 / 0,003 | 0,02 / 0,003 | ok |
| CLS mobile durante a rolagem | altura da página oscila **3423 ↔ 4773 px** | — | **bug** |
| Rede lenta (400 kbps) | loader 6,8 s · hero 8,5 s | 5,9 / 7,4 | piorou 1 s |
| axe WCAG 2.1 AA (claro/escuro) | 0 violações | 0 | ok |
| Erros de console | 0 | 0 | ok |
| Âncoras quebradas | **`#contato` ×3** (nav, CTA do hero, menu mobile) | — | **bug** |
| og:image / og:title / canonical | ausentes | ausentes | bloqueia o LinkedIn |

## Bugs (corrigir antes de qualquer polimento)

| # | Problema | Evidência | Correção proposta |
|---|---|---|---|
| B1 | **Mobile: scroll pula para trás.** Artefatos desmontam com `host.innerHTML = ''` e a altura cai a zero; a página encolhe e o Lenis reposiciona. Rolando sempre para baixo, `scrollY` foi 2438 → 2189 → 2587 → 2080. | `mobile-check.mjs` | Reservar a altura: guardar `offsetHeight` em `min-height` antes de limpar (`projects.ts:213`), ou altura fixa por tipo de artefato no CSS. |
| B2 | **Mobile: a trajetória nunca termina.** `end: 'bottom 55%'` é inalcançável porque a página acaba antes; o gráfico para em 2023 e "Sênior" fica fantasma. | `m-end-wait.png` | `end: 'bottom bottom'` (ou `'max'`) em `path.ts:267`; a seção de contato depois também resolve. |
| B3 | **`#contato` não existe.** "Entrar em contato" (o 2º CTA do hero), a nav e o menu levam a lugar nenhum; o site termina seco no gráfico, sem rodapé nem fechamento. | `audit.mjs` | Seção 4 (pendência 1 do CLAUDE.md). |
| B4 | **Sem metadados de compartilhamento.** No LinkedIn o link sai sem imagem nem título próprio. | `audit.mjs` | og:image 1200×630, og:title/description, canonical, twitter:card. |

## Problemas de design e usabilidade

| # | Onde | Problema | Sugestão |
|---|---|---|---|
| D1 | Ponte (1440, y≈540) | **Quadro vazio no meio da transição**: headline já saiu, resultado vazio, editor com 2 linhas; ~70% da tela em branco. É o 1º scroll do jurado. | Sobrepor as fases: `dbo.projetos` começa a subir enquanto a headline sai; a grade da tabela de resultado já desenha as 5 linhas vazias antes de o rosto virar grade. |
| D2 | Fim da ponte → projetos | **Faixa morta de 180–230 px** com "✓ 5 linhas · role para ver o resultado ↓" depois que a ponte solta; em 1920 sobra também o divisor vertical do hero (x=1280). | Ao soltar o pin, a faixa vira o cabeçalho da lista (encolhe para 40 px) ou some; esconder o divisor residual. |
| D3 | Trajetória | **Ano gigante cortado a 16 px da borda** (o "6" de 2026 termina em x=1424). Parece erro, não sangria intencional. | Sangrar de verdade até a borda da janela ou caber inteiro. |
| D4 | Trajetória | **Pontos de evento sem rótulo**: 5 pontos em 2024 sem dizer o que são; só a linha de baixo explica, e só o ano atual. | Hover/foco no ponto mostra o evento (tooltip no estilo dica do SSMS) e destaca o item na linha de resultado. |
| D5 | Artefato 3 (view SQL) | Escalado para caber, o código fica com ~10 px em 1440. Ilegível. | Menos colunas na view ou painel mais alto; o result set pode rolar dentro. |
| D6 | Primeira visita | Tela de conexão + intro = **5,4 s** até o hero completo. Ótima na 1ª vez; longa para quem vem do LinkedIn no celular. | Cortar ~1 s (pausa do Pesquisador, contador mais rápido no fim) e permitir pular por tecla ou toque em qualquer lugar (hoje "clique para pular" é discreto). |
| D7 | EN | Nav "path" ≠ tabela `dbo.career`. | Nav "career". |
| D8 | Mobile hero | CTAs só aparecem depois de ~1,7 telas. | Aceitável; opcional: botão compacto "▸ projetos" fixo na barra de query no mobile. |

## Limpeza técnica

- 5 pacotes de fonte não usados em `package.json` (archivo, bricolage, familjen, host-grotesk, schibsted).
- Investigar o LCP de 2,8 s na visita repetida: a headline deve pintar antes de o retrato ficar pronto.

## Notas de jurado

Rubrica: Design 40 · Usabilidade 30 · Criatividade 20 · Conteúdo 10. Mais rígida que as notas por seção (que avaliaram cada parte isolada no desktop).

### Por seção

| Seção | Design | Usab. | Criat. | Cont. | **Ponderada** |
|---|---|---|---|---|---|
| Tela de conexão | 8,0 | 7,0 | 8,5 | 7,5 | **7,8** |
| Hero | 8,5 | 8,0 | 8,0 | 7,5 | **8,2** |
| Ponte (tela fixa) | 7,0 | 7,0 | 8,5 | 7,0 | **7,3** |
| Projetos — desktop | 8,8 | 8,0 | 8,5 | 9,0 | **8,5** |
| Projetos — mobile | 8,0 | 5,0 (B1) | 8,0 | 9,0 | **7,2** |
| Trajetória — desktop | 8,8 | 7,5 | 8,5 | 8,5 | **8,3** |
| Trajetória — mobile | 7,5 | 5,0 (B2) | 8,0 | 8,0 | **6,9** |
| Contato / fechamento | — | — | — | — | **ausente** |

### Site inteiro, como um jurado veria hoje

| Design 8,3 | Usabilidade 6,0 | Criatividade 8,5 | Conteúdo 7,0 | **Ponderada 7,5** |
|---|---|---|---|---|

**Desenvolvimento (nota separada): 7,0.** Leve, axe limpo, sem erros; perde por LCP, pelo pulo no mobile e pelas âncoras quebradas.

**Veredito:** conceito e direção de arte já estão em nível de SOTD (a coerência do `SELECT * FROM hiwan` é rara). O que derruba é usabilidade: um jurado clica em "Entrar em contato" e nada acontece, e o site não tem final. Com B1–B4 + D1–D4 a projeção é **8,3–8,5** (faixa SOTD/Developer Award).

## Efeitos novos (dentro do conceito, sem enfeite)

1. **`COMMIT` que fecha o círculo** (seção 4): ao enviar, a linha entra numa grade `dbo.contato` com `(1 linha afetada)`; a barra de query mostra `COMMIT TRANSACTION;` e a linha de varredura da tela de conexão volta e "desconecta" a sessão. Começo e fim com o mesmo gesto.
2. **Rodapé = barra de status do SSMS**: `Consulta executada com êxito · 00:02:41 · 5 queries · hiwan.db`, com o **tempo real que o visitante passou no site** e quantas queries a navegação executou. Barato e memorável.
3. **Console opcional** (`/` ou `Ctrl+K`): o visitante digita `SELECT * FROM dbo.projetos WHERE area = 'bi'` e a lista filtra; erro de digitação devolve `Msg 207, nome de coluna inválido`. Cumpre o "digitar é um extra opcional" da direção. Ponto forte de Criatividade.
4. **404 como erro do SQL Server**: `Msg 208, Nível 16 — Nome de objeto inválido 'dbo.<rota>'` com link de volta.
5. **Tooltip de plano de execução** nos números gigantes dos projetos (custo %, linhas estimadas × reais) com dados ilustrativos sinalizados. Opcional; só se não poluir.

## Ordem recomendada

1. B1 + B2 (mobile), D7, fontes não usadas: rápido.
2. Seção 4 de contato + rodapé de status (resolve B3 e dá o final que falta) → precisa dos canais do Hiwan.
3. B4 (OG) + D6 (encurtar a tela de conexão) + LCP.
4. D1–D5 (ponte e trajetória).
5. Console opcional e 404.

---

## Correções aplicadas (16/11, mesma sessão)

| # | Correção | Verificação |
|---|---|---|
| B1 | Altura de cada artefato no mobile medida antes e **sempre reservada** (`min-height`, só cresce); um `ResizeObserver` dá `ScrollTrigger.refresh()` quando uma janela cresce. | página estável em ~6200 px (antes oscilava 3423 ↔ 4773); scroll só avança; artefatos montam em ordem |
| B2 | Fim do gatilho do gráfico no mobile limitado ao `maxScroll`; tween em `fromTo` (o `.to()` com `invalidateOnRefresh` regravava o início no meio da rolagem). | gráfico chega a 2026 no fim da página |
| B4 | og:title/description/image (1200×630 gerada do hero: `scripts/og-capture.mjs`), twitter:card; canonical/og:url absolutos via `SITE_URL=… npm run build` (`vite.config.ts`). | build com e sem `SITE_URL` |
| LCP | A ponte deixou de usar `pin` do GSAP: agora é `position: sticky` dentro de `.hero-spacer` (o pin tirava e devolvia o hero ao DOM a cada refresh, e o Chrome recontava a headline como conteúdo novo no fim da intro). | LCP **0,16 s** (1ª visita, era 5,45) · **1,45 s** (repetida, era 2,84) |
| D1 | Ponte reordenada: a headline sai de baixo para cima enquanto a query é digitada; `dbo.projetos` sobe no lugar de "funcionam."; a tabela só sai quando o aviso entra. | quadros a cada 100 px: nenhum vazio, nenhuma colisão |
| D2 | A lista de projetos sobe por cima da faixa do aviso (margem negativa = `--handoff-h`); a aba "resultado · 5 linhas" do hero vira o cabeçalho das linhas. | sem faixa morta; âncora `#projetos` cai em 92 px |
| D3 | `padding-right: .08em` na máscara do odômetro (o `letter-spacing` negativo cortava o último dígito). | "2026" inteiro |
| D4 | Hover nos pontos de evento: dica com ano · tipo · evento · onde; ponto cresce em lima. | claro e escuro |
| D5 | View SQL: editor de 10 linhas que acompanha o cursor, fonte 0,8125rem. | escala do artefato 0,98 em 1440 (era ~0,85, ~10 px) |
| D6 | Tela de conexão ~0,45 s mais curta; intro do hero 0,25 s mais cedo; "toque para pular" no celular. | hero completo em ~5,0 s (era 5,4) |
| D7 | Nav EN "career". | — |
| — | Fontes do estudo tipográfico (`lab/fonts.html`) movidas para `devDependencies`. | — |

Regressão: `bridge-capture` (desce, volta, idioma no meio, mobile), `proj-capture` (axe 0, painel em 92 px), `path-capture` (axe 0, 0/92 px no scroll rápido), `hero-final` (menu, foco, âncoras), `audit.mjs` (axe 0 claro/escuro). Sem erros de console.

**Pendente:** B3 (seção de contato: depende dos canais do Hiwan) e D8 (opcional).

### Notas após as correções

| Seção | Antes | Depois |
|---|---|---|
| Tela de conexão | 7,8 | 7,9 |
| Ponte | 7,3 | 8,1 |
| Projetos — mobile | 7,2 | 8,1 |
| Trajetória — desktop | 8,3 | 8,6 |
| Trajetória — mobile | 6,9 | 7,7 |
| **Site inteiro** | **7,5** | **7,9** (Design 8,6 · Usab. 7,0 · Criat. 8,5 · Cont. 7,0) |
| Desenvolvimento | 7,0 | 8,0 |

Usabilidade só passa de 7 com a seção de contato: hoje "Entrar em contato" ainda não leva a lugar nenhum e o site não tem final.
