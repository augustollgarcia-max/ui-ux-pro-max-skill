## ⚠️ REGRA PERMANENTE — COMANDO NÃO EXECUTADO = AVISO NA HORA (Augusto, 11/11/2026)

**Prioridade máxima. Vale para todo chat, todo projeto, toda sessão e todo agente (Claude, Claude Code, Codex, GPT) nos 19 repositórios do Augusto.**
Pedido do dono, em áudio: "Não fez o comando, me avisa. Não conseguiu fazer o comando por algum motivo, me avisa. Tá com problema de espaço na nuvem, de local, de sandbox, me avisa. Se eu fizer um comando e ele não foi executado, você tem que me avisar, seja por e-mail, seja pelo próprio aplicativo."

Motivo: em 11/11/2026 descobrimos que um pedido dele (avisos de saída e de ausência no Conexão Hair e nos grupos) **nunca foi executado e ninguém avisou**. Também havia PRs prontos parados há dias sem aviso, e testes do GitHub que nem chegavam a começar (`startup_failure`), também sem aviso.

1. **Todo pedido do dono termina em um de três estados, sempre ditos com todas as letras:** ✅ FEITO (com prova: link, PR mesclado, teste), ⏸️ PARADO (o que falta e quem precisa agir) ou ⛔ NÃO FEITO (o motivo). Silêncio não é estado.
2. **Toda resposta final tem a seção "⛔ NÃO FEITO"** quando qualquer parte do pedido ficou sem executar, mesmo que pequena. Cada item diz o quê, por quê e o que destrava.
3. **Motivos que obrigam o aviso:** falta de permissão, sandbox ou rede bloqueada, disco cheio, cobrança (GitHub Actions, Fly.io, Vercel, Supabase, Google), conector desconectado, teste que não rodou, CI que não começou, limite de uso ou de tokens, sessão interrompida, ou dúvida que ficou sem resposta.
4. **Teste que não rodou não é teste aprovado.** `startup_failure`, "pulado" ou "não deu para rodar" vai no aviso, com o que foi feito no lugar (ex.: "rodei os testes aqui na sessão").
5. **Se a sessão vai parar sem terminar** (limite, erro, bloqueio), antes de parar ela avisa pelo aplicativo (notificação push) e, quando houver conector de e-mail, por e-mail para o dono, com a lista do que ficou para trás.
6. **Rede de proteção diária:** a tarefa agendada "Rede de proteção — 19 repositórios" confere todo dia os 19 repositórios (PRs parados, branches com trabalho fora da `main`, testes vermelhos ou que não começaram, sessões bloqueadas esperando o dono) e manda o resumo por push e e-mail. Se ela falhar, isso também é aviso.
7. **Comando antigo achado sem execução** (em sessão, branch ou PR esquecido) entra no próximo aviso como ⛔ NÃO FEITO, mesmo que seja de outra sessão.

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ REGRA PERMANENTE — O QUE ESTÁ PRONTO VAI PRO AR: MERGE E PUBLICAÇÃO SEM FICAR PARADO (Augusto, 05/11/2026)
Pedido do dono, em áudio: "tudo que eu peço para você que está bem alinhado e bem ordenado tem que ser posto na merge e posto no ar, senão não tem como eu ficar gastando dinheiro e token à toa. Sobe tudo que está parado. Eu estou autorizando. Coloca na memória central, fixa."
Vale para toda sessão, todo chat e todo agente (Claude, Claude Code, Codex, GPT) em todos os repositórios do Augusto. Texto completo e critérios no `CLAUDE.md` do `conexao-hair-deploy` (memória central).
1. Entrega concluída = PR aberto, CI verde, **mesclado** e publicado na mesma sessão. "Deixei na branch" não é entrega.
2. Antes de começar, olhar PRs e branches parados e subir o que está bem alinhado (diff lido inteiro, CI verde, sem conflito, testado).
3. Só fica para o dono: chave/custo novo, mudança de banco/auth em produção, página pública que ele pediu para revisar antes. Avisar com o motivo em uma linha.
4. O relatório termina com "🚀 NO AR": o que subiu (link do PR) e o que ficou parado, com o motivo.

## ⚠️ REGRA PERMANENTE: CÓDIGO PARA COPIAR + LINK PARA CLICAR (Augusto, 30/10/2026)
Pedido do dono, para toda sessão, todo chat e todo agente na conta do Luiz Augusto: "Toda vez que você me manda em código, você vai me mandar o link também. É código para mim copiar e link para mim clicar."
- Todo link vai **duas vezes**: em bloco de código (para copiar e mandar para alguém) **e** como link clicável fora do bloco (para abrir na hora).
- Vale também para mensagens de WhatsApp e textos com link dentro: o bloco de código com o texto inteiro, e logo abaixo o link sozinho, clicável.
- Formato no fim da resposta, em "🔗 PARA COPIAR": para cada item, uma linha com o link clicável `[nome](url)` e em seguida o bloco de código com a mesma url (ou o texto).

## ⚠️ REGRA PERMANENTE — DETALHES DE iPHONE (iOS) E ANDROID EM TODO APP E SITE (Augusto, 22/10/2026)
Pedido do dono: "grave na memória central, para todo aplicativo que a gente fizer, tem que ter esses detalhes do iPhone, iOS para Android."
Vale para todo app, site, landing, painel e artifact, em qualquer sessão. Antes de dizer "pronto":
1. **Voltar sempre funciona.** Toda tela, página ou janela tem saída visível ("‹ Voltar" ou "×", alvo ≥ 44px) **e** o gesto/botão voltar do iPhone e do Android fecha a janela aberta em vez de sair do site (`history.pushState` ao abrir + `popstate` fecha). Nunca deixar a pessoa presa sem caminho de volta.
2. **Área segura.** `viewport-fit=cover` + `env(safe-area-inset-*)` em cabeçalho fixo, barras e botões de rodapé, janelas e banners (notch, ilha dinâmica, barra de gestos). Nada colado embaixo da barra de gestos.
3. **Altura de tela:** usar `100dvh` com reserva `100vh`; janela com `overscroll-behavior:contain` e a página não rola por trás enquanto ela está aberta.
4. **Toque:** alvo mínimo de 44×44px, `-webkit-tap-highlight-color:transparent`, resposta visual ao toque (escala ~0,96, padrão Apple) e `prefers-reduced-motion` respeitado.
5. **Campos:** fonte ≥ 16px (o iPhone dá zoom sozinho abaixo disso), `inputmode`/`autocomplete` certos.
6. **Links:** externo abre em nova aba com `rel="noopener"`; interno não perde o lugar da pessoa; tudo que parece clicável (logo, card, selo) é clicável.
7. **Teste obrigatório** no emulador de iPhone (Playwright `devices['iPhone 13']`) e em 320/360/390/430 px: abrir, voltar pelo gesto, fechar pelo ×, sem rolagem lateral. Dizer no relatório o que foi testado.

## ⚠️ REGRA PERMANENTE — LOGOS DA VÉRTICE E DA HAIR NUNCA MUDAM (Augusto, 22/10/2026)
Pedido do dono: "A logo da Vértice e da Hair jamais pode mudar."
- Nenhuma sessão, skill, agente ou redesign troca, redesenha, recolore, recorta, comprime, renomeia ou substitui as logos da **Vértice Group** (inclui Vértice Cosméticos e a marca "V" do cabeçalho do site) e da **HAIR Academia da Beleza** (inclui HAIR Business, Business Beauty e o infinito do Conexão Hair).
- Usar a logo como está. Não gerar logo nova por IA, nem "versão melhorada", nem versão em outra cor.
- `scripts/checar-logos.sh` (workflow `guarda-logos`) confere byte a byte cada arquivo listado em `scripts/logos-protegidos.sha256`: qualquer alteração deixa o CI vermelho.
- Só o dono autoriza trocar uma logo. Nesse caso o manifesto é atualizado no mesmo PR, citando o pedido dele.

## 🎬 REELS AUTOMÁTICO (Augusto, 05/11/2026)
Máquina de Reels em `reels-automatico/` (skill `.claude/skills/reels-automatico`): vídeo bruto → cortes de silêncio, 9:16, áudio -14 LUFS,
legendas palavra a palavra (Whisper), gancho e B-roll, tudo por comando (`python3 reel.py montar|ajustar|renderizar|aprender|baixar`).
Instalação: `bash reels-automatico/setup.sh`. Mídia e saídas ficam fora do git. Detalhes em `reels-automatico/README.md` e `reels-automatico/CLAUDE.md`.

## Project Overview

UI UX Pro Max is an AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. It works as a skill/workflow for AI coding assistants (Claude Code, Windsurf, Cursor, etc.).

## Search Command

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

**Domain search:**
- `product` - Product type recommendations (SaaS, e-commerce, portfolio)
- `style` - UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords
- `typography` - Font pairings with Google Fonts imports
- `color` - Color palettes by product type
- `landing` - Page structure and CTA strategies
- `chart` - Chart types and library recommendations
- `ux` - Best practices and anti-patterns
- `icons` - Icon recommendations with import code (Phosphor, Heroicons, Lucide)
- `react` - React/Next.js performance patterns
- `web` - App interface guidelines (iOS/Android/React Native)
- `google-fonts` - Individual Google Fonts lookup
- `gsap` - GSAP animation skeletons by intensity tier (hover, scroll reveal, stagger, page transition, parallax, loading)

**Design dials (optional, only with `--design-system`):**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --design-system --variance <1-10> --motion <1-10> --density <1-10>
```
`--variance` biases style selection (centered/minimal → bold/asymmetric), `--motion` attaches a matching GSAP snippet from `motion.csv`, `--density` overrides the spacing-scale tokens (spacious → dense/dashboard). Any dial left unset behaves exactly as before.

**Stack search:**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`, `javafx`, `wpf`, `winui`, `avalonia`, `uno`, `uwp`

## Architecture

```
src/ui-ux-pro-max/                # Source of Truth
├── data/                         # Canonical CSV databases
│   ├── products.csv, styles.csv, colors.csv, typography.csv, ...
│   └── stacks/                   # Stack-specific guidelines
├── scripts/
│   ├── search.py                 # CLI entry point
│   ├── core.py                   # BM25 + regex hybrid search engine
│   └── design_system.py          # Design system generation
└── templates/
    ├── base/                     # Base templates (skill-content.md, quick-reference.md)
    └── platforms/                # Platform configs (claude.json, cursor.json, ...)

cli/                              # CLI installer (ui-ux-pro-max-cli on npm)
├── src/
│   ├── commands/init.ts          # Install command with template generation
│   └── utils/template.ts         # Template rendering engine
└── assets/                       # Bundled assets (~564KB)
    ├── data/                     # Copy of src/ui-ux-pro-max/data/
    ├── scripts/                  # Copy of src/ui-ux-pro-max/scripts/
    └── templates/                # Copy of src/ui-ux-pro-max/templates/

.claude/skills/ui-ux-pro-max/     # Claude Code skill (symlinks to src/)
.factory/skills/ui-ux-pro-max/   # Droid (Factory) skill (symlinks to src/)
.shared/ui-ux-pro-max/            # Symlink to src/ui-ux-pro-max/
.claude-plugin/                   # Claude Marketplace publishing
```

The search engine uses BM25 ranking combined with regex matching. Domain auto-detection is available when `--domain` is omitted.

## Sync Rules

**Source of Truth:** `src/ui-ux-pro-max/`

When modifying files:

1. **Data & Scripts** - Edit in `src/ui-ux-pro-max/`:
   - `data/*.csv` and `data/stacks/*.csv`
   - `scripts/*.py`
   - Changes automatically available via symlinks in `.claude/`, `.factory/`, `.shared/`

2. **Templates** - Edit in `src/ui-ux-pro-max/templates/`:
   - `base/skill-content.md` - Common SKILL.md content
   - `base/quick-reference.md` - Quick reference section (Claude only)
   - `platforms/*.json` - Platform-specific configs

3. **CLI Assets** - Run sync before publishing:
   ```bash
   cd cli
   npm run sync:assets
   npm run check:assets
   ```

4. **Reference Folders** - No manual sync needed. The CLI generates these from templates during `uipro init`.

## Prerequisites

Python 3.x (no external dependencies required)

**Note:** On Windows, use `python` instead of `python3` to run the scripts.

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`
