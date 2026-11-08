# HARA — consulta automática ao Acervo HAIR

Preparação em 08/11/2026, baseada na branch de homologação `work/hara-public-chat` (c62539c). Não altera o atendimento publicado nem o banco Supabase.

## Comportamento proposto

A API pública consulta `/api/hara-cards` do Acervo HAIR usando autenticação de serviço somente no servidor. A requisição é GET: nenhuma pergunta, histórico, contato ou dado de visitante é enviado ao Acervo. Os documentos, repositórios, observações e links privados não fazem parte da resposta. O Acervo exporta exclusivamente trechos públicos revisados, ligados a páginas oficiais da HAIR, com fonte, hash e data de revisão.

São 26 fichas iniciais, copiadas das fichas públicas já verificadas da HARA. Os 33 registros anteriores continuam internos, sem aprovação automática. No Acervo, é possível editar o trecho, palavras-chave, fonte, hash e data, ou desmarcar a liberação. Apenas itens externos com acesso confirmado e revisão dos últimos 90 dias entram na consulta. Atualizar o índice não lê nem altera o documento original.

A HARA procura por assunto e retorna até dois trechos com fontes. Perguntas sobre valores continuam indo direto ao WhatsApp, antes da consulta. Não há novo modelo nem embeddings: a leitura é determinística, com cache de no máximo 60 segundos por instância. Atualizações e revogações aparecem no próximo ciclo; após 90 dias, a ficha exige nova revisão. Em falha, revisão expirada ou revogação, as fichas gerenciadas pelo Acervo recebem encaminhamento seguro; a ficha antiga local não volta como fallback. Os demais assuntos da base pública local continuam disponíveis. Perguntas desconhecidas usam encaminhamento sem chamada adicional ao modelo enquanto esta integração estiver ativa.

As 26 fichas iniciais possuem hashes do HTML versionado. Mudança no arquivo de origem exige revisão humana: esta integração sincroniza o trecho liberado no índice, não faz ingestão cega do documento completo.

## Ativação pendente

Variáveis apenas no servidor Vercel do projeto `hair-academia-site`:

- `HARA_ACERVO_ENABLED=true`.
- `HARA_ACERVO_SERVICE_TOKEN`: credencial de serviço do próprio Acervo, no cabeçalho `OAI-Sites-Authorization` somente para o endpoint fixo. Não expor no navegador, código, PR ou logs.

O Acervo conserva sua audiência atual. Não é necessário torná-lo público nem habilitar acesso de alunos. A credencial não fornece identidade de visitante; operações de escrita no índice exigem identidade de usuário autenticado, portanto o leitor de serviço não pode editar registros.

Conforme AGENTS.md, a aprovação de homologação não autoriza merge, credenciais de produção nem publicação da HARA pública. Antes da ativação, revisar este diff, autorizar a configuração de serviço e a publicação, conferir o Redis estável (o recurso de homologação expira em 11/11) e validar o endpoint real na hospedagem.

## Validação

- 37 testes HARA passaram localmente: segurança, regras comerciais, fichas e oito casos novos do leitor remoto (transporte simulado).
- 3 testes do exportador no Acervo passaram: 26 fichas permitidas; exclusão de conteúdo interno, revisão expirada, preços e credenciais.
- TypeScript e build do Acervo são verificados antes de empacotar.
- Não classificar o teste simulado como integração Vercel real. Ativação ponta a ponta depende das variáveis e publicação aprovadas.

Rollback: definir HARA_ACERVO_ENABLED=false no ambiente e reaplicar o deployment; a HARA volta à base local. Os originais permanecem intactos.

## Liberação autorizada em 08/11/2026

O usuário autorizou o envio ao repositório e a publicação. A proteção de produção usa agora o D1 já existente no Acervo, sem Redis temporário. Uma atualização condicional atômica verifica e incrementa juntas as janelas de 6/minuto/IP derivado, 30/dia e 1.000/dia global. O IP permanece somente no servidor Vercel: o Acervo recebe HMAC diário. Contadores de dias anteriores são removidos no próximo acesso. O endpoint exige acesso de serviço pela plataforma e recusa acesso de navegador.

Configuração de produção: HARA_RATE_BACKEND=acervo, HARA_RATE_HMAC (segredo do servidor), HARA_ACERVO_SERVICE_TOKEN, HARA_ACERVO_ENABLED=true, HARA_PUBLIC_ENABLED=true e HARA_GEMINI_ENABLED=false. Nenhuma pergunta sai para o modelo nesta configuração.

O formulário de captação só intercepta o WhatsApp se /api/hara-config confirmar um relay de CRM configurado. Enquanto esse serviço não estiver conectado, o link oficial do WhatsApp continua direto. Não declaramos cadastro ou notificação enviados.
