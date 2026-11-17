# Revisão 18 — Transições de navegação: "query jump" (17/11/2026)

Pedido do Hiwan: a subida/descida rápida dos links e do reconectar não era digna de prêmio. No vídeo (1:29) o reconectar atravessava ~6.000 px em 1,8 s com a trajetória e a ponte rebobinando.
Verificação: `node scripts/jump-check.mjs` (quadros em `captures/jump/`).

## Comportamento

| Navegação | Transição |
|---|---|
| Link de longa distância (menu, menu mobile, "Entrar em contato") | **Query jump**: a linha lima desce cobrindo a tela → a query da seção é digitada em fonte grande → `▸ executando…` → salto direto ao destino por trás da cortina → `✓ n linhas` → a linha desce de novo revelando a seção (~1,5 s) |
| Hero → projetos ("Ver projetos", "projetos" no menu) | rolagem de 2,4 s: **a ponte é a transição** |
| Destino a menos de 1,2 tela | rolagem suave de 1 s |
| Reconectar | `USE hiwan;` → `✓ conectado` → ponto acende, sessão reabre, topo → o rosto **se remonta a partir dos dados** |
| reduced-motion / sem Lenis | salto direto |

A barra de conexão continua visível durante o salto (ele acontece "dentro" da sessão). Ao aterrissar, a barra de query pinta a cena final (sem redigitar por trás da cortina) e o foco vai para a seção (`tabindex=-1`).

## Detalhes técnicos

- `src/jump.ts`; `setScene()` agora mata a digitação em andamento mesmo na mesma cena (os gatilhos de scroll disparados pelo salto começavam a redigitar).
- Retrato: novo fator `portraitState.a` (montagem) multiplicado em `uP`. A ponte controla `p` com scrub e regravava o valor ao assentar no topo; com um fator próprio, o reconectar remonta o rosto sem disputar com ela.

## Verificação

Trajetória: seção a 92 px, query e status certos, foco na seção. Contato: idem. COMMIT → reconectar: topo, conectado, rosto disperso na abertura da cortina e montado em ~2,5 s. "Ver projetos": 92 px pela ponte. Regressão: ponte, menu mobile, contato, axe 0 (produção). Sem erros de console.

## Nota

| Rubrica | Antes | Agora |
|---|---|---|
| CSSDA (UI / UX / Inov.) | 8,5 / 8,5 / 8,7 | 8,6 / 8,6 / 8,9 = **8,70** |
