# Hero — fechamento (16/11/2026)

## Lacunas encontradas na revisão final e corrigidas

| Lacuna | Correção | Verificação |
|---|---|---|
| Mobile sem nenhuma navegação | Botão `tabelas ▾` abre árvore `hiwan.db › dbo.projetos / dbo.trajetoria / dbo.contato`; Esc e clique fora fecham; foco vai ao 1º item e volta ao botão; alvos de toque de 48px | `scripts/hero-final.mjs`: foco ok, Esc ok, navega e fecha, axe 0 com menu aberto |
| Troca de tema seca | Revelação circular a partir do botão (View Transitions); sem API ou reduced-motion = instantâneo | quadro em `captures/hero-final/d-theme-mid.png` |
| Menu não indicava a seção atual | `aria-current` + sublinhado no link da seção visível | `#projetos` ativo ao entrar |
| Âncora parava 92px abaixo (offset dobrado) | Desconto só pelo `scroll-margin-top` (o Lenis já respeita) | mobile: seção a 92px do topo, exato |
| Dados | `base` = Belo Horizonte; cadastrador = Python · SQL Server · API | |
| "dbo. projetos" no menu | "dbo." e nome no mesmo elemento | |

Observação: no desktop a seção para a 120px (não 92) só porque a página ainda termina em projetos (rolagem máxima). Resolve-se sozinho com a seção 3.

## Estado

**Hero fechado**, com duas dependências externas que não bloqueiam seguir:

1. Foto de frente (pipeline pronto: `scripts/photo/prepare.py`).
2. Título da função (hoje "Dev. de dados & automação").

Links "trajetória" e "contato" (e o CTA "Entrar em contato") passam a funcionar quando essas seções existirem.

## Nota final de jurado do hero

| Design 8,0 | Usabilidade 9,0 | Criatividade 8,0 | Conteúdo 7,0 | **Ponderada 8,2** |
|---|---|---|---|---|
