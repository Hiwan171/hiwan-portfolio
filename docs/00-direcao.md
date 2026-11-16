# Direção — Portfólio Hiwan

> Fonte única de decisões. Qualquer mudança de rumo é registrada aqui antes de virar código.

## 1. Objetivo

Portfólio pessoal para divulgação (LinkedIn, redes) **e** submissão a Awwwards, CSS Design Awards, FWA e similares. Não pode parecer site padrão. Conteúdo: SQL, Python, Power BI, automações, bots/APIs, web full stack, apps.

Idiomas: **PT e EN**, com alternância pelo usuário (metáfora: `SET LANGUAGE`).

## 2. Conceito: `SELECT * FROM hiwan`

O site inteiro é uma consulta que "executa" conforme o visitante navega. **O visitante nunca precisa digitar**; digitar é um extra opcional.

| Cláusula | Seção | Função |
|---|---|---|
| `SELECT` | Hero | Identidade: nome e função surgem como resultado |
| `FROM` | Origem | De onde vêm dados e ferramentas |
| `JOIN` | Habilidades | Dados + web + automação se unindo |
| `WHERE` | Projetos | Tabela filtrável (tipo, ano); linhas abrem janelas |
| `GROUP BY year` | Trajetória | Agrupada por ano |
| `INSERT INTO contact` | Contato | Formulário como instrução; botão `COMMIT` |

### Três camadas

1. **Query**: espinha dorsal e navegação. Barra fixa que se escreve com o scroll.
2. **Resultado**: sempre tabela/grid de linhas. É a linguagem visual constante.
3. **Artefato**: cada projeto abre uma janela com a cena própria.

| Projeto | Artefato |
|---|---|
| Sites (4) | Navegador fictício com o site rolando |
| Bot de cadastro (view SQL → API Uplog) | Terminal: lê a view, faz `POST` por registro, ~10 s vs 5–10 min manual |
| Power BI (vários) | Canvas de dashboard recriado e animado |
| Outras automações Python | Terminal executando e imprimindo log |
| Views SQL | Editor com a query e o resultado |
| Envio de e-mail em massa | Fila de envio com contadores |

Todos os artefatos são **recriados por nós com dados fictícios**. Sem screenshots reais, sem nomes de pessoas ou clientes.

### O que evitamos

- Desktop/OS falso como site inteiro (clichê).
- Neon azul/roxo, glassmorphism genérico, timeline vertical padrão, cards com foto de banco de imagens (era o portfólio antigo).
- Depoimentos fictícios. Só reais, ou nada.

## 3. Referências e o que aproveitamos

| Site | Aproveitar | Cuidado |
|---|---|---|
| ingrassiadaniel.it | Contenção, um único acento, motion tokenizado (`.9s`, stagger `50ms`, `cubic-bezier(.22,1,.36,1)`), copy curta | Não copiar paleta |
| merodev.net | WebGL como identidade, não enfeite | ~830 KB de JS: carregar com lazy load |
| radilson.com | Mono (Departure Mono), grid de células, painel/modal de projeto, status por projeto | Não copiar estrutura |

Pendente: o que exatamente te marcou em cada um (transição, cursor, scroll). Só vimos o código, não o movimento.

## 4. Direção visual (hipótese, a validar)

- **Tema:** **claro é o padrão** (como o SQL Server); escuro disponível no botão. Decidido em 16/11/2026.
- **Tipografia:** mono forte (Departure Mono ou Geist Mono) + grotesca de display grande.
- **Cor:** grafite quente, texto osso, **um** acento (lima ácido ou âmbar). Cores de syntax highlight só dentro de blocos de código.
- **Movimento:** tokens únicos de duração/ease/stagger. Lenis + GSAP. WebGL em um único momento de assinatura, carregado depois do primeiro paint.
- **Layout:** grid de células visível; estrutura de tabela à mostra.
- **Mobile:** desenhado à parte; a janela vira card de tela cheia.

## 5. Stack (hipótese)

Vite ou Next, GSAP + ScrollTrigger, Lenis, OGL/Three (só onde valer), i18n próprio leve. SQL simulado primeiro (parser mínimo de `SELECT/WHERE/ORDER BY/LIMIT` sobre JSON); SQLite real (sql.js) como experimento posterior.

## 6. Processo: portões de validação

Cada peça passa por todos os portões antes da próxima. Nada é "terminado" sem screenshot inspecionado.

1. **Brief:** o que a peça precisa comunicar, em uma frase.
2. **Protótipo.**
3. **Captura:** screenshots em desktop (1440, 1920) e mobile (390), mais o movimento gravado/descrito.
4. **Crítica de jurado** (abaixo), por escrito, com notas.
5. **Ajuste** até passar. Registrar o que mudou.
6. **Aprovação do Hiwan.**

### Rubrica de jurado (espelha o Awwwards)

| Critério | Peso | Perguntas |
|---|---|---|
| Design | 40% | Hierarquia, tipografia, cor, espaçamento, consistência. Parece de um estúdio ou de um template? |
| Usabilidade | 30% | Navegação óbvia sem digitar? Mobile? Acessibilidade, contraste, `prefers-reduced-motion`? |
| Criatividade | 20% | O conceito é memorável e coerente? Há um momento de assinatura? |
| Conteúdo | 10% | Copy específica, casos reais com resultado, PT/EN corretos? |
| Desenvolvimento (nota separada) | — | Performance (LCP, CLS, 60fps), semântica, código limpo, sem jank. |

Regra de corte: qualquer item abaixo de **7/10** na nossa autoavaliação volta para ajuste.

## 7. Ordem de construção

0. Fundações: tokens (cor, tipo, espaço, motion), grid, i18n, esqueleto. ✔
1. Tela de conexão (login simulado no `hiwan.db` → linha de varredura → hero). ✔ v4
1b. Hero. ✔ **FECHADO** (16/11): retrato em partículas (WebGL2), interação, menu mobile, transição de tema. Pendências externas: foto de frente, título da função.
1c. Ponte hero → projetos: barra de query fixa que reescreve a query no scroll. ✔ v2
2a. Projetos: linhas expansíveis ("EXPLAIN") + 5 artefatos (terminal, fila, view SQL, BI, navegador com sites reais). ✔ completo
2b. Ponte hero → projetos em tela fixa. ✔ (decidido: fluxo vertical; tela fixa só aqui e na trajetória)
3. Trajetória (`STRING_AGG … GROUP BY ano`), páginas horizontais em tela fixa. ✔
4. Contato (`INSERT INTO contato` / `COMMIT`). ⏳ próximo.
2. Barra de query fixa + navegação por scroll.
3. Projetos (`WHERE`) + janela de artefato (começar por um: navegador).
4. Demais artefatos, um por vez.
5. Origem, Habilidades, Trajetória.
6. Contato (`INSERT`/`COMMIT`).
7. Polimento final: mobile, a11y, Lighthouse, SEO/OG, deploy.

## 8. Pendências

- [ ] Entrevista dos cases (problema → o que fiz → resultado).
- [ ] O que Hiwan gostou em cada referência.
- [ ] Foto adequada de Hiwan.
- [ ] Nome/domínio e redes a linkar.
- [ ] Decisão tema escuro vs claro (após mockups).
