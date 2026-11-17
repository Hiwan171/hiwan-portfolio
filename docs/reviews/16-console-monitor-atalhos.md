# Revisão 16 — Console SQL, monitor de atividade, atalhos e link por caso (17/11/2026)

Origem: benchmark CSSDA (revisão 15) — o que separa 8,0 de ~9 é **o visitante fazer algo**. Ordem aprovada pelo Hiwan: I1 → I2/I3/I4.
Verificação: `node scripts/console-check.mjs <nome>`.

## I1 — Console SQL (`/`, botão `>_ query`, item no menu mobile)

- Janela de consulta do SSMS que sobe da base: editor com realce, **Executar** (F5 / Ctrl+Enter), exemplos, abas Resultados | Mensagens, barra de status.
- **SQLite real** (sql.js 1.16, SQLite 3.54) carregado **só ao abrir** (~360 KB gzip: wasm + 19 KB de JS). O carregamento do site não mudou.
- Sotaque de SQL Server: schema `dbo.`/`sys.` (ATTACH), `TOP n`, `GETDATE()`, `LEN()`, `ISNULL()`, `@@SPID`, `@@VERSION` (assume que é SQLite com sotaque), `N'…'`.
- Erros no formato do SQL Server: `Msg 207` (coluna), `208` (objeto), `102` (sintaxe), `195` (função), `209` (ambígua).
- **Visitante só lê**: `DROP` → `Msg 3701`; `UPDATE/DELETE/INSERT` → `Msg 229`; `CREATE/ALTER` → `Msg 262`; `EXEC` → `Msg 2812` + lembrete dos links de contato. Exceção: `INSERT INTO dbo.contato` funciona (só na aba, "nada é enviado").
- Tabelas = dados da página: `dbo.hiwan` (+ `foco` para a query do hero rodar), `dbo.projetos` (+ `impacto` 5→1 para o `ORDER BY impacto DESC`, `ano`: e-mail = **NULL**, não informado), `dbo.trajetoria`, `dbo.contato`, `sys.dm_exec_sessions`. **Toda query da barra roda no console.**
- **Filtro real**: consulta simples em `dbo.projetos` filtra a lista da página (aviso "2 de 5 linhas · ✕ limpar filtro"); consulta que traz todas as linhas não filtra.
- A barra de query mostra a consulta do visitante; o rodapé conta.

## I2 — Monitor de atividade

Rodapé → `sys.dm_exec_sessions ▸` roda `SELECT * FROM sys.dm_exec_sessions WHERE session_id = @@SPID;` com dados reais da visita: session_id, login, login_time, status, host (SO), programa (navegador), idioma, tempo, reads (queries), cliques, teclas, rolagem, viewport, fuso, FPS. 1 linha com muitas colunas aparece na vertical. **Tudo só na memória da aba.**

## I3 — Atalhos (os do SSMS)

`/` abre · `F5`/`Ctrl+Enter` executa · `Ctrl+R` mostra/oculta resultados · `Esc` fecha · `?` lista · `F5` fora do console reexecuta o artefato do projeto visível (só quando há um na tela; senão o F5 recarrega normalmente).

## I4 — Link por caso

`#projetos/3` abre o caso 3 (desktop: ativa e centraliza; estreito: rola até ele); clicar numa linha atualiza a URL; botão **copiar link** no painel.

## Correções durante a revisão

| Problema | Correção |
|---|---|
| `querySelector('#projetos/3')` lança erro (o "/" é inválido) | âncoras de caso tratadas antes; `try/catch` no resto |
| Item do console foi para a nav do desktop, não para o menu mobile | movido |
| Query sem filtro mostrava "5 de 5 linhas" | todas as linhas = sem filtro |
| `INSERT` respondia "(0 linhas afetadas)" | `getRowsModified()` é da última instrução, não cumulativo |
| Editor abria com espaços duplos do alinhamento do hero | espaços colapsados |
| "1 queries" | singular |
| Contagem dobrada por execução | uma cena por execução; status final com `paintQbar` |
| Mobile: console mais largo que a tela; Executar ocupando a linha; ✕ grudado no título | `grid-template-columns: minmax(0,1fr)`; `flex:none` (o `.btn` do hero mobile é `flex:1`); título `flex:1` |

## Verificação

axe 0 (console e rodapé abertos; produção claro/escuro); sem erros de console. Regressão: ponte, artefatos (R1–R3), contato/COMMIT, menu mobile, auditoria (LCP 0,15 / 1,59 s; rede lenta 6,6 / 8,3 s; JS inicial 83,8 KB gzip).

## Notas

| Rubrica | Antes (15) | Agora |
|---|---|---|
| CSSDA (UI / UX / Inovação) | 8,4 / 8,3 / 8,0 = **8,23** | 8,5 / 8,5 / 8,7 = **8,57** |
| Awwwards (D / U / C / Ct) | 8,5 | 8,7 / 8,6 / 9,1 / 8,0 = **8,66** |

O visitante agora escreve a próxima query, literalmente. Pendências para a submissão: foto de frente (UI), deploy com domínio e `SITE_URL`.
