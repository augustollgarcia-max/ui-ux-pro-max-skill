# HARA pública — proposta para revisão

Data: 08/11/2026. Estado: código local preparado; produção não alterada; publicação bloqueada até aprovação e validação dos pontos pendentes.

## Origem comprovada do site

- Domínio consultado: https://www.hairacademiadabeleza.com.br/ (HTTP 200).
- Projeto Vercel: `hair-academia-site`, ID `prj_Jh0m5zygnaUifRJAG6bM9SPD2G8S`.
- Deployment associado aos dois domínios oficiais: `dpl_2hVqe9zCrFAg7aBawhMzc6X4BSt7`, READY, target production.
- Repositório responsável: `augustollgarcia-max/ui-ux-pro-max-skill`, pasta `site-hair`.
- Commit publicado consultado: `43351a2a66c265b505493ae34fc438065524a9b0`.
- A página inicial baixada do domínio é idêntica byte a byte a `site-hair/index.html` nesse commit. SHA-256: `f3cf5a36a3064ccfad74a7fc933e6bc3749ed00d2c3fb15c0a461de296745f52`.
- A documentação desse repositório confirma que `hair-business-/site/publicar-www.sh` gera e copia as páginas comerciais para esse destino. A fonte de `business/rastreio.js` também é `hair-business-`.
- Não houve push, PR, merge, deploy, mudança de domínio, permissão, variável de ambiente ou Supabase nesta preparação.

## Alterações exatas preparadas

| Arquivo no repositório publicado | Alteração |
| --- | --- |
| `site-hair/api/hara-public.js` | Nova API pública separada. Somente POST JSON, origem exata, esquema estrito, consentimento versionado, texto até 500 caracteres e corpo até 2 KB. Sem conexão com Supabase, funções de alunos, CRM, LLM ou dados privados. Desativada por padrão. |
| `site-hair/hara/knowledge.cjs` | Base pública com respostas sobre cursos, academias apresentadas no site, localização e contato; retorna fontes. Sem preços ou datas inventados. |
| `site-hair/hara/chat.js` | Interface de chat com modal nativo, estilos isolados, perguntas rápidas, texto livre, consentimento, apagar conversa, mensagens de erro, prazo de 8 segundos e link para WhatsApp. Usa textContent para mensagens. Não usa cookies nem armazenamento persistente. |
| `site-hair/business/rastreio.js` | Acrescentar carregador independente do consentimento de marketing para `/hara/chat.js`. Abrir o atendimento não ativa pixels. A lógica existente de medição é preservada. |
| `site-hair/privacidade.html` | Acrescentar descrição específica do atendimento, dados técnicos, contadores, consentimento, descarte e encaminhamento. Retenção e região dos provedores precisam de validação antes de publicar o texto. |
| `scripts/hara/security.test.cjs` | 12 testes do handler e da seleção de respostas, com transporte Redis simulado. |
| `scripts/hara/browser.test.cjs` | Suíte preparada para 20 combinações de página e viewport, consentimento, envio, descarte, XSS, teclado, WhatsApp e recuperação de erro 429. Execução visual pendente. |
| `docs/hara/hair-business-source.patch` | Patch a aplicar também em `hair-business-/site/rastreio.js`, preservando a integração nas futuras sincronizações. Não foi aplicado remotamente. |

Arquivos adicionais em `docs/hara` registram esta revisão e o resultado dos testes. Nenhum arquivo do repositório Conexão Hair precisa mudar.

## Comportamento e limites

A primeira versão é um assistente de respostas verificadas por assuntos, com texto livre; não é o modelo generativo autenticado dos alunos. Perguntas complexas ou fora da base recebem encaminhamento. Não há compreensão de contexto entre perguntas. O nome HARA identifica o atendimento público da escola; a interface deixa claro que utiliza informações do site.

O visitante pode conversar na própria página. Somente o encaminhamento humano abre o WhatsApp. O destino fixo é `5516992558810` — (16) 99255-8810 — conforme README, llms.txt, política e CTAs publicados. A mensagem é genérica; o transcript não é anexado nem enviado automaticamente.

O site consultado lista quatro academias de barbearia. Não afirmar que essa lista exclui novas academias: a resposta diz expressamente “o site publicado apresenta”. Horários publicados, especialmente do Wolf, divergem do contexto recente das turmas. Datas, horários, preços e vagas sempre exigem confirmação comercial nesta versão.

Proteção proposta no servidor: 6 solicitações por minuto/IP, 30 por dia/IP e 1.000 por dia globalmente. Contagem atômica via Redis REST/Lua. Chaves com HMAC do IP e rotação diária; expiração de até 24 horas. Sem IP em texto nas chaves, sem perguntas em Redis e sem logs de conteúdo na aplicação. Falha do controle bloqueia o atendimento com 503. Origem não é autenticação: clientes fora de navegadores podem forjá-la, permanecendo sujeitos aos limites. IPs compartilhados podem compartilhar a franquia; ataques distribuídos podem atingir a franquia global. Não representa proteção completa contra DDoS ou custos de invocação, que exigem controle no provedor.

Consentimento não equivale a permissão de marketing. O navegador omite credenciais na API do chat. O bloqueio de padrões de telefone/documentos/email é defesa adicional, sem garantia de detectar todo dado pessoal. Nome ou informação sensível digitados livremente podem ser processados transitoriamente; o aviso orienta a não enviá-los. Não há promessa de monitorar identidade de visitantes. O acompanhamento preparado limita-se a contagens de segurança; não inclui painel, rastreamento de navegação nem histórico comercial.

## Configuração proposta, somente após aprovação

1. Criar ou selecionar Redis Upstash dedicado ao atendimento público, com limite de custo e região/retenção revisados. Não reaproveitar banco de alunos. Nenhum recurso foi criado nesta preparação; preço e plano ainda não foram selecionados ou contratados.
2. Configurar somente no ambiente de homologação: `HARA_RATE_REST_URL`, `HARA_RATE_REST_TOKEN`, `HARA_RATE_HMAC` (segredo aleatório de pelo menos 32 caracteres) e `HARA_PUBLIC_ENABLED=true`. Segredos ficam somente no servidor. Não solicitar nem incluir valores em chats, patches ou logs.
3. Publicar uma versão de homologação do projeto correto, após revisão do diff. Em preview, a API aceita apenas o hostname exato fornecido pela Vercel em `VERCEL_URL`, além dos domínios oficiais; não há wildcard de origens.
4. Executar testes reais de Redis (concorrência, 429, expiração, indisponibilidade), CSP, cabeçalho de IP, formulário e dispositivos. Revisar região/retenção/logs dos provedores. Validar conteúdo com a coordenação.
5. Apresentar resultado e versão final ao usuário e obter aprovação específica antes de merge ou publicação em produção. Nenhuma aprovação de homologação será tratada como aprovação de produção.
6. Após aprovação de produção: aplicar também o patch da fonte, integrar os arquivos revisados, configurar os mesmos nomes de variáveis em produção com credenciais próprias, publicar e comprovar atendimento no domínio oficial. Não alterar autenticação, CORS, RLS ou permissões dos alunos e administradores.

## Evidências de testes

| Verificação | Resultado observado |
| --- | --- |
| `node --test scripts/hara/security.test.cjs` | 12/12 passaram; dependência Redis simulada, sem validar o serviço remoto ou execução do Lua real. |
| `python3 scripts/site-hair/checar-contrato.py` | Passou: 52 links/botões, 33 IDs, 3 cursos, 4 conversões Ads, 2 scripts válidos. |
| `node --check` nos scripts novos e no rastreio alterado | Passou. |
| `git diff --check` | Passou. |
| Fonte e cópia de rastreio | Conteúdo original conferido antes de preparar o patch para a fonte. |
| Página inicial publicada | HTTP 200, conteúdo idêntico ao commit identificado; comprova a origem da versão atual, não publicação do chat novo. |
| Responsividade e fluxo no Chromium | Bloqueado: Chromium não iniciou, erro `socket() failed: Operation not permitted`. Suíte preparada, sem resultado de responsividade. |
| API HARA existente, POST sem credencial | HTTP 401 com `sessao_hara_invalida`, confirmado na função publicada. Nenhuma credencial foi usada. |
| Login de aluno e administrador ponta a ponta | Não executado; seus arquivos, credenciais, permissões e serviços não foram alterados. |
| Redis real, cabeçalhos Vercel e integração em preview | Não executados. Dependem de ambiente configurado e aprovação. |
| Novo chat no domínio oficial | Não publicado. |

O resultado bruto dos testes do handler está em `security-results.txt`. Não classificar estes resultados como auditoria completa, integração real testada ou produção pronta.

## Rollback e responsabilidade

Responsável pela decisão e conteúdo: coordenação HAIR/JHONES. Responsável técnico da publicação: a definir na aprovação. Emergência: desativar `HARA_PUBLIC_ENABLED` e aplicar a atualização de runtime/deployment exigida pela hospedagem; remover o carregador ou reverter o commit também retira a interface. Não é uma chave instantânea sem atualização do ambiente efetivo. Para rollback integral, reverter os commits da integração nos dois repositórios e redeployar; não há migração de dados a desfazer. O deployment anterior acima é referência de recuperação, a revalidar no momento da publicação.

Decisão atual: BLOQUEAR publicação. Código preparado e parte dos testes concluída. Faltam homologação real, validação visual, configuração dos provedores e aprovação expressa de produção.

## Fontes consultadas

- https://github.com/augustollgarcia-max/ui-ux-pro-max-skill/tree/43351a2a66c265b505493ae34fc438065524a9b0/site-hair
- https://github.com/augustollgarcia-max/ui-ux-pro-max-skill/blob/43351a2a66c265b505493ae34fc438065524a9b0/site-hair/README.md
- https://github.com/augustollgarcia-max/ui-ux-pro-max-skill/blob/43351a2a66c265b505493ae34fc438065524a9b0/site-hair/llms.txt
- https://github.com/augustollgarcia-max/hair-business-/blob/main/site/publicar-www.sh
- https://github.com/augustollgarcia-max/conexao-hair-deploy/blob/main/supabase/functions/hara/index.ts
- https://vercel.com/docs/headers/request-headers
- https://upstash.com/docs/redis/features/restapi
