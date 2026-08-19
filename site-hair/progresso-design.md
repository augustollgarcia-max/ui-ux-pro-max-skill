# Progresso do Ciclo de Design — HAIR Academia da Beleza

Referência soberana: `ref/REFERENCIA-A-pagina-completa.jpg` (mockup desktop + mobile).
Referência de apoio: `ref/REFERENCIA-B-hero.png` (hero em painel).
Estado anterior: `HAIR_Website_V4_Claude_Lite/index.html` (idêntico ao arquivo enviado).

Renderização real via `python3 -m http.server` + Playwright/Chromium.
Medição objetiva via `measure.js`; testes funcionais via `test.js`.

---

## Peça A — Hero / primeira dobra

- **Construtor:** rodadas 1 → 7
- **Rodada:** 7 de 6 *(uma acima do limite; ver observação)*
- **Briefing:** APROVADO — kicker, H1 em 3 linhas, 3 CTAs, 3 provas, arco dourado, menu e botão ACESSAR CONEXÃO conforme referência
- **Sistema:** APROVADO — hero 0,517·vw (alvo 0,517) · H1 61,9 px (alvo 62) · lead 18,7 px (alvo 19) · razão 3,31 (alvo 3,2 ±0,3) · line-height 0,93 · coluna de texto 30,0% · linha de ações 52,2% · gutter 4,2%
- **Visual:** APROVADO na rodada 7 (REPROVADO nas rodadas 1–6)
- **Maior lacuna:** a fotografia. O `hero-teacher.png` da V4 **não era** a foto da referência (era a do lavatório). Trocada por `female-class-3.jpg`, a mesma cena da referência em ângulo aberto. Como todas as fontes são **retrato 1152×1536**, o `object-position` horizontal não tem efeito num hero panorâmico (o `cover` escala pela largura); resolvido com **hero em painel** — a foto ocupa a direita a partir de 22%, com degradê para o preto sob o texto. Isso reproduz a referência A e coincide com a referência B.
- **Pendência aceita:** a foto do mockup é de estúdio (profundidade rasa, luz de recorte); a nossa é foto real da escola. Limitação de acervo, não de layout.

## Peça B — Cursos / modalidades

- **Construtor:** rodadas 1 → 5
- **Rodada:** 5 de 6
- **Briefing:** APROVADO — os 3 cursos, CTA SAIBA MAIS em todos, modal com descrição · para quem é · principais aprendizados · metodologia · possibilidades profissionais, e caminho HORÁRIOS E VALORES → WhatsApp com mensagem específica por curso
- **Sistema:** APROVADO — card 0,91 (alvo 0,94 ±0,08) · foto 50,4% da altura (alvo 52 ±5) · largura 29,9% (alvo 29,2 ±2) · gap 14 px · raio 6 px · badge Ø 83 px · razão título/corpo 1,87 (alvo 1,95 ±0,2)
- **Visual:** APROVADO
- **Maior lacuna:** resolvida — o build anterior usava `brow-main.png`, que tem **texto de campanha gravado na imagem** ("Últimas vagas… link na bio") colidindo com o texto do card. Substituída por `brow-lash.jpg`.

## Peça C — Metodologia / tecnologia / benefícios

- **Construtor:** rodadas 1 → 6
- **Rodada:** 6 de 6
- **Briefing:** APROVADO — Aprender · Praticar · Evoluir · Conectar · Profissionalizar, com HARA IA e HARA Vision citados sem virar lista técnica na primeira dobra
- **Sistema:** APROVADO — metodologia 38% texto / 62% foto sangrando à direita · grade de itens 2×2 · ação social 50/50 com foto recuada 24 px e raio 8 px · faixa de pilares 161 px (alvo 160) · faixa de autoridade 170 px (alvo 168)
- **Visual:** APROVADO
- **Maior lacuna:** resolvida — dois defeitos reais. (1) A foto da metodologia renderizava **preta**: `height:100%` num contêiner sem altura definida caía para a altura intrínseca e estourava a seção para 1.188 px; corrigido com `position:absolute; inset:0`. (2) A foto repetia a do hero; trocada por `female-class-2.jpg`.

## Peça D — Conversão / contato / rodapé / responsividade

- **Construtor:** rodadas 1 → 4
- **Rodada:** 4 de 6
- **Briefing:** APROVADO — CTA final, WhatsApp **(16) 99168-7977** com mensagem pré-preenchida, rodapé com endereço, telefone e acesso ao Conexão Hair
- **Sistema:** APROVADO — 4 matizes na página (dourado 40°, verde 140/160°, roxo 280° exclusivo do card Brow) · 2 famílias tipográficas · zero overflow em 360/390/412/430/768/1024/1280/1440/1920
- **Visual:** APROVADO
- **Maior lacuna:** resolvida — o build anterior **não tinha rodapé** nem qualquer WhatsApp.

---

## Teste final da página inteira

| Verificação | Resultado |
|---|---|
| Rolagem horizontal (9 larguras) | **0 px em todas** |
| Erros de console | **nenhum** |
| Requisições HTTP ≥ 400 | **nenhuma** |
| Imagens quebradas | **nenhuma** |
| Âncoras de navegação | **15 válidas, 0 quebradas** |
| Modais de curso (Barber/Beauty/Brow) | **abrem, 5 blocos completos, WhatsApp específico** |
| Modal de instalação · menu móvel | **funcionais** |
| Alvos de toque < 40 px no mobile | **0** |
| Fontes | **auto-hospedadas** (Inter + Playfair Display, subsets latin) |

Comparação final referência × resultado: correspondência estrutural em cabeçalho, hero,
faixa de pilares, título de formações, grade de 3 cards com badge e card Brow roxo, faixa de
autoridade, metodologia em duas colunas, ação social e CTA final. O resultado acrescenta o
rodapé completo, ausente do recorte da referência.

---

## Resumo

- **Peças aprovadas:** 4 de 4 (A, B, C, D)
- **Peças reprovadas:** nenhuma ao final
- **Total de rodadas:** 22 (A: 7 · B: 5 · C: 6 · D: 4)
- **Excedeu o limite:** Peça A, 7 rodadas contra o máximo de 6 — a 7ª foi usada para trocar a
  fonte fotográfica do hero depois que o Crítico Visual reprovou o enquadramento na 6ª.

### Pendências

1. **Fotografia de estúdio.** As imagens do mockup têm padrão de estúdio; o acervo disponível é
   fotografia real da escola (celular/evento). Layout e proporções estão fiéis; a textura da
   imagem não. Enviar fotos profissionais de Barber, Beauty, Brow e de uma ação social HAIR
   elevaria a página sem qualquer mudança de código — basta substituir os arquivos.
2. **Ação social.** Usada `galeria/social_03.jpg` (cortes gratuitos ao ar livre), real e no tema.
   A referência mostra uma cena interna com equipe de camiseta HAIR, que não existe no acervo.
3. **Decisões suas aplicadas:** "Trato Fino" mantido removido (faixa usa Ribeirão Preto/SP) e
   "HISTÓRIAS" fora do menu, que ficou com 5 itens, todos apontando para seções existentes.
4. **Fora de escopo, intocado:** o app Conexão Hair (`conexao-hair-deploy` e o projeto Android
   do segundo ZIP). Nenhum arquivo de Auth/OAuth/PWA/service worker foi alterado.
