# Revisão 14 — Seção 4: contato, final e rodapé (17/11/2026)

Decisão do Hiwan: **só links** (sem formulário). Canais: hiwan799@gmail.com · linkedin.com/in/hiwan-alves-6bbb58369 · github.com/Hiwan171.
Verificação: `node scripts/contact-capture.mjs <nome>`.

## O que é

- Barra de query: `INSERT INTO dbo.contato (canal, endereco) VALUES ('email', …), ('linkedin', …), ('github', …);` → `✓ 3 linhas afetadas`.
- Título **"A próxima query é sua."** (fecha o arco do hero) + o que ele faz, em uma frase.
- Canais como **linhas de resultado** (mesma linguagem dos projetos): rótulo · valor grande · seta ↗; e-mail com **copiar** (feedback "copiado ✓"; sem permissão de clipboard, não finge).
- **COMMIT**: barra vira `COMMIT TRANSACTION;` → a linha lima da tela de conexão nasce no botão, cobre a largura e sobe até a barra do topo → ponto apaga, "· desconectado" → "Sessão encerrada. Obrigado pela visita." + **↺ reconectar** (volta ao topo, reconecta). O site começa conectando e termina desconectando.
- **Rodapé = barra de status do SSMS**: `✓ Consulta executada com êxito · hiwan.db · visitante · 00:03:12 · 9 queries · © 2026 Hiwan Alves`, com tempo real de sessão e quantas queries a navegação executou; após o COMMIT vira `■ Sessão encerrada` e o relógio congela.
- Seção + rodapé cabem numa tela (o final precisa ser visto inteiro).

## Correções

| Problema | Correção |
|---|---|
| COMMIT e final abaixo da dobra (o final era o momento) | seção compactada (título por `svh`, linhas `clamp`): seção + rodapé numa tela em 1440×900 |
| "copiar" longe do e-mail | entre o e-mail e a seta |
| Mobile: e-mail truncado "hiwan799@gm…" | quebra em vez de reticências; "copiar" abaixo |
| Perna do "g" (gmail, hiwan171) cortada | folga de descendentes (`padding-bottom .14em`) — mesma armadilha do hero |
| Rótulo do canal abaixo de 4,5:1 no hover (axe) | `ink-2` no hover |
| "© 2026" no rodapé mobile 4,38:1 (axe) | `ink-2` |

## Verificação

axe 0 (contato, rodapé, menu mobile aberto, produção claro/escuro); **âncoras quebradas: 0** (eram `#contato` ×3); menu → contato; copiar → clipboard real; COMMIT → desconectado + relógio congelado; reconectar → topo, conectado. Regressão: ponte, projetos (R3), menu mobile, auditoria (LCP 0,38 s / 1,66 s; rede lenta 6,4 / 8,2 s; JS gzip 79 KB). Sem erros de console.

## Notas

| Seção | Design | Usab. | Criat. | Cont. | Ponderada |
|---|---|---|---|---|---|
| Contato + final | 8,6 | 8,8 | 9,0 | 8,5 | **8,7** |
| **Site inteiro** | 8,7 | 8,4 | 8,8 | 8,0 | **8,5** |

Usabilidade passa de 7 para 8,4: o site agora tem final e todos os CTAs levam a algum lugar. Faixa SOTD.

## Próximo

Foto de frente → deploy (domínio + `SITE_URL`) → submissões. Opcional: console SQL (`/`, sql.js), 404 como `Msg 208`.
