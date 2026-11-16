# Catálogo de cases

> Só entra aqui o que o Hiwan confirmou. Lacunas ficam como `[?]`. Nenhum número é inventado.
> Regra de publicação: nenhum token, endpoint, credencial, nome de pessoa ou dado real de cliente. Artefatos são recriados com dados fictícios.

Contexto: empresa de coleta de resíduos perigosos (grupo de empresas). Hiwan é CLT; criou tudo por iniciativa própria, sem solicitação, e foi reconhecido por isso.

## C1. Bot de cadastro integrado ao Uplog

- **Contexto:** migração de ERP. Os dados do sistema antigo precisavam entrar no Uplog.
- **Problema:** cadastro manual de usuários e clientes: ~5 min por registro (pessoa rápida), até ~10 min (pessoa inexperiente).
- **Solução:** cadastrador automático que **lê uma view SQL** e **sobe os registros para o Uplog via API**. Roda no terminal (VS Code). Hoje faz cadastro em massa de usuários e clientes; a API dá acesso a cadastrar/alterar/editar praticamente tudo, então é expansível (interface gráfica, exportações).
- **Resultado:** **~10 s por registro** contra 5–10 min manual: **30 a 60× mais rápido**.
- **Artefato:** terminal real (é a interface verdadeira): `SELECT` na view → linhas → `POST` na API → `✓ 201` por registro, com contador e tempo. Liga SQL + automação + API numa cena só: provável **case principal** do site.
- **Stack:** Python `[?]`, SQL Server (view de origem), API do Uplog.
- **Nota de conteúdo:** mostrar controle (log por registro, validação), nunca credencial, endpoint ou token.

## C2. Envio de e-mail em massa

- **Problema:** o envio era feito por empresa terceirizada, paga.
- **Solução:** aplicação em Python que faz o envio internamente.
- **Artefato:** fila de envio com contadores subindo.
- **Lacunas:** volume por envio, taxa de entrega, quem usa. Custo anterior: Hiwan não lembra; se não der para recuperar, o case sai sem valor em R$ e fica só com "substituí um serviço pago de terceiros".
- **Gancho:** "substituí um serviço pago por uma ferramenta própria". O custo evitado é o número que mais impressiona aqui.

## C3. Views SQL de gestão

- **Problema/escopo:** todas as áreas, sem exceção: financeiro, logística, comercial, faturamento, contas a pagar.
- **Solução:** inúmeras views em **SQL Server**, para diretoria e gestores. Hiwan monta os joins, os `CASE` e a view completa e entrega o resultado em **.xls**.
- **Artefato:** editor com a query e o resultado, terminando num botão de exportar para Excel. Par natural do conceito `WHERE`.
- **Gancho:** "se alguém precisa enxergar um dado, eu monto a view". É o case que melhor prova domínio de SQL.
- **Lacunas:** nº aproximado de views, a view mais usada e a decisão que ela apoia.

## C4. Power BI: Contas a Pagar, Faturamento de Clientes e Motivos de Não Coleta

- **Solução:** três dashboards (Contas a Pagar; Faturamento de Clientes; Motivos de Não Coleta), alimentados pelas views.
- **Nota:** "Motivos de Não Coleta" é o mais específico do setor e o mais memorável dos três. Bom candidato a artefato principal de BI.
- **Artefato:** canvas de dashboard recriado, com dados fictícios.
- **Lacunas:** quais indicadores principais, quem consome (diretoria, financeiro?), o que mudou na rotina.

## C5. Landing pages de vendas (4 sites)

- **Contexto:** sites do mesmo grupo de empresas, landing pages de vendas de resíduos perigosos.
- **Artefato:** navegador fictício com o site rolando.
- **Stack:** React. As campanhas já estão no ar e gerando leads.
- **Lacunas:** URLs públicas, volume de leads (aproximado, se quiser divulgar), se exibimos ao vivo ou recriados.

## C6. Automações internas (guarda-chuva)

- O envio em massa (C2) e o bot de cadastro (C1) são as duas maiores. Ambos substituíram trabalho manual.
- **Artefato:** terminal com log.
- **Lacunas:** outras automações menores que valham uma linha.

## Extra

## C7. Portfólio de terceiro: matheusvileforte.com

- Site pessoal que Hiwan criou para **Matheus Vileforte** (infraestrutura, redes e segurança). Não é o portfólio do próprio Hiwan.
- Visual de terminal/"sistema operacional" (`MV_OS v10.4.4 - SECURE BOOT SEQUENCE`), navegação numerada `00 // ENTRADA`.
- **Decisão pendente:** entra como case "portfólio sob encomenda", se o Matheus autorizar. Serve para mostrar que Hiwan faz sites pessoais.
- **Atenção de direção:** é um tema terminal/OS. O nosso conceito (SQL) precisa ser claramente distinto dele, para não parecer repetição.

## Lacunas prioritárias (ordem de impacto)

1. Número aproximado de views e a mais importante.
2. Volume aproximado de registros migrados pelo bot (opcional).
3. Indicadores principais dos 3 dashboards.
4. Leads das campanhas (aproximado).
5. Autorização do Matheus para o C7.
