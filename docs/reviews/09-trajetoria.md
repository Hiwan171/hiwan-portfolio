# Revisão — Seção 3: trajetória (2º momento em tela fixa)

Fonte dos fatos: `docs/02-trajetoria.md` (confirmado pelo Hiwan). Referência visual enviada por ele: páginas deslizando na horizontal com distorção.

## Conceito

```sql
SELECT ano, STRING_AGG(evento, ' · ') AS eventos
FROM dbo.trajetoria GROUP BY ano ORDER BY ano;
```
Query válida no SQL Server (um `GROUP BY ano` com colunas soltas seria inválido; um jurado de dados notaria). Cada ano é uma "página"; o rodapé da página mostra o `STRING_AGG` daquele ano. 2021 não aparece: o `GROUP BY` só retorna anos com linhas (o contrato de aprendiz é 2020–2021).

Título: **"De aprendiz a sênior em cinco anos."** (aprendiz 2020 → sênior ago/2025).

## Comportamento

Desktop: a seção fixa abaixo das barras; o scroll vertical desliza as páginas na horizontal; a velocidade inclina as páginas (até ~4°) e elas se endireitam ao parar; eixo de anos embaixo com o ano ativo. A barra de query reescreve para a consulta da trajetória (`✓ 7 linhas`).
Mobile e reduced-motion: pilha vertical.

Composição da página: ano gigante embaixo à esquerda, eventos no alto à direita (diagonal); tipo do evento como etiqueta (cargo, formação, certificação, construiu, hoje).

## Correções

| Problema | Correção |
|---|---|
| Metade inferior das páginas vazia | composição diagonal (ano ancorado embaixo, maior) |
| "1 EVENTOS" | singular/plural |
| Quadro com a página deslocada ~50px no scroll rápido | medido em 12 quadros: barra em 0 e seção em 92px em todos; era artefato da captura, não pulo real |

## Decisões aplicadas no site todo

- Hero: função "Desenvolvedor full stack".
- Projetos: "trabalho real na Colefar".

## Verificação

axe 0 (seção e produção, claro e escuro); leitor de tela: 7 artigos por ano com listas. Regressão: ponte reversível; menu leva a projetos a 92px (página agora longa o suficiente); loader 6,8 s na rede lenta; JS gzip 74 KB.

## Nota de jurado (site até aqui)

| Design 8,5 | Usabilidade 8,5 | Criatividade 9,0 | Conteúdo 8,5 | **Ponderada 8,6** |
|---|---|---|---|---|

Pendente para submissão: seção de contato, foto de frente, imagem OG, deploy.
