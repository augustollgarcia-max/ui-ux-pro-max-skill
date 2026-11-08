# HARA — funil público, Core e continuidade comercial

Preparado em08/11/2026, somente na branch de homologação. Nenhuma integração de produção foi alterada.

## Orientações atuais do usuário

- Nunca informar preço de tabela, valor, parcela, estimativa ou desconto numérico. A resposta fixa é: “Como os valores alteram de acordo com as promoções e campanhas, eu vou te direcionar direto para o WhatsApp da HAIR”.
- Todo CTA comercial da HARA e os links oficiais do site priorizam a continuidade no WhatsApp (16)99255-8810.
- Captar cidade, telefone e e-mail; nome opcional. Ribeirão Preto primeiro, dez cidades da região e uma opção de outra cidade digitada.
- Compartilhar resumo e dados com CRM/equipe apenas após consentimento específico; permitir revisão do resumo. Follow-up tem aceite opcional separado, inicialmente desmarcado.
- Avisar o grupo interno quando houver solicitação de continuidade, com o contexto. Não alegar que o visitante enviou mensagem no WhatsApp só porque clicou no site.

## Fontes e precedência

Base pública ampliada com metodologia, curso iniciante, jornada, garantia, academias, aplicativos, carreira, assessoria e atendimento de modelos, conforme páginas do site. O Core localizado em `conexao-hair-deploy/factory/rara-ponte/knowledge/core/core.json`, versão2026-08-30.1, foi lido como referência operacional. A regra antiga de preços de tabela, o telefone antigo e detalhes não confirmados foram excluídos; a instrução atual do usuário prevalece. Nenhum aluno, segredo ou arquivo privado é incluído na base pública.

Gemini preparado: `google/gemini-2.5-flash-lite`, confirmado no catálogo vivo de AI Gateway em08/11/2026. Não há caminho Sonnet/Claude no novo atendimento público. O Gemini identifica assuntos quando a regra local não basta, mas só pode selecionar IDs de fichas autorizadas. O servidor monta o texto final; texto livre gerado pelo modelo não é exibido. Perguntas conhecidas e preços não fazem chamada de modelo. Modelo ausente, sem credencial/OIDC ou com erro mantém a resposta verificada e o CTA comercial.

## Fluxo preparado

1. Visitante conversa no site; aceite `public-chat-v2` informa sobre possível identificação de assunto por Gemini viaVercel/Google.
2. CTA oficial abre formulário com cidade, telefone, e-mail, nome opcional e resumo revisável. Não há gravação desses campos em localStorage ou cookies.
3. Com aceite `lead-contact-v1`, o navegador envia ao endpoint próprio `/api/hara-lead`.
4. O servidor valida esquema, contato, origem, limite e idempotency key. Somente um relay autenticado, previamente configurado, pode receber o payload.
5. O relay precisa persistir CRM e fila de notificação antes de confirmar. Só então a interface oferece link WhatsApp com cidade e referência; telefone/e-mail não são anexados à URL.
6. O envio ao grupo e eventual follow-up são responsabilidade do serviço de fila/WhatsApp aprovado. O evento de site chama-se `site_handoff_requested` e significa solicitação de continuidade. A confirmação de uma mensagem realmente enviada pelo visitante depende do webhook do provedor.

## Contrato do relay ainda a implementar/configurar

Destino permitido: endpoint HTTPS de projeto Supabase com caminho exato `/functions/v1/hara-site-intake`. Não existe esse endpoint ativo no projeto consultado. O endpoint de site permanece fechado por padrão enquanto faltarem `HARA_LEADS_ENABLED`, `HARA_LEADS_RELAY_URL` e `HARA_LEADS_RELAY_SECRET`. Nenhuma dessas variáveis de captação foi criada em produção.

Cabeçalhos server-to-server: `X-Hara-Timestamp`, `X-Hara-Signature` (`sha256=HMAC(secret,timestamp+'.'+rawBody)`) e `Idempotency-Key`. O secret fica somente nos servidores. A função receptora deverá usar comparação constante da assinatura, aceitar no máximo cinco minutos de desvio e registrar `eventId` junto do hash do payload. Reentrega idêntica deve retornar a mesma referência; mesmo ID com corpo diferente deve ser recusado, sem cadastrar ou notificar novamente.

Campos recebidos: evento, nome opcional, telefone normalizado, e-mail, cidade, página, tópicos autorizados, resumo até2000 caracteres, consentimento e data, `followup` e `followupConsent`. Não aceitar número remetente, grupo, providerURL ou instrução arbitrária vindos do navegador. O grupo é fixado no backend após confirmação do usuário e da conexão do remetente.

Resposta exigida para sucesso:

```json
{"accepted":true,"crmStored":true,"notificationQueued":true,"eventId":"mesmo UUID recebido","reference":"HAIR-referencia-valida"}
```

Sem confirmação completa, a UI não confirma CRM/notificação e não gera redirecionamento como se o cadastro tivesse concluído. A validação do formulário pode ser demonstrada em homologação, mas não há gravação comercial real configurada nesta etapa.

## Mensagem proposta para o grupo

> Novo atendimento pelo site HAIR — solicitou continuidade no WhatsApp.
> Referência: HAIR-…
> Nome: … (quando informado)
> Cidade: …
> Telefone: …
> E-mail: …
> Interesse/assuntos: …
> Resumo revisado pelo visitante: …
> Origem: página do site
> Contatos posteriores: autorizado / não autorizado

A fila deverá ter deduplicação, tentativas com backoff e status `pending/sent/failed`, separando enfileiramento de entrega confirmada pelo provedor. O resumo deve ser tratado como dados não confiáveis, nunca como instruções ao robô. Sem aceite de follow-up, não criar contatos proativos posteriores. A cadência e os textos de follow-up ainda precisam ser definidos, não foram agendados.

## Pendências concretas

1. Receber o link do grupo que o usuário anunciou e confirmar grupo privado, remetente e provedor capazes de enviar nele. Convite de grupo não substitui autenticação da integração. A documentação atual da360dialog exige elegibilidade específica para GroupsAPI e não oferece grupos para números em coexistência; o código CRM existente menciona coexistência. Portanto não prometer envio por CloudAPI sem validar a conta.
2. Preparar e aprovar o receiver/outbox/CRM com esquema atual do backend antes de qualquer publicação ou permissão de produção. A listagem de funções do projeto consultado não mostrou `hara-site-intake`, `crm-whatsapp-webhook` nem `crm-rotinas` como implantadas.
3. Reativar a execução de Actions no fork, ou aprovar outro runner disponível. A UI doGitHub informa: “Workflows are not currently being run on this fork due to the scale of GitHub Actions usage. A repository maintainer can choose to re-enable these.” O workflow foi salvo, mas os48 layouts automatizados e os checks de formulário não têm execução aprovada. Não alterar essa política silenciosamente.
4. Testar serviço estável de limites e integrações reais, e obter aprovação específica para produção.

Testes locais atuais:23 passaram, cobrindo preço, seleção Gemini controlada, schemas, consentimentos, HMAC, destino de relay, falta de configuração e ausência de confirmação CRM/fila. As chamadas Gemini, relay e Redis desses testes são simuladas. Os testes reais da etapa anterior permanecem registrados emHOMOLOGACAO.md.

Fontes: páginas públicas `/business`, `/beauty`, `/business/apps`, `/business/assessoria`; Core acima; catálogo `https://ai-gateway.vercel.sh/v1/models`; `https://docs.360dialog.com/docs/messaging/groups`.
