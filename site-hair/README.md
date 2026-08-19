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
