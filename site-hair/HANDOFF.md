# HANDOFF — Site público HAIR Academia da Beleza

Documento único para quem for continuar este trabalho.
Última atualização: 19/08/2026.

---

## 1. Onde está o código

| | |
|---|---|
| **Repositório** | `github.com/augustollgarcia-max/ui-ux-pro-max-skill` |
| **Branch** | `claude/hair-academia-rebuild-am7x9c` |
| **Pasta** | `site-hair/` |
| **Último commit** | `98e7fde` |

```bash
git clone https://github.com/augustollgarcia-max/ui-ux-pro-max-skill
cd ui-ux-pro-max-skill
git checkout claude/hair-academia-rebuild-am7x9c
cd site-hair
```

Não há PR aberto. O branch está publicado e atualizado.

---

## 2. Como rodar

```bash
cd site-hair
python3 -m http.server 8899
# abrir http://127.0.0.1:8899
```

**Precisa ser por HTTP.** Abrir o `index.html` com duplo clique (`file://`) faz o
navegador bloquear as fontes por CORS e a página cai para fonte de sistema.

Não há build, não há `npm install`, não há dependência externa. É HTML + CSS + JS
puro num arquivo só, com as fontes auto-hospedadas.

---

## 3. Como publicar

É um site estático. Serve qualquer host:

- **Netlify / Vercel:** arrastar a pasta `site-hair/`, ou apontar o projeto para o
  repositório com *publish directory* = `site-hair` e *build command* vazio.
- **Hospedagem tradicional:** subir o conteúdo de `site-hair/` por FTP.

O site é **isolado do app Conexão Hair**. Não tem service worker, não tem Auth,
não toca em OAuth nem em PWA. Os CTAs de aluno apontam para
`https://app.hairacademiadabeleza.com.br`.

---

## 4. Estrutura da página

Ordem das seções no `index.html`:

| # | Seção | Âncora | Linha aprox. |
|---|---|---|---|
| 1 | Hero | `#inicio` | 512 |
| 2 | Pilares (Educação · Prática · Tecnologia · Mercado) | `#a-hair` | 571 |
| 3 | Formações — 3 cards | `#formacoes` | 593 |
| 4 | Faixa de autoridade | — | 649 |
| 5 | Metodologia HAIR | `#metodologia` | 671 |
| 6 | Ação social | `#conexao-hair` | 701 |
| 7 | Estrutura para o aluno (materiais + linha de produtos) | `#estrutura` | 714 |
| 8 | 10 anos — carrossel | `#dez-anos` | 751 |
| 9 | CTA final | `#contato` | 790 |
| 10 | Rodapé | — | 807 |

---

## 5. Paletas oficiais das formações

Definidas como tokens CSS no topo do `index.html`:

```css
--c-barber:#0F7A4F;   --c-barber-bg:#07120C;                    /* verde s/ preto-esverdeado */
--c-beauty:#D9C6A5;   --c-beauty-bg:#15110A;                    /* creme / champanhe */
--c-brow:#6B1F3A;     --c-brow-bg1:#4A1024; --c-brow-bg2:#1B0A11; /* bordô */
```

Sistema geral da página: `--bg:#050705` · `--gold:#D3AD58` ·
`--gold-deep:#C9A227` · `--green:#0A6F50` · `--text:#F6F3ED`.
Tipografia: **Playfair Display** (títulos) + **Inter** (texto), auto-hospedadas
em `assets/fonts/`.

---

## 6. Trocar uma foto

Substitua o arquivo em `assets/` **mantendo o nome**. Nenhuma linha de código muda.

| Slot | Arquivo |
|---|---|
| Hero | `hero-hair.webp` + `hero-hair-{480,768,1152}.webp` |
| Card Conexão Barber | `card-barber.webp` |
| Card Conexão Beauty | `card-beauty.webp` |
| Card Conexão Brow & Lash | `card-brow.webp` |
| Metodologia | `method-class.webp` |
| Ação social | `social-action.webp` |
| Linha de produtos (destaque) | `produtos-linha.webp` |
| Produto secundário | `produto-cera.webp` |
| Logo | `logo-hair.png` |
| Carrossel 10 anos | `assets/anos/a01…a22.webp` |

Para gerar o `.webp` a partir de um JPG: qualquer conversor serve
(squoosh.app, `cwebp -q 84 foto.jpg -o foto.webp`). Largura recomendada:
1200–1400 px para as grandes, 760 px para as do carrossel.

**Acervo bruto:** `assets/galeria/` guarda 58 fotos reais da escola que não
estão em uso, disponíveis para trocas.

---

## 7. Contato configurado

- **WhatsApp:** (16) 99168-7977 → `5516991687977`
- Cada card de formação abre um modal com **descrição · para quem é · principais
  aprendizados · metodologia · possibilidades profissionais** e um botão
  **Horários e valores** que abre o WhatsApp com mensagem específica do curso.
- Para mudar o número: uma única constante no `<script>`, `var WA = "5516991687977"`.
- Para mudar os textos dos cursos: objeto `COURSES` no mesmo `<script>`.

---

## 8. O que já foi verificado

Testado com Playwright/Chromium em 360, 390, 412, 430, 768, 1024, 1280, 1440 e 1920 px:

- rolagem horizontal: **0 px em todas**
- erros de console: **nenhum**
- requisições HTTP ≥ 400: **nenhuma**
- imagens quebradas: **nenhuma**
- âncoras de navegação: **17 válidas, 0 quebradas**
- modais das 3 formações: **abrem, completos, WhatsApp correto por curso**
- modal de instalação e menu móvel: **funcionais**
- alvos de toque abaixo de 40 px no mobile: **0**

Critérios de proporção medidos contra a referência aprovada estão em
`criterios-de-qualidade.md`; o registro do ciclo de design está em
`progresso-design.md`.

---

## 9. O que ficou pendente

1. **Foto de ação social interna.** A referência aprovada mostra uma cena
   interna com a equipe de camiseta HAIR. A que está no ar é real, mas externa
   (`social_03`). Se aparecer uma foto interna boa, é só trocar
   `social-action.webp`.
2. **Duas imagens de produto foram descartadas** por terem texto ilegível
   gerado por IA (o frasco de minoxidil e o pote verde). Se houver foto real
   desses produtos, dá para ampliar o grid da seção `#estrutura`.
3. **Quatro fotos do carrossel falharam na conversão** (`a04`, `a12`, `a16`,
   `a18` não existem). O carrossel roda com 18 e não quebra. Se quiser as
   quatro de volta, reconverter os originais.
4. **Seção "Histórias/Depoimentos" não existe.** Foi decisão sua tirar
   HISTÓRIAS do menu porque não havia depoimentos reais e não se inventa
   depoimento. Quando houver, o lugar natural é depois do carrossel dos 10 anos.
5. **Nada de backend.** O site não tem formulário nem banco. Toda conversão
   passa pelo WhatsApp.

---

## 10. Regras que precisam ser respeitadas por quem continuar

- **Não mexer no app Conexão Hair.** Ele vive em outro repositório
  (`conexao-hair-deploy`) e tem login, Supabase, Firebase e service worker.
  Este site é separado de propósito.
- **Não inventar depoimento, número ou resultado.** Os números que estão no ar
  (+4.000 formados, desde 2017) foram fornecidos pela escola.
- **Não usar apelo promocional agressivo** ("100% GRÁTIS", "ÚLTIMAS VAGAS" em
  vermelho). A seção de materiais foi escrita de propósito em tom institucional.
- **Não usar imagem com texto de campanha gravado** como foto de fundo — o texto
  colide com o texto da página. Já aconteceu uma vez e foi corrigido.
- **Manter o site em HTML puro.** Não precisa de framework e a simplicidade é o
  que permite trocar foto sem tocar em código.
