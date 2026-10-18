# HAIR Academia da Beleza — página pública

Página comercial estática, isolada do app Conexão Hair.

## Rodar localmente

```bash
cd site-hair
python3 -m http.server 8899
# http://127.0.0.1:8899
```

Precisa ser servido por HTTP: as fontes auto-hospedadas são bloqueadas por CORS em `file://`.

## Estrutura

- `index.html` — **raiz do site = página de seleção** (dois emblemas: Business Barber → `/business`, Business Beauty → `/beauty`; botão pequeno Assessoria). **Gerada** pelo repositório `hair-business-` (`site/escolha.html` via `site/publicar-www.sh`): não editar à mão. Decisão do dono em 17/10/2026.
- `inicio.html` — a landing completa da HAIR Academia (HTML + CSS + JS inline, sem dependências externas), hoje em `/inicio`; é ela que o contrato (`scripts/site-hair/`) protege. `/barbearia/ribeirao` continua caindo nela.
- `beauty.html` — `/beauty` (HAIR Business Beauty), também gerada pelo `hair-business-`
- `assets/fonts/` — Inter e Playfair Display auto-hospedadas (subsets latin)
- `assets/*.webp` — imagens em uso, derivadas das fotos reais da HAIR
- `assets/galeria/` — acervo fotográfico real da escola
- `ref/` — referências visuais aprovadas usadas na reconstrução
- `criterios-de-qualidade.md` — mecanismos mensuráveis extraídos da referência
- `progresso-design.md` — registro do ciclo de design

## Trocar uma foto

Substitua o arquivo em `assets/` mantendo o nome. Os slots são:

| Slot | Arquivo |
|---|---|
| Hero | `hero-hair-{480,768,1152}.webp` + `female-class-3.jpg` |
| Card Conexão Barber | `card-barber.webp` |
| Card Conexão Beauty | `card-beauty.webp` |
| Card Conexão Brow & Lash | `card-brow.webp` |
| Metodologia | `method-class.webp` |
| Ação social | `social-action.webp` |

## Contato configurado

WhatsApp **(16) 99255-8810** (`5516992558810`), com mensagem pré-preenchida por curso. Desde 18/10/2026 (decisão do Augusto) o 7977 — robô RARA, sessão não oficial — não aparece mais no site, e o site tem Meta Pixel + Conversions API (`/business/rastreio.js` + `api/meta-capi.js`), só depois do aceite de cookies e com eventos só em ação real (PageView, ViewContent, Contact no toque do WhatsApp, Lead na HARA Vision concluída). A CAPI fica inerte até existir `META_CAPI_TOKEN` nas variáveis do Vercel.
CTAs de aluno apontam para `https://app.hairacademiadabeleza.com.br`.

## HAIR Business (`business/`) — 16/10/2026

`site-hair/business/` é **gerado**, não se edita à mão. A fonte é o repositório
`augustollgarcia-max/hair-business-` (`site/gerar.py` + `site/estilo.css`); de lá, `sh site/publicar-www.sh`
copia o site para esta pasta já com links absolutos `/business/...` e sem `.html` (o `vercel.json` daqui usa `cleanUrls`).
Páginas: `/business` (página Barber; `/business/business` redireciona para ela), `/beauty` (Beauty; `/business/beauty` redireciona), `/business/completo` (o antigo hub Business + Beauty, sem link), `/business/historia`,
`/business/assessoria`, `/business/apps`, `/business/mestre-0{1..4}-*` e `/business/beauty-0{5,6}-*`.
O `vercel.json` tem uma CSP própria para `/business(.*)` (Google Fonts e a função `hara-vision-teste` do Supabase);
a home e as demais páginas não foram alteradas.

## Vértice Group (vertice/) — 16/10/2026
Site da rede de escolas parceiras (`/vertice`): marcas do grupo, benefícios, apps, educadores e a **área do parceiro**
(modelos de parceria, simulação de ganho, território, Conexão Work, piloto e FAQ), que fica **cifrada dentro do HTML** e só
abre com um código de convite. Gerado pelo repositório `hair-business-` (`site/vertice.py`, códigos em
`site/vertice_convites.py`, publicação por `site/publicar-www.sh`). Não editar `vertice/index.html` à mão: qualquer
mudança (inclusive revogar um código) é gerar de novo lá e republicar. Cabeçalhos (CSP com Google Fonts, cache de
`/vertice/img`) em `vercel.json`, mesmo padrão do `/business`.

