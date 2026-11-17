# CLAUDE.md — Portfólio do Hiwan

Contexto para continuar o projeto em qualquer máquina. Leia também `docs/00-direcao.md` (fonte única de decisões) e o `docs/reviews/` mais recente.

## Objetivo

Portfólio pessoal para LinkedIn **e** submissão a Awwwards / CSS Design Awards / FWA. Não pode parecer site padrão. Idiomas PT e EN (botão `SET LANG`). Tema **claro é o padrão** (como o SQL Server); escuro opcional.

## Conceito: `SELECT * FROM hiwan`

O site é uma consulta SQL que executa conforme a navegação. O visitante nunca precisa digitar.

1. **Tela de conexão** (1ª visita da sessão): diálogo no estilo do "Conectar ao servidor" do SSMS (estrutura reconhecível, visual próprio — não copiar a aparência da Microsoft) → Pesquisador de Objetos → a barra de progresso vira linha de varredura e encaixa na barra do topo.
2. **Hero**: editor com a query, headline "Transformo dados espalhados em sistemas que funcionam.", retrato em partículas WebGL (dados espalhados → rosto), tabela de resultado (função "Desenvolvedor full stack", base Belo Horizonte).
3. **Ponte em tela fixa** (só desktop): o editor reescreve para a query de projetos; o rosto vira dados e depois uma **grade de resultado**; `dbo.projetos` sobe no lugar da headline.
4. **Projetos** (v2, 16/11): como o SSMS — lista de 5 linhas (nome + número de impacto gigante) | painel `EXPLAIN · id = n` preso ao lado com o artefato rodando ao vivo (terminal, fila de e-mail, view SQL + .xls, dashboard Power BI, navegador com as 4 landing pages reais) e o caso em 3 colunas. A linha no meio da tela fica ativa e a barra de query vira `WHERE id = n`. ≤1100px: artefato dentro de cada linha.
5. **Trajetória** (2º e último momento em tela fixa; v2, 16/11): `STRING_AGG … GROUP BY ano` como **gráfico em degraus** (estudante → sênior) desenhado pelo scroll, ano gigante em odômetro, eventos como pontos e linha de resultado com o `STRING_AGG` do ano.
6. **Contato** (feito, revisão 14): `INSERT INTO dbo.contato` só com links (e-mail hiwan799@gmail.com com copiar, LinkedIn, GitHub); botão `COMMIT` desconecta a sessão; rodapé = barra de status do SSMS (tempo real + queries).
7. **Console SQL** (revisão 16): `/` abre uma janela de consulta do SSMS com SQLite real (sql.js, carregado sob demanda) e sotaque de T-SQL; erros `Msg 207/208/102`; visitante só lê (`Msg 229/3701`); consulta em `dbo.projetos` filtra a lista. **Monitor**: `sys.dm_exec_sessions` com dados reais da visita (rodapé). **Atalhos** do SSMS (F5, Ctrl+Enter, Ctrl+R, Esc, ?). **Link por caso**: `#projetos/3`.

Fluxo geral vertical; tela fixa SÓ na ponte e na trajetória (decisão do Hiwan).

## Fatos sobre o Hiwan (não inventar nada além disto)

- Fatos dos cases: `docs/01-cases.md`. Trajetória: `docs/02-trajetoria.md`.
- Empresa: **Colefar** (pode nomear). Aprendiz na Inova BH / Saúde BH (2020–2021). Colefar desde 2022; sênior desde ago/2025.
- Números reais: só "~10 s por registro vs 5–10 min manual" (bot). Todo o resto nos artefatos é ilustrativo e a janela diz isso.

## Como o Hiwan quer trabalhar (importante)

- Construir **por partes**; cada detalhe validado, testado, **visualizado (screenshot inspecionado)** e criticado como **jurado de alto nível** (rubrica Awwwards: Design 40, Usabilidade 30, Criatividade 20, Conteúdo 10; corte 7/10).
- Nada é "pronto" sem captura vista. Usar os scripts de `scripts/` (ver README). Registrar cada etapa em `docs/reviews/NN-*.md` com o histórico de correções.
- Rodar axe (0 violações WCAG 2.1 AA é o padrão atual) e a regressão das partes anteriores a cada mudança grande.
- Responder em português, direto.

## Sistema visual

Tokens em `src/styles/tokens.css`: grafite/papel, **um** acento lima `#c8f23a` usado como preenchimento (nunca texto corrido; no tema claro, foco e linhas de seleção usam tinta). Tipografia: Funnel Display (display) + Geist Mono (UI). Motion: GSAP + ScrollTrigger + Lenis; `expo.out`; tudo respeita `prefers-reduced-motion`.

## Armadilhas já encontradas (não repetir)

- Máscara de texto com `overflow:hidden` corta descendentes ("que" vira "aue"): folga de `.2em`.
- `.call()` do GSAP sem posição vai para o FIM da timeline.
- GSAP converte `translate(%)`/`transform` do CSS em px: não esconder elementos animados via `transform` no CSS; usar `gsap.set`.
- Gatilhos criados antes de um pin: `pinnedContainer` + `refreshPriority` + `ScrollTrigger.refresh()`.
- Lenis respeita `scroll-margin-top`: não somar offset no `scrollTo`.
- Lenis calcula o limite antes de o painel crescer: `gsap.set(panel,{height:'auto'}); lenis.resize()` antes de rolar.
- `1fr` não encolhe abaixo do conteúdo: usar `minmax(0,1fr)`.
- `HTMLElement.hidden` pode ser `"until-found"` no TS novo.
- Fim de página curta faz âncoras pararem antes do alvo (não é bug).
- `display:flex`/`grid` no CSS anula o atributo `hidden`: sempre `.x[hidden] { display:none }`.
- Artefatos precisam de um "quadro zero" coerente: são revelados (varredura) antes do `play()`.
- No mobile os artefatos são montados no carregamento para medir altura: nada de baixar mídia na montagem antes do `load` (segura a tela de conexão).
- Janelas roláveis dentro da página (navegador do caso 5) não podem capturar a roda/dedo por padrão: engatar por clique.
- `querySelector("#projetos/3")` lança erro: tratar âncoras de caso antes.
- sql.js `getRowsModified()` é da última instrução (não cumulativo).
- `.btn` no mobile do hero é `flex:1`: botões em outros contextos precisam de `flex:none`.
- Toda query exibida na barra precisa rodar no console (tabelas têm colunas de apoio: `foco`, `impacto`).
- Testar sempre em ~1376×640 (notebook com abas e favoritos), não só 1440×900: `node scripts/short-check.mjs` (revisão 17).
- Reconstruir a lista de projetos (troca de idioma) limpa o filtro do console.
- Playwright: `locator.screenshot()` rola até o elemento (troca a linha ativa do painel sticky) → usar `page.screenshot({clip})`; `page.click()` salta o scroll e briga com o Lenis → rolar com a roda e `page.mouse.click()`.
- **Não usar `pin` do GSAP no hero**: ele tira e devolve o nó ao DOM a cada refresh e o Chrome reconta a headline como conteúdo novo (LCP ia para o fim da intro). A ponte é `position: sticky` em `.hero-spacer`; a altura extra vem de um `::after` (o sticky fica preso à caixa de CONTEÚDO do pai: `padding` não conta).
- `invalidateOnRefresh` + `gsap.to()` regrava o valor inicial no meio da rolagem: usar `fromTo` ou não invalidar (start/end em função já são recalculados em todo refresh).
- Conteúdo que monta/desmonta no scroll precisa de altura reservada, senão a página muda de tamanho e o scroll pula (artefatos no mobile).
- `ResizeObserver` que altera tamanho no callback gera "ResizeObserver loop": escrever no `requestAnimationFrame`.

## Pendências

1. ~~Seção 4 — contato~~ feita (revisão 14).
2. Foto de frente (parede lisa, sem celular) → regerar retrato com `scripts/photo/prepare.py`.
3. ~~Imagem OG~~ feita (`public/og.png`, `scripts/og-capture.mjs`). No deploy: `SITE_URL=https://dominio npm run build` (canonical/og:url/og:image absolutos).
4. Deploy (domínio) e submissões.
