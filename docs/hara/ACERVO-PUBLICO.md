# Ampliação da base pública HARA — 08/11/2026

Preparado na branch de homologação, sem merge ou publicação de produção.

A base passou de 15 para 41 fichas: 26 novas fichas cobrem os perfis de Allan, Kenny, Gustavo, Wesley, Renata Scatena e Estefania, Beauty, iniciantes, aperfeiçoamento, certificado, materiais, modelos, Instagram profissional, suporte pós-curso, HARA Vision, Rádio Educadora, instalação, Work, história, ecossistema Vértice, parceria, expansão, geometria do método, cabelo, design e visita.

## Fontes e filtros

As 26 fichas foram escritas a partir de 11 arquivos HTML públicos do repositório responsável pelo site. Os hashes foram comparados com a árvore main `43351a2a66c265b505493ae34fc438065524a9b0` via GitHub. Cada ficha registra fonte, caminho público, trecho de evidência, hash e data de revisão em `site-hair/hara/public-cards.json`. A busca web não conseguiu abrir os endpoints nesta execução; a verificação do acervo foi feita nos arquivos públicos versionados, sem afirmar que a nova versão já esteja publicada no domínio.

Também foram lidos `docs/BASE-CONHECIMENTO-HAIR.md`, Core e catálogo antigo de `factory/rara-ponte/knowledge` em Conexão Hair. Eles serviram para identificar limites e conflitos, sem copiar o acervo inteiro para a HARA pública. Foram excluídos: preços e cupons, contatos antigos, propostas ainda não aprovadas, estratégias internas, dados de pessoas, supostas garantias de renda, superlativos, datas de eventos passados e horários não confirmados. A versão antiga de 18 aulas conflita com o cronograma atual de 16: nenhum deles foi transformado em calendário público nesta mudança.

A página Beauty mistura um bloco genérico de dois meses com formatos curtos de Estefania. A resposta de duração agora distingue o iniciante de barbearia e exige confirmação por formato. Manicure/estética permanecem em construção. Renata Scatena não é confundida com Renata Salviato. Não se presume curso de nanoblading por habilitação pessoal da educadora, nem reconhecimento MEC por certificado de curso livre.

## Economia

Perguntas identificadas recuperam até três fichas locais, sem custo de tokens de modelo. Fichas específicas têm preferência sobre frases genéricas. A intenção desconhecida pode usar o Gemini econômico já configurado, somente como seletor de IDs; o prompt agora recebe apenas índice de assuntos, sem textos das respostas, fontes, histórico ou documentos. O índice é limitado a 6000 caracteres; a saída permanece limitada a 128 tokens. Sem configuração, falha do modelo ou saída inválida, vale a resposta local segura. Não foi realizada chamada paga real ao Gemini nesta etapa.

Não há embeddings pagos, banco vetorial novo, coleta de conversas nem novos serviços. Limites de acesso existentes e separação da autenticação foram mantidos. O bloqueio de preços vem antes da recuperação e do modelo, incluindo bolsa, cupom, cashback e taxa. Valores continuam encaminhados ao WhatsApp oficial.

## Verificação automática e limites

`node --test scripts/hara/security.test.cjs scripts/hara/business.test.cjs scripts/hara/knowledge.test.cjs`: 28 testes aprovados, incluindo 26 perguntas com zero chamadas ao modelo, prevalência da regra de preço, metadados/evidência das fontes, distinção de cursos e índice compacto. Os testes de fonte falham se o HTML versionado mudar, exigindo revisão das fichas: não há importação cega de conteúdo novo.

A rotina de Actions inclui o novo teste. A execução de Actions no fork continua suspensa pela plataforma; a configuração não equivale à execução. Não houve nova validação completa de navegador ou publicação de produção nesta ampliação. CRM/grupo e Gemini real seguem com as limitações já registradas em `VERIFICACAO-FUNIL.md`.
