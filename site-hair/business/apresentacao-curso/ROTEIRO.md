# Vídeo de apresentação · Curso de Barbeiro · HAIR Business

Formato: vertical 9:16 (1080×1920), 30 fps, ~1 min 51 s. Narração em português (voz masculina neural), trilha instrumental com ducking sob a voz. Pensado para WhatsApp, Instagram (Reels/Stories) e tela do celular.

## Fontes de cada informação

| Informação | Fonte | Observação |
|---|---|---|
| Nome oficial | `HAIR Academia da Beleza` (skill de identidade) | nunca alterar |
| Endereço de atendimento | `site-hair/DADOS-CADASTRAIS.md` → Av. Presidente Vargas, **1265**, 16º andar | o áudio do pedido dizia 1269; a fonte única diz 1265 |
| Mestres e academias | `site-hair/business/mestre-0*.html` | Allan Rich, Kenny Wolf, Gustavo Rosattí, Wesley Sharper (4 cadastrados) |
| Recursos do app | `site-hair/business/apps.html` | Conexão Hair, HARA Vision, Rádio Educadora, Conexão Work |
| Logos | `site-hair/assets/logo-hair.png` e `site-hair/vertice/img/oficial/*` | copiadas byte a byte, sem alteração |
| Fotos | 20 imagens enviadas pelo Augusto + retratos oficiais dos mestres do site | duas capturas de tela foram recortadas para remover a interface do celular |
| Música | "Inspired", Kevin MacLeod (incompetech.com), CC BY 4.0 | crédito no último quadro; a trilha do site (Arctic Monkeys) não pode ir em vídeo comercial |

## Roteiro (texto na tela + narração)

| # | Cena | Narração |
|---|---|---|
| 01 | Abertura · logo HAIR · "Sua carreira começa com quem vive a barbearia." | Sua carreira começa com quem vive a barbearia. Curso de barbeiro da HAIR Academia da Beleza. |
| 02 | Técnica. Presença. Evolução. | Técnica. Presença. Evolução. Aqui você não faz só um curso: você constrói uma profissão. |
| 03 | Formatos: Manhã 2×/semana · 2 meses; Noite 2×/semana · 2 meses; Domingos 1×/semana · 4 meses | Curso iniciante em dois meses, duas aulas por semana, de manhã ou à noite. Ou aos domingos: uma aula por semana, em quatro meses. |
| 04 | Kit de materiais incluso (máquina, tesoura, navalha) | Kit de materiais incluso nas aulas: máquina, tesoura, navalha, tudo o que o aluno precisa. |
| 05 | Ambientes reais (fotos da barbearia) | Você aprende dentro de barbearias reais, com clientes de verdade. |
| 06 | Os principais educadores de Ribeirão Preto e região, cada um com seu polo | …Allan Rich, Kenny Wolf, Gustavo Rosattí e Wesley Sharper. |
| 07 | App Conexão Hair: Biblioteca digital · HARA Vision · Rádio Educadora · Direcionamento de carreira | No aplicativo Conexão Hair: biblioteca digital com apostilas e videoaulas; a HARA Vision, que analisa a foto do seu corte; a Rádio Educadora; e o seu direcionamento de carreira. |
| 08 | Conexão Work: salões de Ribeirão Preto e região veem o seu perfil | E pelo Conexão Work, salões de Ribeirão Preto e região veem o seu perfil. Indicação direta para o mercado de trabalho. |
| 09 | Suporte em cursos, ações e eventos; aulas aos finais de semana | Suporte em cursos e eventos, com aulas aos finais de semana em ações da comunidade HAIR. |
| 10 | Certificado nacional · opção internacional +118 países (parceria com a Federação) | Certificado reconhecido nacionalmente. Ou internacional, válido em mais de cento e dezoito países, pela parceria com a Federação. |
| 11 | Atendimento com hora marcada · Av. Presidente Vargas, 1265, 16º andar · gatilhos "DIGITE: EU QUERO" | Atendimento com hora marcada… Quer conhecer o espaço das aulas? Digite: eu quero. Quer saber os valores? Digite: eu quero. |

## Como regerar

```bash
# 1) narração (precisa de rede; edge-tts) e trilha
python3 build-audio.py <pasta_voz> <musica.mp3> trilha.wav
# 2) quadros → vídeo mudo (Playwright + ffmpeg)
node render.mjs render-silencioso.mp4 30
# 3) juntar
ffmpeg -i render-silencioso.mp4 -i trilha.wav -c:v copy -c:a aac -b:a 160k -shortest apresentacao-curso.mp4
```

A tabela `TL` em `motion.html` e `PRE/POST` em `build-audio.py` têm que bater: a duração de cada cena é pré + narração + pós.
