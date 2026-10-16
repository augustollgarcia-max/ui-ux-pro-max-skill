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

- `index.html` — página completa (HTML + CSS + JS inline, sem dependências externas)
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

WhatsApp **(16) 99168-7977** (`5516991687977`), com mensagem pré-preenchida por curso.
CTAs de aluno apontam para `https://app.hairacademiadabeleza.com.br`.

## HAIR Business (`business/`) — 16/10/2026

`site-hair/business/` é **gerado**, não se edita à mão. A fonte é o repositório
`augustollgarcia-max/hair-business-` (`site/gerar.py` + `site/estilo.css`); de lá, `sh site/publicar-www.sh`
copia o site para esta pasta já com links absolutos `/business/...` e sem `.html` (o `vercel.json` daqui usa `cleanUrls`).
Páginas: `/business` (HAIR Business + Beauty), `/business/business`, `/business/beauty`, `/business/historia`,
`/business/assessoria`, `/business/apps`, `/business/mestre-0{1..4}-*` e `/business/beauty-0{5,6}-*`.
O `vercel.json` tem uma CSP própria para `/business(.*)` (Google Fonts e a função `hara-vision-teste` do Supabase);
a home e as demais páginas não foram alteradas.
