# Verificação do funil preparado

Data:08/11/2026. Versão de código testada manualmente no navegador: `254a938e55c30a8dfc077e6402c02c528a2b9f30`.

Preview imutável: https://hair-academia-site-efrihp2nx-lemosluizgarcia-8715s-projects.vercel.app/
Deployment: `dpl_7NYywtQMQ4WYd1Tzh6kHAFT6zBhj`, READY, alvo não produtivo.

## Observado no navegador real

- Pergunta “Qual o valor do curso?” recebeu a frase fixa sobre promoções/campanhas e encaminhamento; nenhum valor comercial foi informado.
- O CTA “Continuar no WhatsApp” abriu o formulário comercial com nome opcional, cidade, telefone, e-mail, resumo revisável e dois aceites separados.
- Ribeirão Preto aparece primeiro. “Outras cidades” revelou dez municípios da região e “Outra cidade”; Jardinópolis foi selecionada no teste.
- Foram preenchidos somente telefone e e-mail sintéticos, com aceite de contato e sem aceite de follow-up. Nenhum dado real de cliente foi utilizado.
- A solicitação retornou erro seguro porque o relay CRM/grupo ainda não está configurado. A interface manteve o formulário e informou que não houve confirmação de cadastro ou aviso ao grupo. Não se enviou mensagem real a grupo ou cliente.
- Uma pergunta ambígua retornou o fallback verificado. A autenticação/chamada efetiva do Gemini não ficou comprovada; a consulta de logs do modelo não retornou evento. Portanto Gemini está preparado no código e habilitado apenas para tentativa em preview, mas não deve ser descrito como integração de modelo validada. Não foram criadas ou copiadas chaves administrativas/de alunos.

## Testes e automação

23 testes locais passaram, com transporte de modelo/relay/Redis simulado. O contrato estático do site também passou.

O agente revisou a suíte de navegador:24 layouts por motor (Chromium eWebKit,48 no total), emulação móvel e nove verificações do formulário, com artefatos de evidência. A execução real dessa rotina continua bloqueada pela suspensão do Actions no fork; não há run aprovado. O workflow está salvo em `.github/workflows/hara-public-tests.yml`, com token somente leitura e sem secrets de produção.

A UI pública https://github.com/augustollgarcia-max/ui-ux-pro-max-skill/actions confirmou que as execuções do fork estão suspensas por escala de uso e podem ser reativadas por um mantenedor. Essa política não foi alterada, nem foram alteradas permissões para tentar contornar o bloqueio. A instalação alternativa de Chromium Headless Shell local também falhou por download vazio/truncado.

## Falta para ativar a captação real

- O usuário enviar o link do grupo anunciado.
- Confirmar conta remetente/provedor e capacidade de envio nesse grupo; o link sozinho não é uma credencial de envio.
- Implementar/configurar receiver e fila com CRM, assinatura, deduplicação e confirmações, conforme `FUNIL-COMERCIAL.md`. A listagem atual de funções Supabase não incluiu esse receiver ou as funções CRM de webhook/rotinas do repositório.
- Validar acesso Gemini e provedor/retencão, reativar/autorizar um runner de testes e concluir testes de navegador automatizados.
- Aprovar infraestrutura estável e publicação em produção. Nada desta etapa foi integrado à main ou publicado no domínio oficial.

Preferências persistidas na branch: `AGENTS.md` registra automatização de verificações, proibição de valores, WhatsApp oficial e separação dos consentimentos. Isso é memória de projeto versionada; não representa alteração retroativa de outros chats ou uma memória global fora deste projeto.
