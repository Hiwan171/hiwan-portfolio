# Revisão 17 — Vídeo de navegação real do Hiwan (17/11/2026)

Vídeo: Chrome com abas e favoritos, 1376×728 de janela (viewport útil ~1376×640), 92 s, gravação de tela do Windows (VFR).
Método: `ffprobe` (ritmo de quadros por segundo e intervalos), mosaicos com marcação de tempo a 2 qps (`captures/video/sheet-*.png`), reprodução dos achados no Playwright (`node scripts/short-check.mjs`).

## Fluidez

O rolamento roda a ~30 qps estáveis (o teto do gravador) em hero, ponte, projetos e trajetória. As quedas (5–9 qps em 1:09–1:25, 0:31, 0:41) coincidem com **tela parada** (console aberto, digitação, gráfico estático): o gravador é de quadro variável e só grava quando a tela muda. Não foi encontrada travada visível no rolamento.

## Funcionou como planejado (visto em uso real)

Intro do hero; ponte (rosto → dados → grade → `dbo.projetos`); troca de casos com varredura; fila, view, BI e navegador; trajetória em degraus com dicas; contato; COMMIT → "desconectado" + relógio congelado; monitor; console (agrupar, filtrar, query digitada à mão `SELECT*from hiwan`); ↺ reconectar desfazendo a ponte até o topo.

## Problemas encontrados no vídeo e corrigidos

| # | Momento | Problema | Correção | Verificação |
|---|---|---|---|---|
| V1 | 0:07–0:35 | **Aviso "3 de 5 linhas" na tela com as 5 linhas visíveis**: a lista é reconstruída na troca de idioma e o filtro se perdia, mas o aviso ficava | troca de idioma limpa o filtro (a consulta era no outro idioma) | após `SET LANG`: aviso oculto, 5 linhas |
| V2 | 0:00 | Viewport de ~640 px: botões do hero 18 px abaixo da dobra | modo compacto para altura ≤ 700 px | botões terminam em 640/640 |
| V3 | 0:19–0:26 | Artefatos encolhidos a 67% (código da view ilegível) | palco e faixa do caso compactos em altura ≤ 700 px | escala 0,83 (640), 0,94 (768), 1,0 (900) |
| V4 | 1:15–1:18 | Texto selecionado no console vira **bloco lima sem texto** | seleção translúcida (o texto visível é o realce por baixo) | — |
| V5 | 1:10 | Console em tela baixa mostrava só 2 linhas de resultado | console 78svh e editor de 2 linhas em altura ≤ 820 px | monitor: 7 linhas visíveis em 640 |
| V6 | 0:55 | Dica da trajetória cortada no topo do gráfico | perto do topo, abre para baixo | — |

## Observações mantidas

- Contador do rodapé chega a ~56 queries em 1 min: cada linha de projeto ativada pelo rolamento é uma query. É coerente com o conceito; manter.
- Dica que cobre um rótulo grande por instantes no hover (0:56–1:00): aceitável, some ao tirar o mouse.

## Regressão

console-check (filtro, erros, axe 0), ponte (desce/volta/idioma), trajetória (axe 0), auditoria de produção (axe 0; LCP 0,16–0,22 s / 1,7–1,8 s em 3 medições). Sem erros de console.

## Lição

Testar sempre também em **~1376×640**: é a janela real de um notebook com abas e favoritos, e o padrão de 1440×900 escondia V2, V3 e V5.
