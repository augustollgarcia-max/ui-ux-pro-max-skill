# Critérios de Qualidade — Reconstrução HAIR Academia da Beleza

Extraídos por **medição direta** da `ref/REFERENCIA-A-pagina-completa.jpg` (1024×1536).
A coluna desktop da referência mede **837 px de largura × 1536 px de altura**.
Fator de conversão para viewport 1440: **×1,7205**.

Toda medida abaixo é expressa em **% da largura do viewport** (invariante de escala) com o
equivalente em px @1440 entre parênteses. Nenhum critério usa "bonito", "premium" ou "moderno".

---

## M1 — Densidade fotográfica e geometria da primeira dobra

| Mecanismo | Alvo (medido na referência) | Tolerância |
|---|---|---|
| Altura do hero ÷ largura do viewport | **0,517** (744 px @1440) | ±0,04 |
| Cobertura fotográfica da área do hero | **100%** (foto full-bleed sob o texto) | — |
| Início da foto legível (fim do degradê) | **38%** a partir da esquerda | ±4 pp |
| Largura da coluna de texto (parágrafo) | **30%** (432 px) | ±3 pp |
| Extensão da linha de botões | **52%** (750 px) | ±4 pp |
| Área do hero visualmente vazia (sem foto e sem texto) | **0%** | máx. 5% |

**Falha automática:** qualquer bloco preto chapado > 5% da área do hero (defeito presente no
build atual: ~30% do hero é vazio abaixo das provas).

---

## M2 — Razão tipográfica H1 : parágrafo de apoio

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| H1 (serifada display) | **4,3% da vw** (62 px @1440) | ±0,3 pp |
| Parágrafo de apoio | **1,30% da vw** (19 px @1440) | ±2 px |
| **Razão H1 ÷ parágrafo** | **3,2 : 1** | ±0,3 |
| Altura de linha do H1 | **0,93** (compacta, 3 linhas) | ±0,05 |
| Nº de linhas do H1 no desktop | **3** ("Da sala de aula" / "ao mercado" / "da beleza.") | exato |

**Estado atual = 4,9 : 1** (H1 72 px, lead 14,7 px) → reprovado.

---

## M3 — Proporção e anatomia do card de formação

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| Proporção do card (larg. ÷ alt.) | **0,94** (quase quadrado, levemente retrato) | ±0,08 |
| Fatia de **foto** dentro do card | **52%** da altura | ±5 pp |
| Fatia de **corpo escuro** (texto) | **48%** da altura | ±5 pp |
| Largura do card | **29,2%** (420 px) | ±2 pp |
| Gap entre cards | **1,0%** (14 px) | ±6 px |
| Raio de borda | **6 px** | ±2 px |
| Badge circular de ícone | **Ø 83 px**, centrado na costura foto/corpo, recuado 20 px da esquerda | ±8 px |
| Razão título ÷ corpo do card | **1,95 : 1** (29 px / 15 px) | ±0,2 |
| Botão SAIBA MAIS | outline, 165 × 39 px, dentro do card | ±10 px |

**Estado atual:** cards em retrato 1:2 com texto sobre a foto e 4ª coluna de stats na mesma
linha → reprovado em proporção **e** em anatomia.

---

## M4 — Largura de conteúdo e alinhamentos predominantes

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| Margem lateral do conteúdo | **4,2%** (60 px) de cada lado | ±1 pp |
| Largura útil de conteúdo | **91,6%** (1320 px) | ±2 pp |
| Grade de pilares e de stats | **4 colunas iguais de 22,9%** | ±1 pp |
| Blocos centralizados | apenas 3: cabeçalho "NOSSAS FORMAÇÕES", CTA final, rodapé | exato |
| Blocos alinhados à esquerda | hero, metodologia, ação social | exato |
| Nº de eixos verticais distintos no desktop | **≤ 3** (4,2% · 38% · 50%) | exato |

---

## M5 — Ritmo vertical e densidade por seção

Alturas medidas na referência, em fração da largura do viewport:

| Seção | Altura ÷ vw | px @1440 |
|---|---|---|
| Hero | 0,517 | 744 |
| Faixa de pilares | 0,111 | 160 |
| Formações (kicker + h2 + cards) | 0,435 | 626 |
| Faixa de autoridade (stats) | 0,117 | 168 |
| Metodologia | 0,305 | 439 |
| Ação social | 0,211 | 304 |
| CTA final | 0,139 | 200 |

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| Altura total da página ÷ largura do viewport | **1,83** (2640 px @1440) | ±0,15 |
| Nenhuma seção acima de | 0,52 · vw | — |
| Nenhuma seção abaixo de | 0,10 · vw | — |

---

## M6 — Divisão fotografia ÷ texto nas seções em duas colunas

| Seção | Foto | Texto | Comportamento da foto |
|---|---|---|---|
| Metodologia | **62%** (direita) | 38% (esquerda) | **sangra** até a borda direita, sem raio |
| Ação social | **50%** (esquerda) | 50% (direita) | **inset** 1,7% da borda, raio 8 px |

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| Nº de seções em 2 colunas | **2** (não 1 faixa de 4 colunas) | exato |
| Fotos com conteúdo real renderizado (não preto) | **100%** | 0 falhas |
| Grade de itens da metodologia | **2 × 2** | exato |

**Estado atual:** metodologia + ação social comprimidas numa única faixa de 4 colunas e a
foto da metodologia renderiza **preta** → reprovado.

---

## M7 — Disciplina cromática e de contraste

| Mecanismo | Alvo | Tolerância |
|---|---|---|
| Nº total de matizes na página | **4** — preto-esverdeado, dourado, verde, off-white | máx. 5 (roxo só no card Brow & Lash) |
| Fundo base | `#050705`–`#0A0F0C` | — |
| Dourado (kickers, números, bordas) | `#C9A227`–`#D3AD58` | — |
| Verde (botão primário, ícones) | `#0A6F50`–`#17805F` | — |
| Off-white (texto) | `#F0EBE0`–`#F6F3ED` | — |
| Roxo (exclusivo do card Brow & Lash) | `#3A1F4D` | 1 uso |
| Contraste do texto do hero sobre a foto | **≥ 7:1** | mínimo |
| Kickers | caixa-alta, tracking **0,22 em**, dourado, ≤ 0,62 rem | — |
| Nº de famílias tipográficas | **2** (serifada display + sans) | exato |

**Falha automática:** gradiente decorativo aleatório, sombra colorida, ou qualquer 5ª matiz
fora da lista.

---

## Critérios funcionais de aprovação (§7, §8, §19 do briefing)

Não são estéticos — são binários:

1. Todo card de formação tem **SAIBA MAIS** que abre apresentação com: descrição · para quem é ·
   principais aprendizados · metodologia · possibilidades profissionais.
2. Toda apresentação tem caminho **HORÁRIOS E VALORES** → WhatsApp **(16) 99168-7977** com
   mensagem pré-preenchida **específica do curso**.
3. Zero rolagem horizontal em 360 / 390 / 412 / 430 / 768 / 1024 / 1440 / 1920.
4. Zero erro de console, zero requisição HTTP ≥ 400, zero imagem quebrada.
5. Nenhum link de navegação aponta para âncora inexistente.
6. Nenhum placeholder, nenhum SVG onde a referência mostra fotografia.
7. Nenhum depoimento ou número inventado.

---

## Como cada crítico usa este arquivo

- **Crítico do Briefing** — só os 7 critérios funcionais acima. Não julga estética.
- **Crítico do Sistema** — M4, M7 e a consistência de tokens/componentes.
- **Crítico Visual** — M1, M2, M3, M5, M6 por comparação de screenshots lado a lado,
  às cegas, sem saber qual composição é a nossa. Veredito **APROVADO** ou **REPROVADO**.
