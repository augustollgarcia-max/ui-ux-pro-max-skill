# Ajuste solicitado: chat discreto no site

A interface passa a ser um painel flutuante à direita, sem modal escurecido, sem bloquear rolagem, cliques ou navegação da página. A assistente oferece atender na própria página ou indicar os perfis das academias; os links de conteúdo seguem o mesmo site.

O histórico aceito fica somente na sessão da aba para continuar entre páginas. “Apagar conversa” remove esse histórico e o aceite. Essa alteração de armazenamento está descrita no termo e na política; não é gravação de conversa no servidor.

Em cada envio há apenas um checkbox de14px, com texto visível “Li e aceito” e link `/hara/termos`. Input e botão podem ser usados antes do aceite para que a tentativa de envio seja capturada: sem marcar, nenhum POST acontece; o checkbox recebe contorno e pulso suave por três ciclos. Movimento reduzido desativa a animação e preserva o destaque estático. O aceite nunca é marcado automaticamente.

Foi removida a caixa de resumo do formulário. O contexto acompanha a solicitação somente conforme o termo aceito, sem mostrar uma caixa de exemplo. Nome continua opcional; cidade, telefone e e-mail continuam exigidos no formulário de continuidade pelo WhatsApp, como solicitado antes.

Não há checkbox nem autorização para campanhas ou contatos futuros. O cliente envia `followup:false` e o servidor rejeita `followup:true`, inclusive em tentativa forjada. O aceite é apenas para o atendimento iniciado pela pessoa. As versões agora são `public-chat-v3` e `lead-contact-v2`.

Os23 testes locais de segurança e regras comerciais passaram. A execução automatizada completa no GitHub continua dependente da reativação de Actions no fork, já diagnosticada. As integrações reais de CRM/grupo e o acesso efetivo ao Gemini continuam nas condições registradas em `VERIFICACAO-FUNIL.md`; esta alteração visual não ativa serviços de produção.
