# Revisão — Tela de conexão (v1 → v4)

Capturas: `captures/boot-v4/` (quadros congelados via `?bootat=t`). Script: `node scripts/boot-capture.mjs <nome>`.

## Roteiro final

| t (s) | Evento |
|---|---|
| 0.00 | Diálogo "Conectar ao servidor" entra; barra réplica `● hiwan.db · desconectado` |
| 0.20 | Login digitado (`visitante` / `guest`) |
| 0.56 | Senha digitada (8 pontos) |
| 0.95 | Clique em Conectar; log: handshake, autenticação, esquema |
| 1.45 | Segura em 92% **até fontes e página carregarem de verdade** |
| 1.60 | `✓ conectado`, ponto acende em lima, contador 100 |
| 1.75 | A barra de progresso escapa do diálogo e ocupa a largura |
| 2.10 | Linha sobe varrendo a tela; abaixo dela o hero já roda |
| 2.90 | Linha encaixa na borda da barra; réplica = barra real (sem salto) |

Medido: loader sai em **3,4 s**, hero completo em **4,9 s**, pular (clique) encerra em **~1,1 s**. Não reaparece na mesma sessão. `?static` e `prefers-reduced-motion` pulam.

## Histórico de correções

| Versão | Problema | Correção |
|---|---|---|
| v1 | Quadro morto (~0,5 s de tela vazia) | Causa real: loader e hero têm o mesmo fundo; a borda de recolhimento era invisível. Virou linha de varredura lima. |
| v1 | Timestamps do log idênticos | Derivados da timeline (determinísticos). |
| v1 | "clique para pular" sobrava na saída | Some junto com o diálogo. |
| v1 | "Banco de dados" quebrava no mobile | Coluna de rótulos `max-content`. |
| v1 | Halo quadrado da sombra | Token `--shadow` mais curto. |
| v1 | Diálogo encardido no tema claro | Tokens `--surface`/`--field`: cartão mais claro que o papel. |
| v1 | 5,7 s até o hero completo | Roteiro enxugado: 4,9 s. |
| v2 | Timestamp `00.1180` | Formatação s.ms. |
| v3 | Linha lima invisível no papel | Fio de tinta só no tema claro. |

## Crítica de jurado

| Critério | Nota | Leitura |
|---|---|---|
| Design | 7.5 | Diálogo crível sem copiar marca nenhuma; contador grande dá escala; linha lima é o elemento mais forte. |
| Usabilidade | 8.0 | Curto, pulável, 1× por sessão, ligado ao carregamento real, sem `<input>` (nenhum gerenciador de senha reage). |
| Criatividade | 8.0 | É o conceito em ação: o visitante se conecta ao banco; o progresso vira a transição. |
| Conteúdo | 7.5 | PT/EN, log plausível. |
| **Ponderada** | **7.7** | |

## v5 → v7: meio-termo SSMS (decisão: visual próprio, estrutura reconhecível)

Não replicamos a aparência do SSMS (pastiche, interface datada, imagem de produto de terceiro). Replicamos **estrutura e comportamento**:

- Ordem de campos do SSMS: Tipo de servidor (Mecanismo de Banco de Dados) → Nome do servidor → Autenticação (Autenticação do SQL Server) → Logon → Senha.
- "Lembrar senha", "Criptografar: Obrigatório", "Confiar no certificado do servidor", "Opções >>".
- Status no cabeçalho; rodapé só com botões.
- Após conectar, o cartão vira o **Pesquisador de Objetos** (`hiwan.db › Bancos de Dados › hiwan › Tabelas › dbo.projetos / dbo.trajetoria / dbo.contato`): prévia da navegação do site.

| Versão | Problema | Correção |
|---|---|---|
| v5 | `dbo.trajetória` com acento (DBA estranharia) | Identificadores próprios sem acento (`boot.tree.t1..t3`). |
| v5 | Checkbox quebrando em 2 linhas | Diálogo 480px. |
| v6 | Mobile: diálogo vazava por baixo e cobria o contador | GSAP converte `translate(%)` em px ao animar; centralização trocada para grid. |
| v6 | Cabeçalho do Pesquisador em 2 linhas no mobile | Status curto ("✓ conectado"). |
| v6 | Checkbox em 3 linhas no mobile | Checkbox ocupa a largura toda no mobile; log oculto no mobile. |

Medido (v7): loader sai em **4,1 s**, hero completo em **5,6 s**, pular em **~1,4 s**. É o limite superior do orçamento; se pesar, o primeiro corte é a pausa do Pesquisador (−0,3 s).

## Próximos refinamentos possíveis

- Som opcional (clique de tecla), desligado por padrão.
- Ao passar, a linha "acende" as bordas das células do hero (hairlines piscam em lima por 1 quadro).
