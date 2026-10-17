# Como mudar o site HAIR sem quebrar

Site público `www.hairacademiadabeleza.com.br` = pasta `site-hair/` deste repositório
(projeto Vercel `hair-academia-site`, publica sozinho a cada push na `main`).
Os apps (Conexão Hair / Work) são outro repositório e **não** passam por aqui.

## Regras
1. Sempre em branch + PR. Nunca direto na `main`.
2. O PR só passa se os dois testes ficarem verdes (workflow `site-hair-contrato.yml`).
3. WhatsApp público é só `5516991687977`. Conversões do Google Ads (`AW-799342935/...`)
   ficam nos mesmos botões: `data-wa-generic`, `data-wa-consultoria`, `data-budget`,
   `data-enrollment`, `data-route`.

## Os dois testes
| Teste | O que pega | Comando |
|---|---|---|
| Contrato (sem navegador, 1 s) | link/botão/ID/curso/conversão que sumiu, âncora sem destino, arquivo inexistente, erro de sintaxe nos scripts, WhatsApp trocado | `python3 scripts/site-hair/checar-contrato.py` |
| Navegador (Chromium, ~1 min) | rolagem lateral de 320 a 1920 px, erro de JavaScript, imagem quebrada, janelas dos 3 cursos, menu, instalação, barra de contato do celular | `node scripts/site-hair/smoke-navegador.cjs` |

Local, com Playwright fora do repositório:
`PLAYWRIGHT_LIB=/caminho/node_modules/playwright CHROMIUM_BIN=/caminho/chrome node scripts/site-hair/smoke-navegador.cjs`

## Quando a remoção é de propósito
O contrato só aceita **mais** coisas, nunca menos. Se o dono aprovar tirar ou trocar
um link/botão/ID: faça a mudança, rode `python3 scripts/site-hair/checar-contrato.py --gerar`
e comite o `contrato.json` junto. O diff dele no PR mostra exatamente o que saiu.

## Onde mexer no visual
- `site-hair/inicio.html`, um arquivo só (HTML + CSS + JS inline). É a landing completa, hoje em `/inicio`.
- `site-hair/index.html` (a raiz) é a **página de seleção** gerada pelo repositório `hair-business-` — não editar aqui; o contrato só confere que ela leva a `/business`, `/beauty` e `/business/assessoria`.
- CSS em duas camadas dentro do `<style>`:
  1. sistema original (tokens `--bg`, `--gold`, `--green`, `--serif`/`--sans`…);
  2. bloco **"REDESIGN PREMIUM 2026-10"** no fim, com os tokens `--r-sm 12` · `--r-md 18` ·
     `--r-lg 26` · `--r-pill 999` (raios), `--line`/`--line-2` (bordas douradas), `--card`
     (fundo de cartão), `--shadow-lg`. Ajuste visual novo entra **neste bloco**, de
     preferência mudando token, não regra solta.
- Celular primeiro: tudo do celular está em `@media(max-width:900px)` dos dois blocos.

## Receitas
- **Trocar uma imagem do Ecossistema:** gere `nome-640/1024/1600.webp` em
  `site-hair/assets/ecossistema/` com o mesmo nome. Enquadramento: `object-position`
  em `.eco-card.t-hair|t-vision|t-edu|t-work img.eco-img`.
- **Novo cartão no Ecossistema:** copie um `<article class="eco-card">`; no desktop a
  grade tem 12 colunas (`wide` = 7, `narrow` = 5, padrão = 6) — cada linha deve somar 12.
- **Nova seção:** `<section id="...">` dentro de `<main>`; se entrar no menu, o link vai
  nos **dois** menus (`.navlinks` e `#mobileNav`). O contrato reprova âncora sem destino.
- **Novo botão de WhatsApp:** `<a data-wa-generic href="#" target="_blank" rel="noopener">`;
  o script preenche a mensagem e liga a conversão sozinho. Nunca escreva `wa.me` à mão.
- **Animação de entrada:** classe `rv` (some sem JavaScript e com movimento reduzido).

## Robustez já aplicada (16/10/2026)
- O script principal não derruba a página se um elemento (menu, cabeçalho, janelas, ano)
  for removido: cada parte confere se o elemento existe.
- Barra de contato do celular some com o menu ou uma janela aberta (`:has`; navegador
  antigo só perde esse detalhe).
- Imagens do Ecossistema têm fundo escuro enquanto carregam e não mostram texto
  quebrado se falharem.
