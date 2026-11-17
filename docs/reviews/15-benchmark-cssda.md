# Revisão 15 — Benchmark CSSDA + avaliação de jurado do site inteiro (17/11/2026)

Fonte: busca "portfólio" no CSSDA (páginas 1–3) + lista WOTD. Capturas: `node scripts/refs-awards.mjs` → `captures/refs-awards/` (fora do git).

## Como o CSSDA julga

Três critérios, notas de 0 a 10 por jurado: **UI** (estética e efeitos), **UX** (experiência e funcionalidade), **Inovação** (ideias novas de design e desenvolvimento). **WOTD** pede média acima de ~8,0; **Special Kudos** acima de 6. Os jurados não escrevem comentários, só notas. Na busca, a maioria dos portfólios fica em Special Kudos (6,5–8,0). O ingrassiadaniel.it (referência do início do projeto) foi só Nominee.

## Vencedores estudados

| Site | Nota | O que faz | Scroll | Peso |
|---|---|---|---|---|
| longhoang-lyo.com | **8,96** | Portfólio-**jogo** 3D: você dirige um veículo pela cidade ("2300+ horas") | virtual (WebGL) | 4,4 MB |
| aengel.io | 8,48 | WebGPU imersivo, navegação por scroll, **versão lite no mobile** declarada | virtual | 1,1 MB |
| artemiilebedev.com | 8,27 | **Lista de projetos tipo tabela** (mono) + vídeo de fundo que troca no hover; relógio local; "PRESS ESC FOR EFFECTS", "CLICK AND HOLD" | virtual | 0,4 MB |
| carterogunsola.com | 8,20 | **Telemetria ao vivo** no topo (hora, FPS, ONLINE, LCP); **cursores de outros visitantes** com apelidos; "45 online"; **⌘K** | virtual | 1,5 MB |
| matteocourquin.com | 8,20 | Mesa de "janelas" arrastáveis; painel de **sessão** (duração, velocidade do mouse, cliques, teclas, navegador, fuso); **lista de atalhos**; som; painel de prêmios | virtual | 30 MB |
| mariavasilyeva.com | 8,16 | Linha do tempo horizontal de miniaturas; **som on/off**; anotações on/off | virtual | 4,7 MB |
| khanhnguyen.design | 8,15 | Editorial, serifa gigante, nome revelado em máscara | nativo | 13,5 MB |
| juanmoraromero.com | 8,04 | Grade editorial, foto pequena, **textura de grão**, "Available for work" | virtual | 3,1 MB |
| cristianaaraujo.com | 8,01 | Estudos de caso com mockups grandes | nativo | 15 MB |
| wassimnasr.com | 7,58 (Kudos) | "A Portfolio You Can Talk To": avatar 3D + **chat com IA** | — | 12,8 MB |

## Padrões

1. **O visitante faz algo** (jogar, conversar, digitar). É o que separa 8,5–9 de 8,0. Nos dois extremos: Long Hoang (jogo, 8,96) e Wassim (chat).
2. **Telemetria real da sessão** (Carter, Matteo, Artemii): hora, FPS, cliques, teclas, tempo na página. Barato e lembrado.
3. **Teclado como interface**: ⌘K, lista de atalhos, "ESC para efeitos".
4. **Lista de projetos em tabela/mono** (Artemii): valida o nosso caminho.
5. **Versão lite no mobile** declarada (Arthur Engel).
6. **Detalhes táteis**: grão, som opcional, "click and hold".
7. **Peso não é critério**: de 0,4 a 30 MB. Nós ficamos em ~1 MB (vantagem para o prêmio de Desenvolvimento).
8. **7 de 10 usam scroll virtual** (tela inteira controlada). Mantemos a decisão de fluxo vertical com 2 momentos fixos: melhor para UX e acessibilidade.

## Avaliação de jurado do nosso site

### Rubrica CSSDA

| UI | UX | Inovação | **Média** |
|---|---|---|---|
| 8,4 | 8,3 | 8,0 | **8,23** (faixa WOTD, sem folga) |

- **UI 8,4**: sistema tipográfico e de cor disciplinado, conceito coerente do topo ao rodapé, tema claro raro. Perde por: retrato ainda vindo de selfie (qualidade de imagem), painel de projeto denso de texto (faixa problema/solução/resultado).
- **UX 8,3**: navegação óbvia, menu mobile, axe 0, reduced-motion, final com COMMIT, ~1 MB. Perde por: tela de conexão de 4–5 s na 1ª visita; descobertas só por hover (eventos da trajetória); **casos sem link próprio** (não dá para compartilhar "o projeto 3").
- **Inovação 8,0**: o conceito SQL é raro e bem amarrado; a ponte (rosto → dados → grade) é memorável. Perde por: **o visitante não faz nada próprio**: assiste às queries. Retrato em partículas é técnica conhecida.

### Rubrica Awwwards (Design 40 · Usabilidade 30 · Criatividade 20 · Conteúdo 10)

| Design 8,7 | Usab. 8,4 | Criat. 8,8 | Cont. 8,0 | **8,5** |
|---|---|---|---|---|

## Ideias (dentro do conceito)

| # | Ideia | Inspiração | Critério | Custo |
|---|---|---|---|---|
| I1 | **Console SQL de verdade** (tecla `/` ou botão na barra de query): o visitante digita `SELECT * FROM dbo.projetos WHERE area = 'bi'` e a lista filtra; `SELECT * FROM dbo.trajetoria WHERE ano = 2025`; erros reais (`Msg 207, nome de coluna inválido`). sql.js carregado só ao abrir | Long Hoang (jogar), Wassim (conversar) | **Inovação** (o maior ganho) | médio |
| I2 | **Monitor de atividade** = `SELECT * FROM sys.dm_exec_sessions WHERE session_id = @@SPID;` a partir da barra de status: duração, cliques, distância rolada, teclas, navegador, resolução, fuso, FPS, queries executadas. DMVs reais do SQL Server | Carter, Matteo | Inovação + UI | baixo |
| I3 | **Atalhos do SSMS**: `F5` executa de novo o artefato, `Ctrl+R` mostra/oculta o painel de resultado, `/` abre o console, `?` lista atalhos | Carter (⌘K), Matteo, Artemii | UX + Inovação | baixo |
| I4 | **Link por caso**: `#projetos/3` abre o caso 3 (e a barra mostra `WHERE id = 3`) | — | UX | baixo |
| I5 | **Grão de papel** sutil no tema claro (textura estática, não animada) | Juan, Carter | UI | baixo |
| I6 | Som opcional (tecla de digitação no editor, "commit"), desligado por padrão | Matteo, Maria | UI | médio (risco) |
| I7 | Presença multiplayer (`sys.dm_exec_sessions` com outros visitantes ao vivo) | Carter | Inovação | alto (servidor em tempo real, privacidade) — **não recomendado agora** |

Projeção com I1 + I2 + I3 + I4 + foto de frente: **CSSDA ~8,5–8,7** (WOTD com folga).
